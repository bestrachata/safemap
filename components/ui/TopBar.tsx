'use client'

import { useState, useRef, useEffect } from 'react'
import { GeocodingResult } from '@/lib/types'
import { GeocodingAdapter } from '@/lib/adapters/geocoding'

const POPULAR_PLACES = [
  { icon: '🗽', label: 'Times Square',           latlng: { lat: 40.7580, lng: -73.9855 } },
  { icon: '🌳', label: 'Central Park',            latlng: { lat: 40.7851, lng: -73.9683 } },
  { icon: '🏛️', label: 'Grand Central Terminal',  latlng: { lat: 40.7527, lng: -73.9772 } },
  { icon: '🌉', label: 'Brooklyn Bridge',          latlng: { lat: 40.7061, lng: -73.9969 } },
  { icon: '🗼', label: 'Empire State Building',    latlng: { lat: 40.7484, lng: -73.9857 } },
  { icon: '🎨', label: 'MoMA',                    latlng: { lat: 40.7614, lng: -73.9776 } },
  { icon: '🛳️', label: 'Battery Park',            latlng: { lat: 40.7033, lng: -74.0170 } },
  { icon: '🎭', label: 'Broadway',                 latlng: { lat: 40.7590, lng: -73.9845 } },
]

interface Props {
  onLocationSelect: (result: GeocodingResult) => void
  onGetDirections: (result: GeocodingResult) => void
}

export default function TopBar({ onLocationSelect, onGetDirections }: Props) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<GeocodingResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [focused, setFocused]       = useState(false)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const showPopular  = focused && query.length < 3
  const showResults  = focused && results.length > 0 && query.length >= 3

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await GeocodingAdapter.search(query)
        setResults(res.slice(0, 5))
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function selectPlace(result: GeocodingResult) {
    setQuery(result.label.split(',')[0])
    setFocused(false)
    onLocationSelect(result)
  }

  function getDirections(result: GeocodingResult) {
    setQuery(result.label.split(',')[0])
    setFocused(false)
    onGetDirections(result)
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-3">
      <div className="flex items-center gap-2">

        {/* Logo pill */}
        <div className="flex-shrink-0 flex items-center gap-0.5 bg-white rounded-xl shadow-lg px-3 py-2">
          <span className="text-green-600 font-black text-base tracking-tight">Safe</span>
          <span className="text-slate-700 font-black text-base tracking-tight">Map</span>
        </div>

        {/* Search box + dropdown */}
        <div className="relative flex-1">
          <div className={`flex items-center bg-white rounded-xl shadow-lg px-3 py-2 gap-2 transition-shadow
            ${focused ? 'shadow-xl ring-1 ring-green-200' : ''}`}>
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder="Search places in New York…"
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent min-w-0"
            />
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {query && !loading && (
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Popular places (shown when focused, no query) */}
          {showPopular && (
            <div className="absolute top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Popular in NYC
              </p>
              <div className="pb-1">
                {POPULAR_PLACES.map((p, i) => {
                  const result: GeocodingResult = { label: `${p.label}, New York, NY`, latlng: p.latlng }
                  return (
                    <div key={i} className="flex items-center gap-0 border-b border-slate-50 last:border-0">
                      {/* Primary: fly to */}
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => selectPlace(result)}
                        className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="text-base w-6 text-center flex-shrink-0">{p.icon}</span>
                        <span className="text-sm font-medium text-slate-700">{p.label}</span>
                      </button>
                      {/* Secondary: get directions */}
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => getDirections(result)}
                        className="flex-shrink-0 flex items-center gap-1 pr-3.5 py-2.5 text-green-600 hover:text-green-700 transition-colors"
                        title="Get directions"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-semibold">Directions</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Geocoding search results */}
          {showResults && (
            <div className="absolute top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {results.map((r, i) => (
                <div key={i} className="flex items-center border-b border-slate-50 last:border-0">
                  {/* Primary: fly to */}
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => selectPlace(r)}
                    className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left min-w-0"
                  >
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.label.split(',')[0]}</p>
                      <p className="text-xs text-slate-400 truncate">{r.label.split(',').slice(1, 3).join(',')}</p>
                    </div>
                  </button>
                  {/* Secondary: get directions */}
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => getDirections(r)}
                    className="flex-shrink-0 flex items-center gap-1 pr-3.5 py-2.5 text-green-600 hover:text-green-700 transition-colors"
                    title="Get directions"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-xs font-semibold">Directions</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
