'use client'

/**
 * TopBar — single-row compact header.
 *
 * [🛡 SafeMap] [🔍 Search New York…  ×] [👥] [🔔●] [Avatar]
 *
 * The search bar lives in the same row as all action icons.
 * It's always visible — no extra tap required to open it.
 */

import { useState, useRef, useEffect } from 'react'
import { GeocodingResult } from '@/lib/types'
import { GeocodingAdapter } from '@/lib/adapters/geocoding'
import { SELF_USER } from '@/lib/friendData'

const POPULAR_PLACES: GeocodingResult[] = [
  { label: 'Times Square, West 42nd St, Midtown Manhattan, NY',           latlng: { lat: 40.7580, lng: -73.9855 } },
  { label: 'Central Park, 59th St to 110th St, Manhattan, NY',            latlng: { lat: 40.7851, lng: -73.9683 } },
  { label: 'Grand Central Terminal, 89 E 42nd St, Midtown Manhattan, NY', latlng: { lat: 40.7527, lng: -73.9772 } },
  { label: 'Empire State Building, 350 5th Ave, Midtown Manhattan, NY',   latlng: { lat: 40.7484, lng: -73.9857 } },
  { label: 'Brooklyn Bridge, Tillary St & Adams St, Brooklyn, NY',        latlng: { lat: 40.7061, lng: -73.9969 } },
  { label: 'Broadway, Theater District, Midtown Manhattan, NY',           latlng: { lat: 40.7590, lng: -73.9845 } },
  { label: 'Battery Park, State St & Battery Pl, Lower Manhattan, NY',    latlng: { lat: 40.7033, lng: -74.0170 } },
  { label: 'MoMA, 11 W 53rd St, Midtown Manhattan, NY',                   latlng: { lat: 40.7614, lng: -73.9776 } },
]

interface Props {
  onLocationSelect:     (result: GeocodingResult) => void
  onGetDirections:      (result: GeocodingResult) => void
  onClear?:             () => void
  onProfileClick?:      () => void
  onFriendsClick?:      () => void
  onNotificationClick?: () => void
}

export default function TopBar({
  onLocationSelect, onGetDirections, onClear,
  onProfileClick, onFriendsClick, onNotificationClick,
}: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Geocoding debounce
  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try { setResults((await GeocodingAdapter.search(query)).slice(0, 5)) }
      catch { setResults([]) }
      finally { setLoading(false) }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function selectPlace(r: GeocodingResult) {
    setQuery(''); setResults([]); setFocused(false)
    onLocationSelect(r)
  }
  function getDirections(r: GeocodingResult) {
    setQuery(''); setResults([]); setFocused(false)
    onGetDirections(r)
  }
  function handleClear() {
    setQuery(''); setResults([])
    onClear?.()
    inputRef.current?.focus()
  }

  const showDropdown = focused && (query.length < 3 || results.length > 0)
  const showPopular  = focused && query.length < 3
  const showResults  = focused && results.length > 0 && query.length >= 3

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000]"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-3 mt-3">

        {/* ── Single-row header card ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="flex items-center h-12 px-3 gap-2">

            {/* Brand — compact: shield icon + "SafeMap" text only */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-black text-slate-800 text-[13px] tracking-tight whitespace-nowrap">
                Safe<span className="text-green-600">Map</span>
              </span>
            </div>

            {/* Search pill — fills the middle, shrinks gracefully */}
            <div
              className={`flex-1 min-w-0 flex items-center gap-1.5 rounded-xl px-2.5 h-8 transition-colors
                ${focused
                  ? 'bg-green-50 ring-1 ring-green-300'
                  : 'bg-slate-100 hover:bg-slate-100/80'
                }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); if (e.target.value === '') onClear?.() }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Search New York…"
                className="flex-1 min-w-0 text-xs text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
              />
              {loading && (
                <div className="w-3 h-3 border-[1.5px] border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {query && !loading && (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleClear}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Action icons — always visible, compact */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Friends */}
              <button
                onClick={onFriendsClick}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                aria-label="Friends"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Notifications */}
              <button
                onClick={onNotificationClick}
                className="relative w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                aria-label="Notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>

              {/* Profile avatar */}
              <button
                onClick={onProfileClick}
                className="relative flex-shrink-0 ml-0.5"
                aria-label="Profile"
              >
                <img
                  src={SELF_USER.avatarUrl}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search dropdown ──────────────────────────────────────────── */}
        {showDropdown && (
          <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {showPopular && (
              <>
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Popular in NYC
                </p>
                {POPULAR_PLACES.map((place, i) => (
                  <div key={i} className="flex items-center border-b border-slate-50 last:border-0">
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => selectPlace(place)}
                      className="flex-1 flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
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
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => getDirections(place)}
                      className="flex-shrink-0 flex items-center gap-1 pr-4 py-2.5 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="text-xs font-semibold">Go</span>
                    </button>
                  </div>
                ))}
              </>
            )}
            {showResults && results.map((r, i) => (
              <div key={i} className="flex items-center border-b border-slate-50 last:border-0">
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectPlace(r)}
                  className="flex-1 flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left min-w-0"
                >
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.label.split(',')[0]}</p>
                    <p className="text-xs text-slate-400 truncate">{r.label.split(',').slice(1, 3).join(',')}</p>
                  </div>
                </button>
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => getDirections(r)}
                  className="flex-shrink-0 flex items-center gap-1 pr-4 py-2.5 text-green-600 hover:text-green-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs font-semibold">Go</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
