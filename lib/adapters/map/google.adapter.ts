import { IMapAdapter } from './interface'
import { LatLng } from '../../types'

// TODO: Google Maps requires a different integration (not tile-based).
// Switch to this provider by setting NEXT_PUBLIC_MAP_PROVIDER=google
// You will need to replace the Leaflet map component with @react-google-maps/api.
// This stub documents the expected config shape for the migration.
export const GoogleMapsAdapter: IMapAdapter = {
  getTileUrl: () => {
    throw new Error('Google Maps does not use tile URLs. Replace Leaflet with @react-google-maps/api.')
  },
  getTileAttribution: () => '&copy; Google Maps',
  getDefaultCenter: (): LatLng => ({ lat: 40.7549, lng: -73.9840 }),
  getDefaultZoom: () => 14,
  getMaxZoom: () => 22,
}
