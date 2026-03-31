import { IRoutingAdapter } from './interface'
import { LatLng, RouteResult, RouteStep } from '../../types'
import { SafetyDataAdapter } from '../safety-data'
import { routeSafetyScore } from '../../safetyScore'

// ── Haversine distance (meters) ───────────────────────────────────────────
function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// ── Interpolate N evenly-spaced points along a segment ───────────────────
function interp(a: LatLng, b: LatLng, steps: number): LatLng[] {
  const pts: LatLng[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
  }
  return pts
}

// ── Manhattan land-boundary table (lat → [westLng, eastLng]) ─────────────
// Each row gives the approximate westernmost (Hudson) and easternmost
// (East River) shoreline longitude at that latitude.  Points outside
// these bounds are over water and must be clamped back onto the island.
const MANHATTAN_BOUNDS: Array<[lat: number, west: number, east: number]> = [
  [40.700, -74.020, -73.973],   // south tip
  [40.710, -74.018, -73.975],
  [40.720, -74.014, -73.976],
  [40.730, -74.010, -73.974],
  [40.742, -74.007, -73.973],
  [40.755, -74.004, -73.970],
  [40.765, -74.002, -73.952],
  [40.775, -73.999, -73.946],
  [40.785, -73.998, -73.943],
  [40.800, -73.996, -73.940],
  [40.820, -73.988, -73.936],
  [40.840, -73.974, -73.933],
  [40.858, -73.961, -73.929],
  [40.882, -73.942, -73.924],   // inwood / north tip
]

function manhattanLngBounds(lat: number): [number, number] {
  if (lat <= MANHATTAN_BOUNDS[0][0]) return [MANHATTAN_BOUNDS[0][1], MANHATTAN_BOUNDS[0][2]]
  const last = MANHATTAN_BOUNDS[MANHATTAN_BOUNDS.length - 1]
  if (lat >= last[0]) return [last[1], last[2]]
  for (let i = 0; i < MANHATTAN_BOUNDS.length - 1; i++) {
    const [lat0, w0, e0] = MANHATTAN_BOUNDS[i]
    const [lat1, w1, e1] = MANHATTAN_BOUNDS[i + 1]
    if (lat >= lat0 && lat <= lat1) {
      const t = (lat - lat0) / (lat1 - lat0)
      return [w0 + t * (w1 - w0), e0 + t * (e1 - e0)]
    }
  }
  return [last[1], last[2]]
}

/** Clamp a point so it stays on Manhattan land (not in the rivers). */
function clampToManhattan(p: LatLng): LatLng {
  const lat = Math.max(40.700, Math.min(40.882, p.lat))
  const [west, east] = manhattanLngBounds(lat)
  // Keep a small inset from the shoreline so routes don't hug the edge
  const lng = Math.max(west + 0.002, Math.min(east - 0.002, p.lng))
  return { lat, lng }
}

// ── Build a grid-aligned L-shaped polyline clamped to land ───────────────
// cornerFirst = true  → go N/S first then E/W (follows avenues then streets)
// cornerFirst = false → go E/W first then N/S
function buildLRoute(origin: LatLng, dest: LatLng, cornerFirst: boolean): LatLng[] {
  const corner: LatLng = cornerFirst
    ? { lat: dest.lat,   lng: origin.lng }   // vertical then horizontal
    : { lat: origin.lat, lng: dest.lng }     // horizontal then vertical

  const clampedCorner = clampToManhattan(corner)

  const seg1 = interp(origin,        clampedCorner, 28).map(clampToManhattan)
  const seg2 = interp(clampedCorner, dest,          28).map(clampToManhattan)
  return [...seg1, ...seg2.slice(1)]
}

// ── Step-by-step directions ───────────────────────────────────────────────
function buildSteps(origin: LatLng, dest: LatLng, geometry: LatLng[]): RouteStep[] {
  const goingNorth = dest.lat > origin.lat
  const goingEast  = dest.lng > origin.lng
  const corner     = geometry[28]   // midpoint = corner of the L

  const latDist = haversine(origin, corner)
  const lngDist = haversine(corner, dest)

  return [
    {
      instruction: `Head ${goingNorth ? 'north' : 'south'} — follow the avenue`,
      distance: latDist, duration: latDist / 1.4,
      latlng: origin,
    },
    {
      instruction: `Turn ${goingEast ? 'right (east)' : 'left (west)'} at the intersection`,
      distance: 0, duration: 15,
      latlng: corner,
    },
    {
      instruction: `Continue ${goingEast ? 'east' : 'west'} toward your destination`,
      distance: lngDist, duration: lngDist / 1.4,
      latlng: corner,
    },
    {
      instruction: 'Arrive at your destination',
      distance: 0, duration: 0,
      latlng: dest,
    },
  ]
}

// ── Safety-alert annotations ──────────────────────────────────────────────
function annotateSteps(
  steps:    RouteStep[],
  geometry: LatLng[],
  cells:    import('../../types').GridCell[],
): RouteStep[] {
  return steps.map(step => {
    const nearby = geometry.filter(
      p => Math.abs(p.lat - step.latlng.lat) < 0.005 &&
           Math.abs(p.lng - step.latlng.lng) < 0.005
    )
    const scores = nearby.flatMap(p =>
      cells
        .filter(c => c.polygon && c.compositeScore < 45)
        .filter(c =>
          Math.abs(c.center.lat - p.lat) < 0.01 &&
          Math.abs(c.center.lng - p.lng) < 0.01
        )
        .map(c => c.compositeScore)
    )
    if (scores.length === 0) return step
    const minScore = Math.min(...scores)
    const safetyAlert =
      minScore < 30 ? `⚠ Very low safety score (${minScore}) — stay alert`
      : minScore < 45 ? `Caution: lower-safety zone nearby (score ${minScore})`
      : undefined
    return { ...step, safetyAlert }
  })
}

// ── Public adapter ────────────────────────────────────────────────────────
export const MockRoutingAdapter: IRoutingAdapter = {
  async getRoutes(origin: LatLng, destination: LatLng): Promise<RouteResult[]> {
    const cells = await SafetyDataAdapter.getGridCells()

    // Route A — avenue-first (N/S then E/W) — more typical for Manhattan travel
    const geoA   = buildLRoute(origin, destination, true)
    const stepsA = annotateSteps(buildSteps(origin, destination, geoA), geoA, cells)
    const distA  = geoA.reduce((s, p, i) => i === 0 ? 0 : s + haversine(geoA[i - 1], p), 0)
    const durA   = stepsA.reduce((s, st) => s + st.duration, 0)

    // Route B — cross-street first (E/W then N/S) — alternate path
    const geoB   = buildLRoute(origin, destination, false)
    const stepsB = annotateSteps(buildSteps(origin, destination, geoB), geoB, cells)
    const distB  = geoB.reduce((s, p, i) => i === 0 ? 0 : s + haversine(geoB[i - 1], p), 0)
    const durB   = stepsB.reduce((s, st) => s + st.duration, 0)

    const routes: RouteResult[] = [
      {
        geometry: geoA, steps: stepsA,
        totalDistance: distA, totalDuration: durA,
        safetyScore: routeSafetyScore(geoA, cells), label: 'safest',
      },
      {
        geometry: geoB, steps: stepsB,
        totalDistance: distB, totalDuration: durB,
        safetyScore: routeSafetyScore(geoB, cells), label: 'fastest',
      },
    ]

    // Ensure safest route is always first
    routes.sort((a, b) => b.safetyScore - a.safetyScore)
    routes[0].label = 'safest'
    if (routes[1]) routes[1].label = 'fastest'

    return routes
  },
}
