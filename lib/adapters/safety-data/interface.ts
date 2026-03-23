import { GridCell, CellDetail, Bounds } from '../../types'

export interface ISafetyDataAdapter {
  getGridCells(bounds?: Bounds): Promise<GridCell[]>
  getCellDetail(cellId: string): Promise<CellDetail>
}
