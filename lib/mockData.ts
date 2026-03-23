import { GridCell, CellDetail, SafetyFactors, Bounds, LatLng } from './types'

// Safety profile seeds — matched to GeoJSON features by name substring.
// Names align with NYC Open Data NTA 2020 ntaname values.
const NEIGHBORHOOD_SEEDS: Array<{
  name: string
  profile: SafetyFactors
}> = [
  // Lower Manhattan
  { name: 'Financial District-Battery Park City', profile: { crimeScore: 80, lightingScore: 88, visualAppealScore: 85, crowdScore: 74 } },
  { name: 'Tribeca-Civic Center',                 profile: { crimeScore: 85, lightingScore: 82, visualAppealScore: 90, crowdScore: 65 } },
  { name: 'The Battery',                          profile: { crimeScore: 88, lightingScore: 85, visualAppealScore: 92, crowdScore: 55 } },
  { name: 'SoHo-Little Italy-Hudson Square',      profile: { crimeScore: 78, lightingScore: 84, visualAppealScore: 91, crowdScore: 88 } },
  { name: 'Greenwich Village',                    profile: { crimeScore: 82, lightingScore: 86, visualAppealScore: 88, crowdScore: 90 } },
  { name: 'West Village',                         profile: { crimeScore: 84, lightingScore: 85, visualAppealScore: 90, crowdScore: 82 } },
  { name: 'Chinatown-Two Bridges',                profile: { crimeScore: 60, lightingScore: 72, visualAppealScore: 64, crowdScore: 90 } },
  { name: 'Lower East Side',                      profile: { crimeScore: 58, lightingScore: 65, visualAppealScore: 62, crowdScore: 78 } },
  { name: 'East Village',                         profile: { crimeScore: 68, lightingScore: 74, visualAppealScore: 72, crowdScore: 85 } },
  // Midtown
  { name: 'Chelsea-Hudson Yards',                 profile: { crimeScore: 75, lightingScore: 83, visualAppealScore: 84, crowdScore: 80 } },
  { name: "Hell's Kitchen",                       profile: { crimeScore: 65, lightingScore: 78, visualAppealScore: 70, crowdScore: 82 } },
  { name: 'Midtown South-Flatiron-Union Square',  profile: { crimeScore: 80, lightingScore: 88, visualAppealScore: 89, crowdScore: 87 } },
  { name: 'Midtown-Times Square',                 profile: { crimeScore: 70, lightingScore: 92, visualAppealScore: 82, crowdScore: 95 } },
  { name: 'Stuyvesant Town-Peter Cooper Village', profile: { crimeScore: 88, lightingScore: 87, visualAppealScore: 85, crowdScore: 68 } },
  { name: 'Gramercy',                             profile: { crimeScore: 84, lightingScore: 87, visualAppealScore: 86, crowdScore: 72 } },
  { name: 'Murray Hill-Kips Bay',                 profile: { crimeScore: 78, lightingScore: 86, visualAppealScore: 80, crowdScore: 78 } },
  { name: 'East Midtown-Turtle Bay',              profile: { crimeScore: 74, lightingScore: 91, visualAppealScore: 83, crowdScore: 93 } },
  { name: 'United Nations',                       profile: { crimeScore: 82, lightingScore: 90, visualAppealScore: 85, crowdScore: 70 } },
  // Upper West / East Side
  { name: 'Upper West Side-Lincoln Square',       profile: { crimeScore: 83, lightingScore: 85, visualAppealScore: 87, crowdScore: 80 } },
  { name: 'Upper West Side (Central)',            profile: { crimeScore: 84, lightingScore: 86, visualAppealScore: 88, crowdScore: 78 } },
  { name: 'Upper West Side-Manhattan Valley',     profile: { crimeScore: 74, lightingScore: 79, visualAppealScore: 78, crowdScore: 72 } },
  { name: 'Upper East Side-Lenox Hill',           profile: { crimeScore: 87, lightingScore: 89, visualAppealScore: 91, crowdScore: 78 } },
  { name: 'Upper East Side-Carnegie Hill',        profile: { crimeScore: 89, lightingScore: 90, visualAppealScore: 92, crowdScore: 72 } },
  { name: 'Upper East Side-Yorkville',            profile: { crimeScore: 85, lightingScore: 87, visualAppealScore: 88, crowdScore: 74 } },
  { name: 'Central Park',                         profile: { crimeScore: 80, lightingScore: 72, visualAppealScore: 96, crowdScore: 75 } },
  // Northern Manhattan
  { name: 'Morningside Heights',                  profile: { crimeScore: 65, lightingScore: 76, visualAppealScore: 72, crowdScore: 76 } },
  { name: 'Manhattanville-West Harlem',           profile: { crimeScore: 55, lightingScore: 70, visualAppealScore: 62, crowdScore: 78 } },
  { name: 'Hamilton Heights-Sugar Hill',          profile: { crimeScore: 52, lightingScore: 67, visualAppealScore: 60, crowdScore: 76 } },
  { name: 'Harlem (South)',                       profile: { crimeScore: 52, lightingScore: 68, visualAppealScore: 60, crowdScore: 82 } },
  { name: 'Harlem (North)',                       profile: { crimeScore: 50, lightingScore: 66, visualAppealScore: 58, crowdScore: 80 } },
  { name: 'East Harlem (South)',                  profile: { crimeScore: 48, lightingScore: 62, visualAppealScore: 55, crowdScore: 78 } },
  { name: 'East Harlem (North)',                  profile: { crimeScore: 46, lightingScore: 60, visualAppealScore: 53, crowdScore: 75 } },
  { name: 'Washington Heights (South)',           profile: { crimeScore: 50, lightingScore: 65, visualAppealScore: 58, crowdScore: 80 } },
  { name: 'Washington Heights (North)',           profile: { crimeScore: 52, lightingScore: 67, visualAppealScore: 60, crowdScore: 78 } },
  { name: 'Inwood',                               profile: { crimeScore: 55, lightingScore: 70, visualAppealScore: 65, crowdScore: 72 } },
  { name: 'Randall\'s Island',                   profile: { crimeScore: 75, lightingScore: 65, visualAppealScore: 80, crowdScore: 40 } },
  { name: 'Highbridge Park',                      profile: { crimeScore: 60, lightingScore: 62, visualAppealScore: 72, crowdScore: 45 } },
  { name: 'Inwood Hill Park',                     profile: { crimeScore: 65, lightingScore: 60, visualAppealScore: 85, crowdScore: 40 } },
]

