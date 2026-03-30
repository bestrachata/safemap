import { IGeocodingAdapter } from './interface'
import { GeocodingResult, LatLng } from '../../types'

// OpenStreetMap Nominatim — free, no API key required
// Usage policy: max 1 req/sec, include a descriptive User-Agent
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export const NominatimAdapter: IGeocodingAdapter = {
  async search(query: string): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '6',
      countrycodes: 'us',
      // Bias results strongly toward Greater NYC
      viewbox: '-74.3,40.45,-73.65,40.95',
      bounded: '1',
    })
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'User-Agent': 'SafeMap/1.0 (safety-navigation-app)' },
    })
    if (!res.ok) throw new Error('Geocoding request failed')
    const data = await res.json()
    return data.map((item: { display_name: string; lat: string; lon: string }) => ({
      label: item.display_name,
      latlng: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
    }))
  },

  async reverse(latlng: LatLng): Promise<string> {
    const params = new URLSearchParams({
      lat: String(latlng.lat),
      lon: String(latlng.lng),
      format: 'json',
    })
    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: { 'User-Agent': 'SafeMap/1.0 (safety-navigation-app)' },
    })
    if (!res.ok) throw new Error('Reverse geocoding failed')
    const data = await res.json()
    return data.display_name ?? 'Unknown location'
  },
}
