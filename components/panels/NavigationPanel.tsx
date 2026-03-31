'use client'

import { useState, useEffect, useRef } from 'react'
import { GeocodingResult, NavigationState, RouteResult } from '@/lib/types'
import { RoutingAdapter } from '@/lib/adapters/routing'
import { GeocodingAdapter } from '@/lib/adapters/geocoding'
import { scoreToColor, scoreLabel, DEFAULT_WEIGHTS } from '@/lib/safetyScore'
import { SELF_USER } from '@/lib/friendData'

const MY_LOCATION: GeocodingResult = {
  label: 'My Location, Midtown Manhattan, NY',
  latlng: { lat: SELF_USER.lat, lng: SELF_USER.lng },
}

// ── Route criteria ────────────────────────────────────────────────────────────
interface RouteCriteria {
  crime:    boolean
  lighting: boolean
  visual:   boolean
  crowd:    boolean
}

const CRITERIA_META: { key: keyof RouteCriteria; icon: string; label: string }[] = [
  { key: 'crime',    icon: '🔒', label: 'Crime History' },
  { key: 'lighting', icon: '💡', label: 'Lighting' },
  { key: 'visual',   icon: '🌿', label: 'Environment' },
  { key: 'crowd',    icon: '👥', label: 'Crowd Safety' },
]

function adjustedScore(route: RouteResult, crit: RouteCriteria): number {
  // Re-weight composite only from active criteria, falling back to base safetyScore
  const activeWeights = {
    crime:    crit.crime    ? DEFAULT_WEIGHTS.crime    : 0,
    lighting: crit.lighting ? DEFAULT_WEIGHTS.lighting : 0,
    visualAppeal: crit.visual ? DEFAULT_WEIGHTS.visualAppeal : 0,
    crowd:    crit.crowd    ? DEFAULT_WEIGHTS.crowd    : 0,
  }
  const total = Object.values(activeWeights).reduce((s, w) => s + w, 0)
  if (total === 0) return route.safetyScore
  // The route safetyScore is a composite — rescale proportionally
  const base = route.safetyScore
  const ratio = total / (DEFAULT_WEIGHTS.crime + DEFAULT_WEIGHTS.lighting + DEFAULT_WEIGHTS.visualAppeal + DEFAULT_WEIGHTS.crowd)
  return Math.round(50 + (base - 50) * ratio)
}

interface Props {
  open: boolean
  navState: NavigationState
  onNavStateChange: (state: NavigationState) => void
  onClose: () => void
}

