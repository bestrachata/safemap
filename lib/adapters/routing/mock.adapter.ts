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

// ── Interpolate N evenly-spaced points along a lat/lng segment ────────────
function interp(a: LatLng, b: LatLng, steps: number): LatLng[] {
  const pts: LatLng[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
  }
  return pts
}

// ── Build a Manhattan-grid-style L-shaped polyline ────────────────────────
// Route goes vertical first (N/S), then horizontal (E/W) — matching NYC streets
function buildLRoute(origin: LatLng, dest: LatLng, via: LatLng): LatLng[] {
  const corner: LatLng = { lat: dest.lat, lng: origin.lng }
  const seg1 = interp(origin, corner, 20)
  const seg2 = interp(corner, dest, 20)
  // via point nudges the corner slightly for route variation
  void via
  return [...seg1, ...seg2.slice(1)]
}

// ── Build step-by-step directions ────────────────────────────────────────
function buildSteps(origin: LatLng, dest: LatLng, geometry: LatLng[]): RouteStep[] {
  const goingNorth = dest.lat > origin.lat
  const goingEast  = dest.lng > origin.lng
  const corner     = geometry[20] // midpoint = corner of the L

  const latDist = haversine(origin, corner)
  const lngDist = haversine(corner, dest)

  const steps: RouteStep[] = [
    {
      instruction: `Head ${goingNorth ? 'north' : 'south'} — follow the street`,
      distance:    latDist,
      duration:    latDist / 1.4,  // ~5 km/h walking
      latlng:      origin,
    },
    {
      instruction: `Turn ${goingEast ? 'right (east)' : 'left (west)'} at the intersection`,
      distance:    0,
      duration:    15,
      latlng:      corner,
    },
    {
      instruction: `Continue ${goingEast ? 'east' : 'west'} toward your destination`,
      distance:    lngDist,
      duration:    lngDist / 1.4,
      latlng:      corner,
    },
    {
      instruction: 'Arrive at your destination',
      distance:    0,
      duration:    0,
      latlng:      dest,
    },
  ]
  return steps
}

// ── Add safety alerts to steps based on zone scores ──────────────────────
function annotateSteps(steps: RouteStep[], geometry: LatLng[], cells: import('../../types').GridCell[]): RouteStep[] {
  return steps.map(step => {
    // Find nearby geometry points and check safety
    const nearby = geometry.filter(
      p => Math.abs(p.lat - step.latlng.lat) < 0.005 && Math.abs(p.lng - step.latlng.lng) < 0.005
    )
    const scores = nearby.flatMap(p =>
      cells
        .filter(c => c.polygon && c.compositeScore < 45)
        .filter(c => Math.abs(c.center.lat - p.lat) < 0.01 && Math.abs(c.center.lng - p.lng) < 0.01)
        .map(c => c.compositeScore)
    )
    if (scores.length === 0) return step
    const minScore = Math.min(...scores)
    const safetyAlert =
      minScore < 30 ? `⚠ Very low safety score (${minScore}) — stay alert in this area` :
      minScore < 45 ? `Caution: lower-safety zone nearby (score ${minScore})` :
      undefined
    return { ...step, safetyAlert }
  })
}

export const MockRoutingAdapter: IRoutingAdapter = {
  async getRoutes(origin: LatLng, destination: LatLng): Promise<RouteResult[]> {
    const cells = await SafetyDataAdapter.getGridCells()

    // Route A — standard L (vertical then horizontal)
    const geoA = buildLRoute(origin, destination, destination)
    const stepsA = annotateSteps(buildSteps(origin, destination, geoA), geoA, cells)
    const distA = geoA.reduce((s, p, i) => i === 0 ? 0 : s + haversine(geoA[i - 1], p), 0)
    const durA  = stepsA.reduce((s, st) => s + st.duration, 0)

    // Route B — alternate L (horizontal first then vertical)
    const cornerB: LatLng = { lat: origin.lat, lng: destination.lng }
    const geoB = [...interp(origin, cornerB, 20), ...interp(cornerB, destination, 20).slice(1)]
    const stepsB = annotateSteps(buildSteps(origin, destination, geoB), geoB, cells)
    const distB = geoB.reduce((s, p, i) => i === 0 ? 0 : s + haversine(geoB[i - 1], p), 0)
    const durB  = stepsB.reduce((s, st) => s + st.duration, 0)

    const routes: RouteResult[] = [
      {
        geometry:      geoA,
        steps:         stepsA,
        totalDistance: distA,
        totalDuration: durA,
        safetyScore:   routeSafetyScore(geoA, cells),
        label:         'safest',
      },
      {
        geometry:      geoB,
        steps:         stepsB,
        totalDistance: distB,
        totalDuration: durB,
        safetyScore:   routeSafetyScore(geoB, cells),
        label:         'fastest',
      },
    ]

    // Sort so safest is always first
    routes.sort((a, b) => b.safetyScore - a.safetyScore)
    routes[0].label = 'safest'
    if (routes[1]) routes[1].label = 'fastest'

    return routes
  },
}
