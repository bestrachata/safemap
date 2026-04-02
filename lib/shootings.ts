import { LatLng } from './types'

export interface ShootingPoint {
  lat: number
  lng: number
  date: string
}

// In-memory cache — fetched once per session
let _cache: ShootingPoint[] | null = null

/**
 * Fetch all NYPD shooting incidents for Manhattan from NYC Open Data.
 * Results are cached in memory after the first call.
 */
export async function getShootings(): Promise<ShootingPoint[]> {
  if (_cache !== null) return _cache

  try {
    const params = new URLSearchParams({
      '$limit':  '10000',
      '$select': 'latitude,longitude,occur_date',
      '$where':  "boro='MANHATTAN' AND latitude IS NOT NULL",
    })
    const res = await fetch(
      `https://data.cityofnewyork.us/resource/5ucz-vwe8.json?${params}`,
      { next: { revalidate: 86400 } }   // cache for 24 h in Next.js
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: { latitude?: string; longitude?: string; occur_date?: string }[] = await res.json()

    _cache = raw
      .map(r => ({
        lat:  parseFloat(r.latitude  ?? ''),
        lng:  parseFloat(r.longitude ?? ''),
        date: r.occur_date ?? '',
      }))
      .filter(p => !isNaN(p.lat) && !isNaN(p.lng))

    console.log(`[AssureWay] Loaded ${_cache.length} shooting incidents from NYC Open Data`)
    return _cache
  } catch (err) {
    console.warn('[AssureWay] Could not load shooting data — using mock crime scores', err)
    _cache = []
    return []
  }
}

/**
 * Ray-casting point-in-polygon.
 * polygon uses our LatLng format { lat, lng }.
 */
export function pointInPolygon(lat: number, lng: number, polygon: LatLng[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { lat: yi, lng: xi } = polygon[i]
    const { lat: yj, lng: xj } = polygon[j]
    const intersect =
      (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Build a bounding-box for quick pre-filtering (avoids full polygon check for far-away points).
 */
export function zoneBounds(polygon: LatLng[]) {
  let minLat = Infinity, maxLat = -Infinity
  let minLng = Infinity, maxLng = -Infinity
  for (const { lat, lng } of polygon) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  return { minLat, maxLat, minLng, maxLng }
}

/**
 * Count how many shooting incidents fall inside each zone polygon.
 * Uses bounding-box pre-filtering to stay fast.
 */
export function countPerZone(
  shootings: ShootingPoint[],
  zones: { id: string; polygon: LatLng[] }[]
): Map<string, number> {
  const counts = new Map<string, number>(zones.map(z => [z.id, 0]))
  const bounds = zones.map(z => ({ id: z.id, bb: zoneBounds(z.polygon), polygon: z.polygon }))

  for (const { lat, lng } of shootings) {
    for (const zone of bounds) {
      const { minLat, maxLat, minLng, maxLng } = zone.bb
      if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) continue
      if (pointInPolygon(lat, lng, zone.polygon)) {
        counts.set(zone.id, (counts.get(zone.id) ?? 0) + 1)
        break // each shooting belongs to at most one zone
      }
    }
  }
  return counts
}

/**
 * Convert a raw incident count to a crime safety score (0–100, higher = safer).
 * Uses a soft-cap so extreme outliers don't compress the middle range.
 */
export function incidentCountToScore(count: number, p90: number): number {
  if (p90 === 0) return 85
  // Anything above the 90th-percentile zone count is mapped to score ~10
  const ratio = Math.min(count / p90, 1)
  return Math.round(95 - ratio * 85)
}

/** Return the 90th-percentile value from an array of numbers. */
export function p90(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.9)]
}
