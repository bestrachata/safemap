import { LatLng } from './types'
import { countPerZone, incidentCountToScore, p90 } from './shootings'

export interface HateCrimeRecord {
  precinct: string
  date: string
  bias: string
  offense: string
  category: string
}

// Approximate centroids for all Manhattan NYPD precincts
const PRECINCT_CENTROIDS: Record<string, LatLng> = {
  '1':  { lat: 40.7128, lng: -74.0059 }, // Financial District
  '5':  { lat: 40.7142, lng: -73.9999 }, // Chinatown / Lower East Side
  '6':  { lat: 40.7334, lng: -74.0027 }, // Greenwich Village
  '7':  { lat: 40.7154, lng: -73.9835 }, // Lower East Side
  '9':  { lat: 40.7269, lng: -73.9800 }, // East Village
  '10': { lat: 40.7455, lng: -74.0019 }, // Chelsea
  '13': { lat: 40.7384, lng: -73.9850 }, // Gramercy
  '14': { lat: 40.7467, lng: -73.9913 }, // Midtown South
  '17': { lat: 40.7560, lng: -73.9675 }, // Midtown East
  '18': { lat: 40.7636, lng: -73.9876 }, // Midtown North / Hell's Kitchen
  '19': { lat: 40.7704, lng: -73.9580 }, // Upper East Side
  '20': { lat: 40.7844, lng: -73.9785 }, // Upper West Side
  '22': { lat: 40.7851, lng: -73.9683 }, // Central Park
  '23': { lat: 40.7959, lng: -73.9395 }, // East Harlem
  '24': { lat: 40.7900, lng: -73.9713 }, // Upper West Side North
  '25': { lat: 40.8050, lng: -73.9349 }, // East Harlem North
  '26': { lat: 40.8087, lng: -73.9647 }, // Morningside Heights
  '28': { lat: 40.8158, lng: -73.9543 }, // Central Harlem
  '30': { lat: 40.8231, lng: -73.9492 }, // Central Harlem North
  '32': { lat: 40.8261, lng: -73.9420 }, // Harlem
  '33': { lat: 40.8393, lng: -73.9396 }, // Washington Heights
  '34': { lat: 40.8676, lng: -73.9242 }, // Inwood
}

// In-memory cache
let _cache: HateCrimeRecord[] | null = null

/**
 * Fetch all NYPD hate crime incidents for Manhattan (county = NEW YORK).
 */
export async function getHateCrimes(): Promise<HateCrimeRecord[]> {
  if (_cache !== null) return _cache

  try {
    const params = new URLSearchParams({
      '$limit':  '10000',
      '$select': 'complaint_precinct_code,record_create_date,bias_motive_description,offense_description,offense_category',
      '$where':  "county='NEW YORK'",
    })
    const res = await fetch(
      `https://data.cityofnewyork.us/resource/bqiq-cu78.json?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: {
      complaint_precinct_code?: string
      record_create_date?: string
      bias_motive_description?: string
      offense_description?: string
      offense_category?: string
    }[] = await res.json()

    _cache = raw
      .filter(r => r.complaint_precinct_code && PRECINCT_CENTROIDS[r.complaint_precinct_code])
      .map(r => ({
        precinct: r.complaint_precinct_code!,
        date:     r.record_create_date ?? '',
        bias:     r.bias_motive_description ?? '',
        offense:  r.offense_description ?? '',
        category: r.offense_category ?? '',
      }))

    console.log(`[AssureWay] Loaded ${_cache.length} hate crime records from NYC Open Data`)
    return _cache
  } catch (err) {
    console.warn('[AssureWay] Could not load hate crime data —', err)
    _cache = []
    return []
  }
}

/** Convert hate crime records to LatLng points using precinct centroids. */
export function hateCrimesToPoints(records: HateCrimeRecord[]): LatLng[] {
  return records.map(r => PRECINCT_CENTROIDS[r.precinct]).filter(Boolean)
}

/**
 * Compute a per-zone hate-crime safety score (0–100, higher = safer).
 * Uses the same countPerZone + p90 normalisation as shooting data.
 */
export function scoreZonesFromHateCrimes(
  records: HateCrimeRecord[],
  zones: { id: string; polygon: LatLng[] }[]
): Map<string, number> {
  const points = hateCrimesToPoints(records)
  const fakeShootings = points.map(p => ({ lat: p.lat, lng: p.lng, date: '' }))
  const counts = countPerZone(fakeShootings, zones)

  const ref = p90([...counts.values()])
  const scores = new Map<string, number>()
  for (const [id, count] of counts) {
    scores.set(id, incidentCountToScore(count, ref))
  }
  return scores
}
