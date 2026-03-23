import { IMapAdapter } from './interface'
import { LatLng } from '../../types'

// TODO: Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to activate this adapter
// Switch to this provider by setting NEXT_PUBLIC_MAP_PROVIDER=mapbox
export const MapboxAdapter: IMapAdapter = {
  getTileUrl: () => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${token}`
  },
  getTileAttribution: () => '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
  getDefaultCenter: (): LatLng => ({ lat: 40.7549, lng: -73.9840 }),
  getDefaultZoom: () => 14,
  getMaxZoom: () => 22,
}
