'use client'

import { useState, useEffect, useRef } from 'react'
import { GeocodingResult, NavigationState, RouteResult } from '@/lib/types'
import { RoutingAdapter } from '@/lib/adapters/routing'
import { GeocodingAdapter } from '@/lib/adapters/geocoding'
import { scoreToColor, scoreLabel } from '@/lib/safetyScore'

interface Props {
  open: boolean
  navState: NavigationState
  onNavStateChange: (state: NavigationState) => void
  onClose: () => void
}

const POPULAR_PLACES = [
  { icon: '🗽', label: 'Times Square',           latlng: { lat: 40.7580, lng: -73.9855 } },
  { icon: '🌳', label: 'Central Park',            latlng: { lat: 40.7851, lng: -73.9683 } },
  { icon: '🏛️', label: 'Grand Central Terminal',  latlng: { lat: 40.7527, lng: -73.9772 } },
  { icon: '🌉', label: 'Brooklyn Bridge',          latlng: { lat: 40.7061, lng: -73.9969 } },
  { icon: '🗼', label: 'Empire State Building',    latlng: { lat: 40.7484, lng: -73.9857 } },
  { icon: '🎭', label: 'Broadway',                 latlng: { lat: 40.7590, lng: -73.9845 } },
]

function fmt(seconds: number) {
  const m = Math.round(seconds / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}
function fmtDist(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

function useGeoSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const t = setTimeout(async () => {
      try { setResults((await GeocodingAdapter.search(query)).slice(0, 5)) }
      catch { setResults([]) }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  return { query, setQuery, results, clearResults: () => setResults([]), focused, setFocused }
}

function LocationInput({ placeholder, color, value, onChange, results, onSelect, onClear, focused, onFocus, onBlur }: {
  placeholder: string; color: string; value: string
  onChange: (v: string) => void; results: GeocodingResult[]
  onSelect: (r: GeocodingResult) => void; onClear: () => void
  focused: boolean; onFocus: () => void; onBlur: () => void
}) {
  const showSuggestions = focused && value.length < 3
  const showResults = results.length > 0 && !showSuggestions

  return (
    <div className="relative">
      <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors
        ${focused ? 'bg-white border border-green-200 shadow-sm' : 'bg-slate-50'}`}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <input
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={onFocus} onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
        />
        {value && (
          <button onClick={onClear} className="text-slate-300 hover:text-slate-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Popular place chips */}
      {showSuggestions && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
          <p className="px-3 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-50">
            Popular in NYC
          </p>
          <div className="max-h-48 overflow-y-auto">
            {POPULAR_PLACES.map((p, i) => (
              <button key={i}
                onMouseDown={e => e.preventDefault()}
                onClick={() => onSelect({ label: `${p.label}, New York, NY`, latlng: p.latlng })}
                className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-slate-50 last:border-0 flex items-center gap-2.5 transition-colors"
              >
                <span className="text-sm w-5 text-center">{p.icon}</span>
                <span className="text-sm font-medium text-slate-700">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geocoding results */}
      {showResults && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
          {results.map((r, i) => (
            <button key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(r)}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-slate-50 last:border-0 flex items-start gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{r.label.split(',')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{r.label.split(',').slice(1, 3).join(',')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function collectAlerts(route: RouteResult): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const step of route.steps ?? []) {
    if (step.safetyAlert && !seen.has(step.safetyAlert)) {
      seen.add(step.safetyAlert)
      out.push(step.safetyAlert)
    }
    if (out.length >= 2) break
  }
  return out
}

export default function NavigationPanel({ open, navState, onNavStateChange, onClose }: Props) {
  const origin      = useGeoSearch()
  const destination = useGeoSearch()
  const [loading, setLoading] = useState(false)

  // useRef keeps handlers from closing over stale navState
  const navRef = useRef(navState)
  useEffect(() => { navRef.current = navState }, [navState])

  function update(patch: Partial<NavigationState>) {
    const next = { ...navRef.current, ...patch }
    navRef.current = next
    onNavStateChange(next)
  }

  // Sync input labels with selected navState
  useEffect(() => {
    if (navState.origin?.label && origin.query !== navState.origin.label.split(',')[0]) {
      origin.setQuery(navState.origin.label.split(',')[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.origin])
  useEffect(() => {
    if (navState.destination?.label && destination.query !== navState.destination.label.split(',')[0]) {
      destination.setQuery(navState.destination.label.split(',')[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.destination])

  async function calculateRoutes(o: GeocodingResult, d: GeocodingResult) {
    setLoading(true)
    try {
      const routes = await RoutingAdapter.getRoutes(o.latlng, d.latlng)
      update({ origin: o, destination: d, routes, selectedRoute: routes[0] ?? null })
    } catch { update({ routes: [], selectedRoute: null }) }
    finally { setLoading(false) }
  }

  function handleOriginSelect(r: GeocodingResult) {
    origin.setQuery(r.label.split(',')[0]); origin.clearResults()
    const current = navRef.current
    if (current.destination) calculateRoutes(r, current.destination)
    else update({ origin: r })
  }

  function handleDestinationSelect(r: GeocodingResult) {
    destination.setQuery(r.label.split(',')[0]); destination.clearResults()
    const current = navRef.current
    if (current.origin) calculateRoutes(current.origin, r)
    else update({ destination: r })
  }

  function startNavigation() {
    update({ isNavigating: true, currentStepIndex: 0 })
  }

  function nextStep() {
    const steps = navRef.current.selectedRoute?.steps ?? []
    const cur = navRef.current.currentStepIndex ?? 0
    if (cur < steps.length - 1) update({ currentStepIndex: cur + 1 })
  }

  function prevStep() {
    const cur = navRef.current.currentStepIndex ?? 0
    if (cur > 0) update({ currentStepIndex: cur - 1 })
  }

  function reset() {
    origin.setQuery(''); origin.clearResults()
    destination.setQuery(''); destination.clearResults()
    onNavStateChange({ origin: null, destination: null, routes: [], selectedRoute: null, isNavigating: false, currentStepIndex: 0 })
    onClose()
  }

  if (!open) return null

  const { routes, selectedRoute, isNavigating, currentStepIndex } = navState

  // ─── Active turn-by-turn navigation ─────────────────────────────────────────
  if (isNavigating && selectedRoute) {
    const steps = selectedRoute.steps ?? []
    const step = steps[currentStepIndex ?? 0]
    const score = selectedRoute.safetyScore ?? 0
    const color = scoreToColor(score)

    return (
      <div className="absolute inset-x-0 top-0 z-[1001] bg-white border-b border-slate-100 shadow-md px-4 py-3">
        <div className="max-w-xl mx-auto flex items-start gap-3">
          {/* Safety dot */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${color}20` }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
              {step?.instruction ?? 'Follow the route'}
            </p>
            {step && (
              <p className="text-xs text-slate-400 mt-0.5">
                {fmtDist(step.distance)} · {fmt(step.duration)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {currentStepIndex! > 0 && (
              <button onClick={prevStep}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentStepIndex! < steps.length - 1 && (
              <button onClick={nextStep}
                className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <button onClick={reset}
              className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="max-w-xl mx-auto mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${((currentStepIndex! + 1) / steps.length) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
            {currentStepIndex! + 1} / {steps.length}
          </span>
        </div>
      </div>
    )
  }

  // ─── Route input / overview sheet ────────────────────────────────────────────
  return (
    <div className="absolute inset-x-0 bottom-16 z-[1001] sm:bottom-20 sm:left-auto sm:right-4 sm:inset-x-auto sm:w-full sm:max-w-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Navigate</h3>
          <button onClick={reset} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {/* Origin */}
          <LocationInput
            placeholder="From — your location or address"
            color="#22c55e"
            value={origin.query}
            onChange={origin.setQuery}
            results={origin.results}
            onSelect={handleOriginSelect}
            onClear={() => { origin.setQuery(''); origin.clearResults(); update({ origin: null, routes: [], selectedRoute: null }) }}
            focused={origin.focused}
            onFocus={() => origin.setFocused(true)}
            onBlur={() => setTimeout(() => origin.setFocused(false), 150)}
          />

          {/* Swap button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                const cur = navRef.current
                if (cur.origin && cur.destination) {
                  origin.setQuery(cur.destination.label.split(',')[0])
                  destination.setQuery(cur.origin.label.split(',')[0])
                  calculateRoutes(cur.destination, cur.origin)
                }
              }}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-green-50 transition-colors"
              title="Swap origin and destination"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Destination */}
          <LocationInput
            placeholder="To — destination"
            color="#ef4444"
            value={destination.query}
            onChange={destination.setQuery}
            results={destination.results}
            onSelect={handleDestinationSelect}
            onClear={() => { destination.setQuery(''); destination.clearResults(); update({ destination: null, routes: [], selectedRoute: null }) }}
            focused={destination.focused}
            onFocus={() => destination.setFocused(true)}
            onBlur={() => setTimeout(() => destination.setFocused(false), 150)}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="px-4 pb-4 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Finding safest routes…</span>
          </div>
        )}

        {/* Route results */}
        {!loading && routes.length > 0 && selectedRoute && (
          <div className="px-4 pb-4 space-y-3">
            {/* Selected route summary card */}
            <div className="bg-slate-50 rounded-2xl p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ color: scoreToColor(selectedRoute.safetyScore ?? 0), backgroundColor: `${scoreToColor(selectedRoute.safetyScore ?? 0)}18` }}>
                      {scoreLabel(selectedRoute.safetyScore ?? 0)}
                    </span>
                    <span className="text-xs text-slate-400">{fmtDist(selectedRoute.totalDistance)}</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {fmt(selectedRoute.totalDuration)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
                  style={{ borderColor: scoreToColor(selectedRoute.safetyScore ?? 0), color: scoreToColor(selectedRoute.safetyScore ?? 0) }}>
                  <span className="text-sm font-black">{selectedRoute.safetyScore ?? '—'}</span>
                </div>
              </div>

              {/* Safety alerts */}
              {collectAlerts(selectedRoute).map((a, i) => (
                <div key={i} className="mt-2.5 flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>

            {/* Route options */}
            {routes.length > 1 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Route options</p>
                {routes.map((r, i) => (
                  <button key={i} onClick={() => update({ selectedRoute: r })}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left
                      ${selectedRoute === r
                        ? 'border-green-200 bg-green-50'
                        : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{fmt(r.totalDuration)}</span>
                        <span className="text-xs text-slate-400">{fmtDist(r.totalDistance)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0"
                      style={{ color: scoreToColor(r.safetyScore ?? 0) }}>
                      Safety {r.safetyScore ?? '—'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Start button */}
            <button onClick={startNavigation}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm">
              Start Navigation
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && routes.length === 0 && (
          <div className="px-4 pb-5 text-center">
            <p className="text-xs text-slate-400">Enter an origin and destination to find the safest route.</p>
          </div>
        )}
      </div>
    </div>
  )
}
