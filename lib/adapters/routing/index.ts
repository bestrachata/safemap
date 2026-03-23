import { IRoutingAdapter } from './interface'
import { OsrmAdapter } from './osrm.adapter'
import { MapboxDirectionsAdapter } from './mapbox-directions.adapter'

const provider = process.env.NEXT_PUBLIC_ROUTING_PROVIDER ?? 'osrm'

const adapters: Record<string, IRoutingAdapter> = {
  osrm: OsrmAdapter,
  mapbox: MapboxDirectionsAdapter,
}

export const RoutingAdapter: IRoutingAdapter = adapters[provider] ?? OsrmAdapter
export type { IRoutingAdapter }
