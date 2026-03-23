import { IGeocodingAdapter } from './interface'
import { NominatimAdapter } from './nominatim.adapter'

const provider = process.env.NEXT_PUBLIC_GEOCODING_PROVIDER ?? 'nominatim'

const adapters: Record<string, IGeocodingAdapter> = {
  nominatim: NominatimAdapter,
}

export const GeocodingAdapter: IGeocodingAdapter = adapters[provider] ?? NominatimAdapter
export type { IGeocodingAdapter }
