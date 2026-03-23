import { IRoutingAdapter } from './interface'
import { LatLng, RouteResult } from '../../types'

// TODO: Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to activate this adapter
// Switch by setting NEXT_PUBLIC_ROUTING_PROVIDER=mapbox
export const MapboxDirectionsAdapter: IRoutingAdapter = {
  async getRoutes(_origin: LatLng, _destination: LatLng): Promise<RouteResult[]> {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set')
    // TODO: Implement Mapbox Directions API call
    // https://docs.mapbox.com/api/navigation/directions/
    throw new Error('MapboxDirectionsAdapter: not yet implemented')
  },
}
