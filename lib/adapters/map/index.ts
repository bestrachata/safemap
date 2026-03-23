import { IMapAdapter } from './interface'
import { LeafletAdapter } from './leaflet.adapter'
import { MapboxAdapter } from './mapbox.adapter'

const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'leaflet'

const adapters: Record<string, IMapAdapter> = {
  leaflet: LeafletAdapter,
  mapbox: MapboxAdapter,
}

export const MapAdapter: IMapAdapter = adapters[provider] ?? LeafletAdapter
export type { IMapAdapter }