// AI description templates keyed by score tier
const AI_DESCRIPTIONS: Record<string, string[]> = {
  excellent: [
    'This area is one of the safest in the city, with excellent lighting, frequent foot traffic, and very low crime rates. Residents and visitors consistently rate it highly for comfort and accessibility.',
    'A well-maintained neighborhood with active street life and strong community presence. Security cameras are prevalent and police patrols are regular, making this an ideal area for solo travelers.',
    'Characterized by upscale establishments, clean streets, and a welcoming atmosphere. This zone maintains some of the lowest incident rates in the city and is considered safe at all hours.',
  ],
  good: [
    'Generally a safe area with good lighting and moderate foot traffic throughout the day. Minor incidents occur occasionally, particularly late at night. Recommended to stay on main streets after midnight.',
    'A vibrant neighborhood with a mix of residential and commercial activity. Safety levels are above average, with most incidents being non-violent. Exercise normal urban awareness.',
    'Well-lit streets and active businesses create a relatively safe environment. The area sees increased police presence during evening hours, and incidents are infrequent compared to city averages.',
  ],
  moderate: [
    'A mixed-use area with varying safety levels depending on the block and time of day. Main thoroughfares are well-lit and busy, but side streets can feel isolated at night. Stay alert and stick to populated routes.',
    'This neighborhood has seen recent improvements in safety but still records above-average incident rates in certain pockets. Daytime is comfortable; exercise caution after 10pm.',
    'An area in transition — some blocks are vibrant and safe while others have lower lighting and less foot traffic. Recommended to travel with a companion at night and avoid less-traveled side streets.',
  ],
  poor: [
    'This area records higher-than-average incident rates, particularly during late night hours. Lighting infrastructure is limited in parts of this zone. Travel with caution, stay on well-lit routes, and keep valuables secure.',
    'A high-density neighborhood with limited lighting and historically elevated crime statistics. If traveling here, do so during daylight hours, stay on main streets, and be aware of your surroundings at all times.',
    'This zone has multiple active community safety initiatives underway, but incident rates remain above city average. Avoid this area after midnight unless necessary, and share your location with someone you trust.',
  ],
}

