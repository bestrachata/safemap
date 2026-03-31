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

// Map display styles
export type MapStyle = 'light' | 'color' | 'dark' | 'satellite'

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

// Crime/data layer filters
export interface CrimeLayerFilter {
  yearMin:           number   // inclusive lower bound, e.g. 2015
  yearMax:           number   // inclusive upper bound, e.g. 2026
  showShootings:     boolean
  showHateCrimes:    boolean
  showCfsSevere:     boolean  // CFS severity 3
  showCfsDisorder:   boolean  // CFS severity 2
  showCfsQol:        boolean  // CFS severity 1
  showSyringes:      boolean
}

export const DEFAULT_CRIME_FILTER: CrimeLayerFilter = {
  yearMin:         2018,
  yearMax:         2026,
  showShootings:   true,
  showHateCrimes:  true,
  showCfsSevere:   true,
  showCfsDisorder: false,
  showCfsQol:      false,
  showSyringes:    true,
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
