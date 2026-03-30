import { ISafetyDataAdapter } from './interface'
import { GridCell, CellDetail, Bounds } from '../../types'
import { generateFromGeoJSON, generateFallbackCells, getCellDetail, GeoJSONFeature } from '../../mockData'
import { getShootings, countPerZone, incidentCountToScore, p90 } from '../../shootings'
import { getHateCrimes, scoreZonesFromHateCrimes } from '../../hateCrimes'
import { getSyringeData, scoreZonesFromSyringes } from '../../syringes'
import { getCallsForService, scoreZonesFromCfs } from '../../callsForService'
import { computeCompositeScore } from '../../safetyScore'

let _cachedCells: GridCell[] | null = null

async function loadCells(): Promise<GridCell[]> {
  if (_cachedCells) return _cachedCells

  // 1. Load zone polygons from GeoJSON
  let cells: GridCell[]
  try {
    const res = await fetch('/data/manhattan-neighborhoods.geojson')
    if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`)
    const geojson = await res.json()
    const features: GeoJSONFeature[] = geojson.features ?? []
    cells = generateFromGeoJSON(features)
  } catch (err) {
    console.warn('SafeMap: falling back to uniform grid —', err)
    cells = generateFallbackCells()
  }

  // 2. Fetch all real datasets in parallel and patch safety scores per zone
  try {
    const zones = cells
      .filter(c => c.polygon && c.polygon.length > 2)
      .map(c => ({ id: c.id, polygon: c.polygon! }))

    const [shootings, hateCrimes, syringes, cfsRecords] = await Promise.all([
      getShootings(), getHateCrimes(), getSyringeData(), getCallsForService(),
    ])

    // ── Crime score ──────────────────────────────────────────────────────────
    // Shootings: 50% — precise GPS, most severe
    const shootingCounts = countPerZone(shootings, zones)
    const shootingRef    = p90([...shootingCounts.values()])

    // Hate crimes: 20% — precinct centroid approx
    const hateCrimeScores = scoreZonesFromHateCrimes(hateCrimes, zones)

    // Calls for service: 30% — precise GPS, severity-weighted, broadest coverage
    const cfsScores = scoreZonesFromCfs(cfsRecords, zones)

    // ── Visual appeal score ──────────────────────────────────────────────────
    // Syringe density: 40% (real data) + 60% mock environmental estimate
    const syringeScores = scoreZonesFromSyringes(syringes, zones)

    cells = cells.map(cell => {
      // Crime blend
      const sCount     = shootingCounts.get(cell.id) ?? 0
      const shootScore = incidentCountToScore(sCount, shootingRef)
      const hateScore  = hateCrimeScores.get(cell.id) ?? cell.factors.crimeScore
      const cfsScore   = cfsScores.get(cell.id)       ?? cell.factors.crimeScore
      const crimeScore = Math.round(shootScore * 0.50 + hateScore * 0.20 + cfsScore * 0.30)

      // Visual appeal blend
      const syringeScore      = syringeScores.get(cell.id) ?? cell.factors.visualAppealScore
      const visualAppealScore = Math.round(cell.factors.visualAppealScore * 0.6 + syringeScore * 0.4)

      const newFactors = { ...cell.factors, crimeScore, visualAppealScore }
      return { ...cell, factors: newFactors, compositeScore: computeCompositeScore(newFactors) }
    })

    console.log(
      `[SafeMap] Scores updated — ${shootings.length} shootings, ` +
      `${hateCrimes.length} hate crimes, ${syringes.length} syringe pickups, ` +
      `${cfsRecords.length} calls for service`
    )
  } catch (err) {
    console.warn('[SafeMap] Could not apply crime data to scores —', err)
  }

  _cachedCells = cells
  return _cachedCells
}

export const MockSafetyDataAdapter: ISafetyDataAdapter = {
  async getGridCells(bounds?: Bounds): Promise<GridCell[]> {
    const all = await loadCells()
    if (!bounds) return all
    return all.filter(cell =>
      cell.center.lat >= bounds.south && cell.center.lat <= bounds.north &&
      cell.center.lng >= bounds.west && cell.center.lng <= bounds.east
    )
  },

  async getCellDetail(cellId: string): Promise<CellDetail> {
    const all = await loadCells()
    const index = all.findIndex(c => c.id === cellId)
    const cell = all[index]
    if (!cell) throw new Error(`Cell ${cellId} not found`)
    return getCellDetail(cell, index)
  },
}
