'use client'

/**
 * MapStylePicker — compact floating button that opens a 4-option style grid.
 *
 * Styles (all free, no API key):
 *   light     → CartoDB Positron  (clean monotone — default)
 *   color     → CartoDB Voyager   (colorful pastel, like Nomadtable)
 *   dark      → CartoDB Dark      (dark night theme)
 *   satellite → ESRI World Imagery (aerial photo)
 */

import { useEffect, useRef, useState } from 'react'
import { MapStyle } from '@/lib/types'

export interface MapStyleConfig {
  id:          MapStyle
  label:       string
  tileUrl:     string
  attribution: string
}

export const MAP_STYLES: MapStyleConfig[] = [
  {
    id:    'light',
    label: 'Minimal',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  {
    id:    'color',
    label: 'Color',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  {
    id:    'dark',
    label: 'Dark',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  {
    id:    'satellite',
    label: 'Satellite',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
]

// Visual "swatch" representation for each style
const SWATCHES: Record<MapStyle, React.ReactNode> = {
  light: (
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-100 relative">
      <div className="absolute inset-x-2 top-3 h-0.5 bg-white rounded-full" />
      <div className="absolute inset-x-4 top-5 h-0.5 bg-slate-200 rounded-full" />
      <div className="absolute inset-x-2 top-7 h-0.5 bg-white rounded-full" />
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-sm opacity-70" />
    </div>
  ),
  color: (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: '#e8f4f0' }}>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #c8e6c9 0%, #b3d4e8 40%, #e8d5b7 70%, #dcedc8 100%)',
        opacity: 0.9,
      }} />
      <div className="absolute inset-x-2 top-3 h-0.5 bg-white/80 rounded-full" />
      <div className="absolute inset-x-3 top-5 h-0.5 bg-amber-300/60 rounded-full" />
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 rounded-sm" />
    </div>
  ),
  dark: (
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800 relative">
      <div className="absolute inset-x-2 top-3 h-0.5 bg-slate-600 rounded-full" />
      <div className="absolute inset-x-4 top-5 h-0.5 bg-slate-700 rounded-full" />
      <div className="absolute inset-x-2 top-7 h-0.5 bg-slate-600 rounded-full" />
      <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-400 rounded-sm opacity-80" />
    </div>
  ),
  satellite: (
    <div className="w-full h-full rounded-lg overflow-hidden relative" style={{
      background: 'linear-gradient(135deg, #2d5a27 0%, #3a7d44 30%, #1a3a2a 55%, #4a6741 80%, #2d5a27 100%)',
    }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 40%, rgba(100,150,100,0.3) 0%, transparent 60%)',
      }} />
      <div className="absolute bottom-1 right-1 w-4 h-3" style={{
        background: 'linear-gradient(90deg, #8B7355 0%, #A0956B 50%, #7a6545 100%)',
        borderRadius: 2,
        opacity: 0.8,
      }} />
    </div>
  ),
}

interface Props {
  value:    MapStyle
  onChange: (style: MapStyle) => void
  dropUp?:  boolean
}

export default function MapStylePicker({ value, onChange, dropUp = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const active = MAP_STYLES.find(s => s.id === value) ?? MAP_STYLES[0]

  return (
    <div ref={ref} className="relative flex-shrink-0">

      {/* Trigger pill */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shadow
          ${open ? 'bg-slate-700 text-white' : 'bg-white/95 text-slate-600 hover:bg-white hover:shadow-md'}`}
      >
        {/* Slightly larger swatch so it reads clearly when label is hidden */}
        <span className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0 inline-block">
          <span className="w-full h-full" style={{ display: 'block' }}>
            {value === 'light'     && <span className="block w-full h-full bg-slate-200 rounded-sm" />}
            {value === 'color'     && <span className="block w-full h-full rounded-sm" style={{ background: 'linear-gradient(135deg,#c8e6c9,#b3d4e8)' }} />}
            {value === 'dark'      && <span className="block w-full h-full bg-slate-800 rounded-sm" />}
            {value === 'satellite' && <span className="block w-full h-full bg-green-700 rounded-sm" />}
          </span>
        </span>
        {/* Label hidden on narrow screens — swatch alone is enough visual cue */}
        <span className="hidden sm:inline">{active.label}</span>
        <svg
          className={`w-3 h-3 text-current opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Style grid dropdown */}
      {open && (
        <div className={`absolute z-[1100] bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 w-52
          ${dropUp ? 'bottom-full mb-2 right-0' : 'top-full mt-2 right-0'}`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
            Map Style
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MAP_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => { onChange(style.id); setOpen(false) }}
                className={`relative rounded-xl overflow-hidden transition-all group
                  ${value === style.id ? 'ring-2 ring-green-500 ring-offset-1' : 'hover:ring-2 hover:ring-slate-200 hover:ring-offset-1'}`}
              >
                {/* Swatch */}
                <div className="h-14 w-full">
                  {SWATCHES[style.id]}
                </div>
                {/* Label */}
                <div className={`flex items-center justify-between px-2 py-1.5
                  ${value === style.id ? 'bg-green-50' : 'bg-white group-hover:bg-slate-50'}`}>
                  <span className={`text-[11px] font-semibold ${value === style.id ? 'text-green-700' : 'text-slate-600'}`}>
                    {style.label}
                  </span>
                  {value === style.id && (
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
