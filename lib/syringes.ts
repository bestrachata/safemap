import { LatLng } from './types'
import { countPerZone, p90, incidentCountToScore } from './shootings'

export interface SyringeRecord {
  precinct:  string
  location:  string
  date:      string
  total:     number   // total syringes collected in this pickup
}

// Reuse same Manhattan precinct centroids
const PRECINCT_CENTROIDS: Record<string, LatLng> = {
  '1':  { lat: 40.7128, lng: -74.0059 },
  '5':  { lat: 40.7142, lng: -73.9999 },
  '6':  { lat: 40.7334, lng: -74.0027 },
  '7':  { lat: 40.7154, lng: -73.9835 },
  '9':  { lat: 40.7269, lng: -73.9800 },
  '10': { lat: 40.7455, lng: -74.0019 },
  '13': { lat: 40.7384, lng: -73.9850 },
  '14': { lat: 40.7467, lng: -73.9913 },
  '17': { lat: 40.7560, lng: -73.9675 },
  '18': { lat: 40.7636, lng: -73.9876 },
  '19': { lat: 40.7704, lng: -73.9580 },
  '20': { lat: 40.7844, lng: -73.9785 },
  '22': { lat: 40.7851, lng: -73.9683 },
  '23': { lat: 40.7959, lng: -73.9395 },
  '24': { lat: 40.7900, lng: -73.9713 },
  '25': { lat: 40.8050, lng: -73.9349 },
  '26': { lat: 40.8087, lng: -73.9647 },
  '28': { lat: 40.8158, lng: -73.9543 },
  '30': { lat: 40.8231, lng: -73.9492 },
  '32': { lat: 40.8261, lng: -73.9420 },
  '33': { lat: 40.8393, lng: -73.9396 },
  '34': { lat: 40.8676, lng: -73.9242 },
}

let _cache: SyringeRecord[] | null = null

/** Fetch all syringe-collection events for Manhattan from NYC Open Data. */
export async function getSyringeData(): Promise<SyringeRecord[]> {
  if (_cache !== null) return _cache

  try {
    const params = new URLSearchParams({
      '$limit':  '50000',
      '$select': 'precinct,location,collected_date,total_syringes',
      '$where':  "borough='Manhattan' AND total_syringes IS NOT NULL",
    })
    const res = await fetch(
      `https://data.cityofnewyork.us/resource/t8xi-d5wb.json?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: {
      precinct?: string
      location?: string
      collected_date?: string
      total_syringes?: string
    }[] = await res.json()

    _cache = raw
      .filter(r => r.precinct && PRECINCT_CENTROIDS[r.precinct])
      .map(r => ({
        precinct: r.precinct!,
        location: r.location ?? '',
        date:     r.collected_date ?? '',
        total:    parseFloat(r.total_syringes ?? '0') || 0,
      }))

    console.log(`[AssureWay] Loaded ${_cache.length} syringe collection records from NYC Open Data`)
    return _cache
  } catch (err) {
    console.warn('[AssureWay] Could not load syringe data —', err)
    _cache = []
    return []
  }
}

/** Map syringe records to LatLng points via precinct centroid. */
export function syringesToPoints(records: SyringeRecord[]): LatLng[] {
  return records.map(r => PRECINCT_CENTROIDS[r.precinct]).filter(Boolean)
}

/**
 * Compute a per-zone visual-appeal safety score from syringe density (0–100, higher = cleaner).
 * We weight by total syringes, not just incident count, since volume matters.
 */
export function scoreZonesFromSyringes(
  records: SyringeRecord[],
  zones: { id: string; polygon: LatLng[] }[]
): Map<string, number> {
  // Expand records: repeat each record's precinct point weighted by total syringes
  // Approximation: one "virtual point" per 5 syringes — keeps counts manageable
  const expandedPoints = records.flatMap(r => {
    const pt = PRECINCT_CENTROIDS[r.precinct]
    if (!pt) return []
    const reps = Math.max(1, Math.round(r.total / 5))
    return Array(reps).fill({ lat: pt.lat, lng: pt.lng, date: r.date })
  })

  const counts = countPerZone(expandedPoints, zones)
  const ref    = p90([...counts.values()])

  const scores = new Map<string, number>()
  for (const [id, count] of counts) {
    scores.set(id, incidentCountToScore(count, ref))
  }
  return scores
}
