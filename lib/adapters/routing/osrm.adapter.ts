import { IRoutingAdapter } from './interface'
import { LatLng, RouteResult, RouteStep } from '../../types'
import { SafetyDataAdapter } from '../safety-data'
import { routeSafetyScore } from '../../safetyScore'
import { MockRoutingAdapter } from './mock.adapter'

// OSRM public demo server — free, no API key required.
// Falls back to MockRoutingAdapter if the server is unreachable.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const OSRM_TIMEOUT_MS = 7000

function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0
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

function parseSteps(legs: unknown[]): RouteStep[] {
  const steps: RouteStep[] = []
  ;(legs as Array<{ steps: unknown[] }>).forEach(leg => {
    ;(leg.steps as Array<{
      maneuver: { location: [number, number]; type: string; modifier?: string }
      name: string
      distance: number
      duration: number
    }>).forEach(step => {
      const type = step.maneuver.type
      const modifier = step.maneuver.modifier ?? ''
      let instruction = `Continue on ${step.name || 'the road'}`
      if (type === 'turn') instruction = `Turn ${modifier} onto ${step.name || 'the road'}`
      else if (type === 'depart') instruction = `Head ${modifier} on ${step.name || 'the road'}`
      else if (type === 'arrive') instruction = 'Arrive at your destination'
      else if (type === 'roundabout') instruction = `Take the roundabout onto ${step.name || 'the road'}`
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

export const OsrmAdapter: IRoutingAdapter = {
  async getRoutes(origin: LatLng, destination: LatLng): Promise<RouteResult[]> {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
    const url = `${OSRM_BASE}/${coords}?overview=full&geometries=polyline&steps=true&alternatives=true`

    // Abort the request if OSRM doesn't respond within the timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS)

    let data: { routes: { geometry: string; legs: unknown[]; distance: number; duration: number }[] }
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!response.ok) throw new Error(`OSRM responded ${response.status}`)
      data = await response.json()
    } catch (err) {
      clearTimeout(timer)
      console.warn('[SafeMap] OSRM unavailable, using mock routing —', (err as Error).message)
      return MockRoutingAdapter.getRoutes(origin, destination)
    }

    const cells = await SafetyDataAdapter.getGridCells()
    const routes: RouteResult[] = data.routes.map((r, i: number) => {
      const geometry = decodePolyline(r.geometry)
      const safetyScore = routeSafetyScore(geometry, cells)
      return {
        geometry,
        steps: parseSteps(r.legs),
        totalDistance: r.distance,
        totalDuration: r.duration,
        safetyScore,
        label: i === 0 ? 'fastest' : 'safest',
      } satisfies RouteResult
    })

    // Sort: highest safety score = safest route
    routes.sort((a, b) => b.safetyScore - a.safetyScore)
    if (routes.length > 0) routes[0].label = 'safest'
    if (routes.length > 1) routes[1].label = 'fastest'

    return routes
  },
}