// Pre-resolved popular NYC places — each is a ready-to-use GeocodingResult
// with a clear address subtitle so users know exactly what they're selecting.
const POPULAR_PLACES: GeocodingResult[] = [
  { label: 'Times Square, West 42nd St, Midtown Manhattan, NY',          latlng: { lat: 40.7580, lng: -73.9855 } },
  { label: 'Central Park, 59th St to 110th St, Manhattan, NY',           latlng: { lat: 40.7851, lng: -73.9683 } },
  { label: 'Grand Central Terminal, 89 E 42nd St, Midtown Manhattan, NY',latlng: { lat: 40.7527, lng: -73.9772 } },
  { label: 'Empire State Building, 350 5th Ave, Midtown Manhattan, NY',  latlng: { lat: 40.7484, lng: -73.9857 } },
  { label: 'Brooklyn Bridge, Tillary St & Adams St, Brooklyn, NY',       latlng: { lat: 40.7061, lng: -73.9969 } },
  { label: 'Broadway, Theater District, Midtown Manhattan, NY',          latlng: { lat: 40.7590, lng: -73.9845 } },
  { label: 'Manhattan Bridge, Entrance at Canal St, Manhattan, NY',      latlng: { lat: 40.7078, lng: -73.9903 } },
  { label: 'Battery Park, State St & Battery Pl, Lower Manhattan, NY',   latlng: { lat: 40.7033, lng: -74.0170 } },
  { label: 'MoMA, 11 W 53rd St, Midtown Manhattan, NY',                  latlng: { lat: 40.7614, lng: -73.9776 } },
  { label: 'Madison Square Garden, 4 Pennsylvania Plaza, Chelsea, NY',   latlng: { lat: 40.7505, lng: -73.9934 } },
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

function LocationInput({ placeholder, color, value, onChange, results, onSelect, onClear, focused, onFocus, onBlur, showMyLocation }: {
  placeholder: string; color: string; value: string
  onChange: (v: string) => void; results: GeocodingResult[]
  onSelect: (r: GeocodingResult) => void; onClear: () => void
  focused: boolean; onFocus: () => void; onBlur: () => void
  showMyLocation?: boolean
}) {
  const showPopular = focused && value.length < 3 && results.length === 0
  const showResults = focused && results.length > 0

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

      {/* Suggestions dropdown */}
      {showPopular && (
        <div className="absolute bottom-full mb-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">

          {/* ── My Location — pinned at top for origin input only ── */}
          {showMyLocation && (
            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(MY_LOCATION)}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-green-100 flex items-center gap-2 transition-colors"
            >
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-700">My current location</p>
                <p className="text-xs text-slate-400">Midtown Manhattan, NY</p>
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">GPS</span>
            </button>
          )}

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 pt-2.5 pb-1">
            Popular in NYC
          </p>
          {POPULAR_PLACES.map((place, i) => (
            <button key={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => onSelect(place)}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 border-b border-slate-50 last:border-0 flex items-start gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{place.label.split(',')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{place.label.split(',').slice(1, 3).join(',')}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Geocoding results — shown when user has typed ≥ 3 chars */}
      {showResults && (
        <div className="absolute bottom-full mb-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
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
  const [loading, setLoading]     = useState(false)
  const [routeCriteria, setRouteCriteria] = useState<RouteCriteria>({
    crime: true, lighting: true, visual: true, crowd: true,
  })

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
      {/* Card — capped to 70 vh so it never overlaps TopBar on small phones */}
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[70vh]">

        {/* ── Non-scrollable header area ─────────────────────────── */}
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden flex-shrink-0">
          <div className="w-8 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-slate-50 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-800">Navigate</h3>
          <button onClick={reset} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Location inputs — always visible, not scrolled away */}
        <div className="px-4 py-3 space-y-2 flex-shrink-0">
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
            showMyLocation
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

        {/* ── Scrollable content below inputs ────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

        {/* Loading state */}
        {loading && (
          <div className="px-4 pb-4 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Finding safest routes…</span>
          </div>
        )}

        {/* Route results */}
        {!loading && routes.length > 0 && selectedRoute && (() => {
          const selScore = adjustedScore(selectedRoute, routeCriteria)
          return (
            <div className="px-4 pb-4 space-y-3">
              {/* Selected route summary card */}
              <div className="bg-slate-50 rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: scoreToColor(selScore), backgroundColor: `${scoreToColor(selScore)}18` }}>
                        {scoreLabel(selScore)}
                      </span>
                      <span className="text-xs text-slate-400">{fmtDist(selectedRoute.totalDistance)}</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 leading-none">
                      {fmt(selectedRoute.totalDuration)}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
                    style={{ borderColor: scoreToColor(selScore), color: scoreToColor(selScore) }}>
                    <span className="text-sm font-black">{selScore}</span>
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
                  {routes.map((r, i) => {
                    const sc = adjustedScore(r, routeCriteria)
                    return (
                      <button key={i} onClick={() => update({ selectedRoute: r })}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left
                          ${selectedRoute === r ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{r.label === 'safest' ? '🛡 Safest' : '⚡ Fastest'}</span>
                            <span className="text-xs text-slate-400">{fmt(r.totalDuration)} · {fmtDist(r.totalDistance)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: scoreToColor(sc) }}>
                          {sc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ── Route criteria ─────────────────────────────────────────── */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-3.5 pt-3 pb-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    What matters to you?
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toggle criteria to adjust the safety score.</p>
                </div>
                <div className="bg-white">
                  {CRITERIA_META.map(({ key, icon, label }) => {
                    const on = routeCriteria[key]
                    return (
                      <div key={key}
                        onClick={() => setRouteCriteria(p => ({ ...p, [key]: !p[key] }))}
                        className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 select-none">
                        <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
                        <span className="flex-1 text-sm text-slate-700">{label}</span>
                        {/* Pure div toggle — avoids browser button default padding issues */}
                        <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${on ? 'bg-green-500' : 'bg-slate-200'}`}>
                          <span className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${on ? 'left-[18px]' : 'left-[2px]'}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Start button */}
              <button onClick={startNavigation}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-2xl text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm">
                Start Navigation
              </button>
            </div>
          )
        })()}

        {/* Hint — only when both fields are still empty */}
        {!loading && routes.length === 0 && !navState.origin && !navState.destination && (
          <div className="px-4 pb-4 text-center">
            <p className="text-xs text-slate-400">Tap a field above to pick a location.</p>
          </div>
        )}

        </div>{/* end scrollable */}
      </div>{/* end card */}
    </div>
  )
}
