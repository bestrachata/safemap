import { IRoutingAdapter } from './interface'
import { LatLng, RouteResult, RouteStep } from '../../types'
import { SafetyDataAdapter } from '../safety-data'
import { routeSafetyScore } from '../../safetyScore'
import { MockRoutingAdapter } from './mock.adapter'

/**
 * Real-street routing via OSRM walking profile.
 *
 * Tries two free public endpoints in order — the second is the official
 * OpenStreetMap.de walking server which is more stable than the demo instance.
 * Falls back to the mock L-shape adapter only when both are unreachable.
 */

const TIMEOUT_MS = 12_000

// Tried in order; first successful response wins.
const ENDPOINTS = [
  // OSM-maintained walking server (most reliable, foot profile)
  'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  // OSRM demo server, walking profile
  'https://router.project-osrm.org/route/v1/walking',
]

// ── Polyline decoder (Google encoded polyline format) ────────────────────
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return points
}

// ── Turn-by-turn step parser ──────────────────────────────────────────────
function parseSteps(legs: unknown[]): RouteStep[] {
  const steps: RouteStep[] = []
  ;(legs as Array<{ steps: unknown[] }>).forEach(leg => {
    ;(leg.steps as Array<{
      maneuver: { location: [number, number]; type: string; modifier?: string }
      name: string
      distance: number
      duration: number
    }>).forEach(step => {
      const type     = step.maneuver.type
      const modifier = step.maneuver.modifier ?? ''
      const road     = step.name || 'the road'

      let instruction = `Continue on ${road}`
      if (type === 'turn')        instruction = `Turn ${modifier} onto ${road}`
      else if (type === 'depart') instruction = `Head ${modifier} on ${road}`
      else if (type === 'arrive') instruction = 'Arrive at your destination'
      else if (type === 'end of road') instruction = `At the end of the road, turn ${modifier} onto ${road}`
      else if (type === 'new name')    instruction = `Continue onto ${road}`
      else if (type === 'roundabout')  instruction = `Take the roundabout onto ${road}`

      steps.push({
        instruction,
        distance: step.distance,
        duration: step.duration,
        latlng: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
      })
    })
  })
  return steps
}

// ── Fetch helper with per-request timeout ────────────────────────────────
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ── Public adapter ────────────────────────────────────────────────────────
export const OsrmAdapter: IRoutingAdapter = {
  async getRoutes(origin: LatLng, destination: LatLng): Promise<RouteResult[]> {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
    const query  = '?overview=full&geometries=polyline&steps=true&alternatives=true'

    // Try each endpoint in order
    for (const base of ENDPOINTS) {
      try {
        const res = await fetchWithTimeout(`${base}/${coords}${query}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: {
          routes: { geometry: string; legs: unknown[]; distance: number; duration: number }[]
        } = await res.json()

        if (!data.routes?.length) throw new Error('empty response')

        const cells = await SafetyDataAdapter.getGridCells()

        const routes: RouteResult[] = data.routes.map((r, i) => {
          const geometry    = decodePolyline(r.geometry)
          const safetyScore = routeSafetyScore(geometry, cells)
          return {
            geometry,
            steps:         parseSteps(r.legs),
            totalDistance: r.distance,
            totalDuration: r.duration,
            safetyScore,
            label: i === 0 ? 'fastest' : 'fastest',
          } satisfies RouteResult
        })

        // Rank by safety: highest score = safest route shown first
        routes.sort((a, b) => b.safetyScore - a.safetyScore)
        if (routes[0]) routes[0].label = 'safest'
        if (routes[1]) routes[1].label = 'fastest'

        console.info(`[SafeMap] Routing via ${base.includes('openstreetmap.de') ? 'OSM.de walking' : 'OSRM walking'}`)
        return routes
      } catch (err) {
        console.warn(`[SafeMap] Routing endpoint ${base} failed —`, (err as Error).message)
        // Try next endpoint
      }
    }

    // All real endpoints failed — fall back to mock
    console.warn('[SafeMap] All routing endpoints unreachable, using mock L-shape fallback')
    return MockRoutingAdapter.getRoutes(origin, destination)
  },
}
