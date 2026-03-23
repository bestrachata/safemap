import { GeocodingResult, LatLng } from '../../types'

export interface IGeocodingAdapter {
  search(query: string): Promise<GeocodingResult[]>
  reverse(latlng: LatLng): Promise<string>
}
