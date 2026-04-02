'use client'

import { useState } from 'react'
import { GeocodingResult, TripPreferences, TripItinerary, RouteResult } from '@/lib/types'
import { RoutingAdapter } from '@/lib/adapters/routing'
import { GeocodingAdapter } from '@/lib/adapters/geocoding'
import { scoreToColor, scoreLabel, computeWeightedScore } from '@/lib/safetyScore'
import { SafetyDataAdapter } from '@/lib/adapters/safety-data'

interface Props {
  onClose: () => void
  onRoutesCalculated: (routes: RouteResult[]) => void
}

interface SliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  leftLabel: string
  rightLabel: string
  color?: string
}

function Slider({ label, value, onChange, leftLabel, rightLabel, color = '#0d9488' }: SliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${value}%, #E2E8F0 ${value}%)`,
          accentColor: color,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-400">{leftLabel}</span>
        <span className="text-xs text-slate-400">{rightLabel}</span>
      </div>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`
}

export default function TripPlannerPanel({ onClose, onRoutesCalculated }: Props) {
  const [prefs, setPrefs] = useState<TripPreferences>({
    origin: null,
    destination: null,
    departureTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    safetyWeight: 80,
    speedWeight: 40,
    avoidCrowds: false,
    avoidLowLight: true,
  })
  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [originResults, setOriginResults] = useState<GeocodingResult[]>([])
  const [destResults, setDestResults] = useState<GeocodingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function searchLocation(query: string, type: 'origin' | 'dest') {
    if (query.length < 3) return
    const res = await GeocodingAdapter.search(query)
    if (type === 'origin') setOriginResults(res.slice(0, 4))
    else setDestResults(res.slice(0, 4))
  }

  async function generateItinerary() {
    if (!prefs.origin || !prefs.destination) return
    setLoading(true); setError(null)
    try {
      const routes = await RoutingAdapter.getRoutes(prefs.origin.latlng, prefs.destination.latlng)
      // Re-score using custom weights
      const cells = await SafetyDataAdapter.getGridCells()
      routes.forEach(route => {
        const samplePoints = route.geometry.filter((_, i) => i % 5 === 0)
        let total = 0, count = 0
        samplePoints.forEach(point => {
          const cell = cells.find(c =>
            point.lat >= c.bounds.south && point.lat <= c.bounds.north &&
            point.lng >= c.bounds.west && point.lng <= c.bounds.east
          )
          if (cell) { total += computeWeightedScore(cell.factors, prefs); count++ }
        })
        route.safetyScore = count > 0 ? Math.round(total / count) : 68
      })
      routes.sort((a, b) => b.safetyScore - a.safetyScore)

      const best = routes[0]
      onRoutesCalculated(routes)

      const dep = new Date(prefs.departureTime)
      const arr = new Date(dep.getTime() + best.totalDuration * 1000)
      const arrStr = arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const highlights = [
        `Route safety score: ${best.safetyScore}/100 — ${scoreLabel(best.safetyScore)}`,
        prefs.avoidLowLight ? 'Prioritized well-lit streets throughout.' : 'Standard lighting consideration applied.',
        prefs.avoidCrowds ? 'Avoids high-density pedestrian areas.' : 'Takes advantage of crowd presence for safety.',
      ]
      const warnings = best.safetyScore < 65
        ? ['Some segments pass through moderate-safety zones — stay alert.', 'Consider traveling before dark for this route.']
        : ['Route is generally safe. Travel with normal awareness.']

      setItinerary({
        route: best,
        summary: `${formatDuration(best.totalDuration)} · ${formatDistance(best.totalDistance)} · Safety ${best.safetyScore}/100`,
        safetyHighlights: highlights,
        warnings,
        estimatedArrival: arrStr,
      })
    } catch {
      setError('Could not plan trip. Try different locations.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Trip Planner</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize your safety preferences</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Itinerary result */}
          {itinerary && (
            <div className="bg-green-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-sm font-semibold text-green-800">Trip Planned</p>
                  <p className="text-xs text-green-600 mt-0.5">{itinerary.summary}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-green-600">Arrival</p>
                  <p className="text-sm font-bold text-green-800">{itinerary.estimatedArrival}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {itinerary.safetyHighlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 text-xs">✓</span>
                    <p className="text-xs text-green-700">{h}</p>
                  </div>
                ))}
              </div>
              {itinerary.warnings.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 space-y-1">
                  {itinerary.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 text-xs">⚠</span>
                      <p className="text-xs text-amber-700">{w}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setItinerary(null)} className="text-xs text-green-600 underline">
                Adjust preferences
              </button>
            </div>
          )}

          {!itinerary && (
            <>
              {/* Origin */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">From</label>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <input value={originQuery} onChange={e => { setOriginQuery(e.target.value); searchLocation(e.target.value, 'origin') }}
                      placeholder={prefs.origin?.label.split(',')[0] ?? 'Starting point...'}
                      className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400" />
                  </div>
                  {originResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                      {originResults.map((r, i) => (
                        <button key={i} onClick={() => { setPrefs(p => ({ ...p, origin: r })); setOriginQuery(r.label.split(',')[0]); setOriginResults([]) }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-green-50 border-b border-slate-50 last:border-0">
                          <div className="font-medium text-slate-700 truncate">{r.label.split(',')[0]}</div>
                          <div className="text-slate-400 truncate">{r.label.split(',').slice(1, 3).join(',')}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">To</label>
                <div className="relative">
                  <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <input value={destQuery} onChange={e => { setDestQuery(e.target.value); searchLocation(e.target.value, 'dest') }}
                      placeholder={prefs.destination?.label.split(',')[0] ?? 'Destination...'}
                      className="flex-1 text-sm outline-none text-slate-700 placeholder:text-slate-400" />
                  </div>
                  {destResults.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                      {destResults.map((r, i) => (
                        <button key={i} onClick={() => { setPrefs(p => ({ ...p, destination: r })); setDestQuery(r.label.split(',')[0]); setDestResults([]) }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-green-50 border-b border-slate-50 last:border-0">
                          <div className="font-medium text-slate-700 truncate">{r.label.split(',')[0]}</div>
                          <div className="text-slate-400 truncate">{r.label.split(',').slice(1, 3).join(',')}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Departure time */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Departure Time</label>
                <input
                  type="datetime-local" value={prefs.departureTime}
                  onChange={e => setPrefs(p => ({ ...p, departureTime: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400"
                />
              </div>

              {/* Priority sliders */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">Priorities</label>
                <div className="space-y-4">
                  <Slider label="Safety Weight" value={prefs.safetyWeight} onChange={v => setPrefs(p => ({ ...p, safetyWeight: v }))} leftLabel="Less important" rightLabel="Most important" color="#0d9488" />
                  <Slider label="Speed Weight" value={prefs.speedWeight} onChange={v => setPrefs(p => ({ ...p, speedWeight: v }))} leftLabel="Safety first" rightLabel="Speed first" color="#3B82F6" />
                </div>
              </div>

              {/* Toggles */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">Avoid</label>
                <div className="space-y-2">
                  {[
                    { key: 'avoidCrowds', label: 'Crowded areas', icon: '👥' },
                    { key: 'avoidLowLight', label: 'Poorly lit streets', icon: '🌙' },
                  ].map(({ key, label, icon }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm text-slate-700 flex items-center gap-2"><span>{icon}</span>{label}</span>
                      <div
                        onClick={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof TripPreferences] }))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${prefs[key as keyof TripPreferences] ? 'bg-green-500' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[key as keyof TripPreferences] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            </>
          )}
        </div>

        {!itinerary && (
          <div className="px-6 pb-6 flex-shrink-0 border-t border-slate-100 pt-4">
            <button
              onClick={generateItinerary}
              disabled={!prefs.origin || !prefs.destination || loading}
              className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-40 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Planning...</>
              ) : 'Generate Safe Itinerary'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
