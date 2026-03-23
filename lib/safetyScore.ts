import { GridCell, HeatmapLayer, SafetyFactors, TripPreferences } from './types'

// Default factor weights for composite score
export const DEFAULT_WEIGHTS = {
  crime: 0.40,
  lighting: 0.25,
  visualAppeal: 0.20,
  crowd: 0.15,
}

export function computeCompositeScore(factors: SafetyFactors, weights = DEFAULT_WEIGHTS): number {
  return Math.round(
    factors.crimeScore * weights.crime +
    factors.lightingScore * weights.lighting +
    factors.visualAppealScore * weights.visualAppeal +
    factors.crowdScore * weights.crowd
  )
}

// Compute weighted score from trip preferences sliders
export function computeWeightedScore(factors: SafetyFactors, prefs: TripPreferences): number {
  const safetyNorm = prefs.safetyWeight / 100
  const w = {
    crime: 0.40 * (1 + safetyNorm * 0.5),
    lighting: 0.25 * (prefs.avoidLowLight ? 1.5 : 1),
    visualAppeal: 0.20,
    crowd: 0.15 * (prefs.avoidCrowds ? 0.3 : 1),
  }
  const total = w.crime + w.lighting + w.visualAppeal + w.crowd
  return Math.round(
    (factors.crimeScore * w.crime +
      factors.lightingScore * w.lighting +
      factors.visualAppealScore * w.visualAppeal +
      factors.crowdScore * w.crowd) / total
  )
}

// Get the score value for a specific heatmap layer
export function getLayerScore(cell: GridCell, layer: HeatmapLayer): number {
  switch (layer) {
    case 'composite': return cell.compositeScore
    case 'crime': return cell.factors.crimeScore
    case 'lighting': return cell.factors.lightingScore
    case 'visualAppeal': return cell.factors.visualAppealScore
    case 'crowdDensity': return cell.factors.crowdScore
  }
}

// Convert score 0–100 to a hex color (red → amber → green)
export function scoreToColor(score: number): string {
  if (score >= 82) return '#16A34A'    // green-600 — safe
  if (score >= 65) return '#65A30D'    // lime-600 — good
  if (score >= 50) return '#D97706'    // amber-600 — moderate
  if (score >= 35) return '#EA580C'    // orange-600 — concerning
  return '#DC2626'                      // red-600 — unsafe
}

// Convert score to Tailwind semantic class label
export function scoreLabel(score: number): string {
  if (score >= 82) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Moderate'
  if (score >= 35) return 'Concerning'
  return 'Unsafe'
}

export function scoreBgClass(score: number): string {
  if (score >= 82) return 'bg-green-50 text-green-700'
  if (score >= 65) return 'bg-lime-50 text-lime-700'
  if (score >= 50) return 'bg-amber-50 text-amber-700'
  if (score >= 35) return 'bg-orange-50 text-orange-700'
  return 'bg-red-50 text-red-700'
}

// Compute safety score for a route by sampling cells it passes through
export function routeSafetyScore(routePoints: Array<{ lat: number; lng: number }>, cells: GridCell[]): number {
  if (routePoints.length === 0) return 50
  let total = 0
  let count = 0
  // Sample every 5th point for performance
  const samplePoints = routePoints.filter((_, i) => i % 5 === 0)
  samplePoints.forEach(point => {
    const cell = cells.find(c =>
      point.lat >= c.bounds.south && point.lat <= c.bounds.north &&
      point.lng >= c.bounds.west && point.lng <= c.bounds.east
    )
    if (cell) { total += cell.compositeScore; count++ }
  })
  return count > 0 ? Math.round(total / count) : 68
}
