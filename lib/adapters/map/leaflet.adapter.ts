import { IMapAdapter } from './interface'
import { LatLng } from '../../types'

// CartoDB Positron — clean light map, free, no API key required
export const LeafletAdapter: IMapAdapter = {
  getTileUrl: () => 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  getTileAttribution: () => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  getDefaultCenter: (): LatLng => ({ lat: 40.7549, lng: -73.9840 }),
  getDefaultZoom: () => 14,
  getMaxZoom: () => 19,
}
