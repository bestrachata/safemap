// Core geographic types
export interface LatLng {
  lat: number
  lng: number
}

export interface Bounds {
  north: number
  south: number
  east: number
  west: number
}

// Safety scoring
export type HeatmapLayer = 'composite' | 'crime' | 'lighting' | 'visualAppeal' | 'crowdDensity'

export interface SafetyFactors {
  crimeScore: number         // 0–100, higher = safer
  lightingScore: number      // 0–100, higher = better lit
  visualAppealScore: number  // 0–100, higher = cleaner/nicer
  crowdScore: number         // 0–100, higher = more people around (safety in numbers)
}

export interface GridCell {
  id: string
  name: string
  bounds: Bounds
  center: LatLng
  factors: SafetyFactors
  compositeScore: number     // weighted combination of all factors
  polygon?: LatLng[]         // real GeoJSON exterior ring coords, if available
}

export interface CellDetail extends GridCell {
  description: string        // AI-generated safety description
  recommendations: string[]  // 2–3 safety tips
  imageUrls: string[]        // 3 representative images (Unsplash)
  incidentCount: number      // mock recent incident count
  bestTime: string           // e.g. "Daytime (9am–6pm)"
  worstTime: string          // e.g. "Late night (12am–4am)"
}

// Routing
export interface RouteStep {
  instruction: string
  distance: number           // meters
  duration: number           // seconds
  latlng: LatLng
  safetyAlert?: string       // optional warning for this step
}

export interface RouteResult {
  geometry: LatLng[]         // full polyline
  steps: RouteStep[]
  totalDistance: number      // meters
  totalDuration: number      // seconds
  safetyScore: number        // 0–100 composite safety of this route
  label: 'safest' | 'fastest'
}

// Geocoding
export interface GeocodingResult {
  label: string
  latlng: LatLng
}

// App modes
export type AppMode = 'explore' | 'navigate' | 'plan'

// Navigation state
export interface NavigationState {
  origin: GeocodingResult | null
  destination: GeocodingResult | null
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  isNavigating: boolean
  currentStepIndex: number
}

// Trip planner
export interface TripPreferences {
  origin: GeocodingResult | null
  destination: GeocodingResult | null
  departureTime: string
  safetyWeight: number    // 0–100
  speedWeight: number     // 0–100
  avoidCrowds: boolean
  avoidLowLight: boolean
}

export interface TripItinerary {
  route: RouteResult
  summary: string
  safetyHighlights: string[]
  warnings: string[]
  estimatedArrival: string
}
