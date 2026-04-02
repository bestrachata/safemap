import { LatLng } from './types'
import { countPerZone, p90, incidentCountToScore } from './shootings'

export interface CfsRecord {
  lat:      number
  lng:      number
  date:     string
  typeDesc: string
  severity: number  // 1–3 weight applied during zone scoring
}

/**
 * Radio-code prefixes classified by severity for safety scoring.
 *   3 = violent / serious crime in progress
 *   2 = disturbance / disorder / suspicious
 *   1 = lower-grade / quality-of-life
 */
const SEVERITY_MAP: { prefix: string; level: 1 | 2 | 3 }[] = [
  // Violent / serious (3)
  { prefix: '29',   level: 3 },  // Homicide
  { prefix: '41',   level: 3 },  // Robbery / assault
  { prefix: '39H',  level: 3 },  // Harassment in progress
  { prefix: '39P',  level: 3 },  // Crimes in progress – panic alarm
  { prefix: '10H',  level: 3 },  // Investigate – calls for help
  // Disturbance / disorder (2)
  { prefix: '52',   level: 2 },  // Disputes
  { prefix: '50P',  level: 2 },  // Disorderly persons
  { prefix: '32',   level: 2 },  // Larceny in progress
  { prefix: '10V',  level: 2 },  // Susp vehicle / outside
  { prefix: '10P',  level: 2 },  // Susp person / prowler
  { prefix: '10Y',  level: 2 },  // Investigate serious / other
  { prefix: '39',   level: 2 },  // Other crimes in progress (catch-all)
  // Lower-grade (1)
  { prefix: '22',   level: 1 },  // Larceny past
  { prefix: '42',   level: 1 },  // Quality of life
  { prefix: '11C',  level: 1 },  // Commercial alarm / burglary
]

function severityOf(radioCode: string): number {
  for (const { prefix, level } of SEVERITY_MAP) {
    if (radioCode.startsWith(prefix)) return level
  }
  return 0  // 0 = ignore (patrols, ambulance, transit inspections, etc.)
}

let _cache: CfsRecord[] | null = null

/**
 * Fetch recent crime/disorder calls for service in Manhattan.
 * Limited to 10 000 records (most recent) to keep load manageable.
 */
export async function getCallsForService(): Promise<CfsRecord[]> {
  if (_cache !== null) return _cache

  try {
    // Build a radio-code filter covering all relevant prefixes
    const prefixes = SEVERITY_MAP.map(s => `radio_code LIKE '${s.prefix}%'`).join(' OR ')
    const params   = new URLSearchParams({
      '$limit':  '10000',
      '$select': 'radio_code,typ_desc,latitude,longitude,incident_date',
      '$where':  `boro_nm='MANHATTAN' AND latitude IS NOT NULL AND (${prefixes})`,
      '$order':  'incident_date DESC',
    })
    const res = await fetch(
      `https://data.cityofnewyork.us/resource/n2zq-pubd.json?${params}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw: {
      radio_code?:    string
      typ_desc?:      string
      latitude?:      string
      longitude?:     string
      incident_date?: string
    }[] = await res.json()

    _cache = raw
      .filter(r => r.latitude && r.longitude && r.radio_code)
      .map(r => ({
        lat:      parseFloat(r.latitude!),
        lng:      parseFloat(r.longitude!),
        date:     r.incident_date ?? '',
        typeDesc: r.typ_desc ?? '',
        severity: severityOf(r.radio_code!),
      }))
      .filter(r => r.severity > 0 && !isNaN(r.lat) && !isNaN(r.lng))

    console.log(`[AssureWay] Loaded ${_cache.length} calls-for-service records from NYC Open Data`)
    return _cache
  } catch (err) {
    console.warn('[AssureWay] Could not load calls-for-service data —', err)
    _cache = []
    return []
  }
}

/**
 * Expand each CFS record into severity-weighted virtual points so that
 * a Level-3 incident counts 3× more than a Level-1 one during zone scoring.
 */
function expandPoints(records: CfsRecord[]): { lat: number; lng: number; date: string }[] {
  return records.flatMap(r =>
    Array(r.severity).fill({ lat: r.lat, lng: r.lng, date: r.date })
  )
}

/**
 * Compute per-zone safety scores from calls-for-service data (0–100, higher = safer).
 */
export function scoreZonesFromCfs(
  records: CfsRecord[],
  zones: { id: string; polygon: LatLng[] }[]
): Map<string, number> {
  const points = expandPoints(records)
  const counts = countPerZone(points, zones)
  const ref    = p90([...counts.values()])

  const scores = new Map<string, number>()
  for (const [id, count] of counts) {
    scores.set(id, incidentCountToScore(count, ref))
  }
  return scores
}