const RECOMMENDATIONS: Record<string, string[][]> = {
  excellent: [
    ['Walk freely day or night — this is one of the city\'s safest zones.', 'Well-lit streets and active nightlife make solo travel comfortable.', 'Emergency services response time in this area is among the city\'s best.'],
    ['This area has multiple 24-hour establishments for safety stops if needed.', 'Street cameras provide good coverage throughout.', 'Public transit stops are well-lit and regularly patrolled.'],
  ],
  good: [
    ['Stay on main avenues after 11pm for optimal safety.', 'Multiple convenience stores and restaurants stay open late.', 'Consider using ride-share for late-night travel from this area.'],
    ['Daytime is very comfortable — great for walking and exploring.', 'Keep phone visible; use earbuds cautiously in less busy spots.', 'A few blocks to the east have lower safety ratings; plan accordingly.'],
  ],
  moderate: [
    ['Stick to well-lit main streets, especially after dark.', 'Travel with a companion or use ride-share after 9pm.', 'Keep valuables in a front-facing bag or secure pocket.'],
    ['Be aware of your surroundings — avoid distractions like headphones at night.', 'Note the nearest 24hr pharmacy or convenience store as a safety anchor.', 'Save the local precinct number: call if you feel unsafe.'],
  ],
  poor: [
    ['Avoid this area after 10pm if possible.', 'If you must travel here, use ride-share directly to your destination.', 'Keep your phone charged and share your location with a trusted contact.'],
    ['Travel in groups whenever possible.', 'Stay on well-trafficked main streets only.', 'Trust your instincts — if something feels off, leave the area promptly.'],
  ],
}

const IMAGES: Record<string, string[]> = {
  excellent: [
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80',
    'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=400&q=80',
    'https://images.unsplash.com/photo-1499092346302-2a6d7abd5ef0?w=400&q=80',
  ],
  good: [
    'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=400&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80',
  ],
  moderate: [
    'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&q=80',
    'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80',
  ],
  poor: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80',
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&q=80',
    'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=400&q=80',
  ],
}

function scoreTier(score: number): 'excellent' | 'good' | 'moderate' | 'poor' {
  if (score >= 82) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 45) return 'moderate'
  return 'poor'
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function jitter(value: number, seed: number, range = 7): number {
  return Math.min(100, Math.max(0, Math.round(value + (seededRandom(seed) - 0.5) * range * 2)))
}

function computeComposite(factors: SafetyFactors): number {
  return Math.round(
    factors.crimeScore * 0.40 +
    factors.lightingScore * 0.25 +
    factors.visualAppealScore * 0.20 +
    factors.crowdScore * 0.15
  )
}

// Match a neighborhood name to the nearest seed by string similarity
function matchSeed(name: string): typeof NEIGHBORHOOD_SEEDS[0] {
  const lower = name.toLowerCase()
  // 1. Exact match
  const exact = NEIGHBORHOOD_SEEDS.find(s => s.name.toLowerCase() === lower)
  if (exact) return exact
  // 2. One contains the other
  const partial = NEIGHBORHOOD_SEEDS.find(s =>
    s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
  )
  if (partial) return partial
  // 3. Any shared word (handles "Harlem (South)" → "Harlem" seed, etc.)
  const words = lower.split(/[\s\-,()]+/).filter(w => w.length > 3)
  const wordMatch = NEIGHBORHOOD_SEEDS.find(s =>
    words.some(w => s.name.toLowerCase().includes(w))
  )
  if (wordMatch) return wordMatch
  // Default to midtown profile
  return NEIGHBORHOOD_SEEDS.find(s => s.name.includes('Midtown')) ?? NEIGHBORHOOD_SEEDS[0]
}

// Compute the bounding box of a polygon ring
function computeBounds(coords: LatLng[]): Bounds {
  return {
    north: Math.max(...coords.map(c => c.lat)),
    south: Math.min(...coords.map(c => c.lat)),
    east: Math.max(...coords.map(c => c.lng)),
    west: Math.min(...coords.map(c => c.lng)),
  }
}

// Compute the centroid of a polygon (simple average of vertices)
function computeCentroid(coords: LatLng[]): LatLng {
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length
  return { lat, lng }
}

// GeoJSON Polygon coordinate ring: [[lng, lat], ...] → LatLng[]
function ringToLatLng(ring: number[][]): LatLng[] {
  return ring.map(([lng, lat]) => ({ lat, lng }))
}

