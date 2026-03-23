// Central adapter config — controls which provider is active via env vars.
// To switch providers: update the relevant env var and redeploy.
// No code changes required.

export const ADAPTER_CONFIG = {
  map: process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'leaflet',
  routing: process.env.NEXT_PUBLIC_ROUTING_PROVIDER ?? 'osrm',
  geocoding: process.env.NEXT_PUBLIC_GEOCODING_PROVIDER ?? 'nominatim',
  safetyData: process.env.NEXT_PUBLIC_SAFETY_DATA_PROVIDER ?? 'mock',
} as const
