import { LatLng } from '../../types'

export interface IMapAdapter {
  getTileUrl(): string
  getTileAttribution(): string
  getDefaultCenter(): LatLng
  getDefaultZoom(): number
  getMaxZoom(): number
}
