'use client'

import { useEffect, useRef, useState } from 'react'
import { CrimeLayerFilter, HeatmapLayer } from '@/lib/types'

interface Option {
  key:   keyof CrimeLayerFilter
  label: string
  color: string
}

const CRIME_OPTIONS: Option[] = [
  { key: 'showShootings',   label: 'Shooting Incidents', color: '#DC2626' },
  { key: 'showHateCrimes',  label: 'Hate Crimes',        color: '#EA580C' },
  { key: 'showCfsSevere',   label: 'Serious Calls',      color: '#EF4444' },
  { key: 'showCfsDisorder', label: 'Disturbance Calls',  color: '#F97316' },
  { key: 'showCfsQol',      label: 'Quality-of-Life',    color: '#F59E0B' },
]

const VISUAL_OPTIONS: Option[] = [
  { key: 'showSyringes', label: 'Syringe Pickups', color: '#7C3AED' },
]

interface Props {
  activeLayer: HeatmapLayer
  filter:      CrimeLayerFilter
  onChange:    (f: CrimeLayerFilter) => void
  /** When false the dropdown opens downward (use when control is near the top of screen) */
  dropUp?:     boolean
}

export default function FilterDropdown({ activeLayer, filter, onChange, dropUp = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // All hooks must run before any early return
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options =
    activeLayer === 'crime'        ? CRIME_OPTIONS  :
    activeLayer === 'visualAppeal' ? VISUAL_OPTIONS : []

  // Hide when irrelevant layer is active
  if (!options.length) return null

  const activeCount = options.filter(o => filter[o.key]).length

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — matches LayerSelector pill style */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2.5 rounded-2xl shadow-lg transition-shadow
          ${open ? 'bg-green-600 text-white shadow-xl' : 'bg-white text-slate-700 hover:shadow-xl'}
        `}
      >
        {/* Funnel icon */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
            d="M3 4h18M6 8h12M9 12h6M11 16h2" />
        </svg>
        {/* Text hidden on narrow screens */}
        <span className="hidden sm:inline text-sm font-semibold">Filter</span>
        {/* Active count badge */}
        {activeCount > 0 && (
          <span className={`
            text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center
            ${open ? 'bg-white text-green-700' : 'bg-green-600 text-white'}
          `}>
            {activeCount}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — opens upward by default, downward when dropUp=false */}
      {open && (
        <div className={`absolute w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1100]
          ${dropUp ? 'bottom-full mb-2 right-0' : 'top-full mt-2 right-0'}`}>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 pt-3 pb-2">
            Show on map
          </p>
          {options.map(opt => {
            const checked = !!filter[opt.key]
            return (
              <label
                key={opt.key}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                {/* Custom checkbox */}
                <span
                  className={`
                    w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
                    ${checked ? 'border-transparent' : 'border-slate-300 bg-white'}
                  `}
                  style={checked ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {/* Dot */}
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                <span className="text-sm text-slate-700 flex-1">{opt.label}</span>
                <input
                  type="checkbox" checked={checked} className="sr-only"
                  onChange={() => onChange({ ...filter, [opt.key]: !filter[opt.key] })}
                />
              </label>
            )
          })}
          <div className="h-2" />
        </div>
      )}
    </div>
  )
}
