import { ISafetyDataAdapter } from './interface'
import { GridCell, CellDetail, Bounds } from '../../types'
import { generateFromGeoJSON, generateFallbackCells, getCellDetail, GeoJSONFeature } from '../../mockData'

let _cachedCells: GridCell[] | null = null

async function loadCells(): Promise<GridCell[]> {
  if (_cachedCells) return _cachedCells

  try {
    const res = await fetch('/data/manhattan-neighborhoods.geojson')
    if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`)
    const geojson = await res.json()
    const features: GeoJSONFeature[] = geojson.features ?? []
    _cachedCells = generateFromGeoJSON(features)
  } catch (err) {
    console.warn('SafeMap: falling back to uniform grid —', err)
    _cachedCells = generateFallbackCells()
  }

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
