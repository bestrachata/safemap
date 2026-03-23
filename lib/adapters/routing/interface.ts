import { LatLng, RouteResult } from '../../types'

export interface IRoutingAdapter {
  getRoutes(origin: LatLng, destination: LatLng): Promise<RouteResult[]>
}