// Extract the exterior ring coordinates from a GeoJSON geometry
function extractRing(geometry: { type: string; coordinates: number[][][] | number[][][][] }): LatLng[] | null {
  if (geometry.type === 'Polygon') {
    return ringToLatLng((geometry.coordinates as number[][][])[0])
  }
  if (geometry.type === 'MultiPolygon') {
    // Use the largest ring
    const rings = (geometry.coordinates as number[][][][]).map(poly => poly[0])
    const largest = rings.reduce((a, b) => (b.length > a.length ? b : a))
    return ringToLatLng(largest)
  }
  return null
}

export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, string>
  geometry: { type: string; coordinates: number[][][] | number[][][][] }
}

// Build GridCell[] from GeoJSON FeatureCollection features
export function generateFromGeoJSON(features: GeoJSONFeature[]): GridCell[] {
  return features.map((feature, i) => {
    // NYC Open Data NTA uses 'ntaname'; fall back to 'name' for custom GeoJSON
    const name = feature.properties.ntaname ?? feature.properties.name ?? `Zone ${i + 1}`
    const ring = extractRing(feature.geometry)
    if (!ring || ring.length < 3) return null

    const bounds = computeBounds(ring)
    const center = computeCentroid(ring)
    const seed = matchSeed(name)

    const factors: SafetyFactors = {
      crimeScore: jitter(seed.profile.crimeScore, i * 4 + 1),
      lightingScore: jitter(seed.profile.lightingScore, i * 4 + 2),
      visualAppealScore: jitter(seed.profile.visualAppealScore, i * 4 + 3),
      crowdScore: jitter(seed.profile.crowdScore, i * 4 + 4),
    }

    return {
      id: `nbhd-${i}`,
      name,
      bounds,
      center,
      factors,
      compositeScore: computeComposite(factors),
      polygon: ring,
    } satisfies GridCell
  }).filter((c): c is NonNullable<typeof c> => c !== null) as GridCell[]
}

// Fallback: generate a simple rectangle grid for offline/error state
const FALLBACK_SEEDS = [
  { name: 'Midtown', lat: 40.7549, lng: -73.984, profile: { crimeScore: 72, lightingScore: 90, visualAppealScore: 82, crowdScore: 94 } },
  { name: 'Upper West Side', lat: 40.787, lng: -73.975, profile: { crimeScore: 83, lightingScore: 85, visualAppealScore: 87, crowdScore: 80 } },
  { name: 'Harlem', lat: 40.811, lng: -73.946, profile: { crimeScore: 52, lightingScore: 68, visualAppealScore: 60, crowdScore: 82 } },
]

export function generateFallbackCells(): GridCell[] {
  return FALLBACK_SEEDS.map((s, i) => {
    const factors: SafetyFactors = {
      crimeScore: jitter(s.profile.crimeScore, i * 4 + 1),
      lightingScore: jitter(s.profile.lightingScore, i * 4 + 2),
      visualAppealScore: jitter(s.profile.visualAppealScore, i * 4 + 3),
      crowdScore: jitter(s.profile.crowdScore, i * 4 + 4),
    }
    const SIZE = 0.012
    return {
      id: `fallback-${i}`,
      name: s.name,
      bounds: { north: s.lat + SIZE, south: s.lat - SIZE, east: s.lng + SIZE, west: s.lng - SIZE },
      center: { lat: s.lat, lng: s.lng },
      factors,
      compositeScore: computeComposite(factors),
    }
  })
}

export function getCellDetail(cell: GridCell, index: number): CellDetail {
  const tier = scoreTier(cell.compositeScore)
  const descArr = AI_DESCRIPTIONS[tier]
  const recArr = RECOMMENDATIONS[tier]
  const imgArr = IMAGES[tier]

  return {
    ...cell,
    description: descArr[index % descArr.length],
    recommendations: recArr[index % recArr.length],
    imageUrls: imgArr,
    incidentCount: tier === 'poor' ? 12 + (index % 8) : tier === 'moderate' ? 5 + (index % 5) : tier === 'good' ? 2 + (index % 3) : index % 2,
    bestTime: tier === 'poor' ? '9am – 5pm' : 'Anytime',
    worstTime: tier === 'poor' ? 'After 9pm' : tier === 'moderate' ? 'After 11pm' : 'After 2am',
  }
}
