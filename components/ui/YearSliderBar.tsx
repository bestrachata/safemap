'use client'

import { CrimeLayerFilter, HeatmapLayer } from '@/lib/types'

const YEAR_MIN = 2015
const YEAR_MAX = 2026

interface Props {
  activeLayer: HeatmapLayer
  filter: CrimeLayerFilter
  onChange: (f: CrimeLayerFilter) => void
  /** px value or CSS string (e.g. "calc(env(safe-area-inset-top,0px) + 120px)") */
  topOffset?: number | string
}

export default function YearSliderBar({ activeLayer, filter, onChange, topOffset = 72 }: Props) {
  if (activeLayer !== 'crime' && activeLayer !== 'visualAppeal') return null

  const pMin = ((filter.yearMin - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100
  const pMax = ((filter.yearMax - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-[999] w-full max-w-xl px-3" style={{ top: topOffset }}>
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-4 py-2.5 flex items-center gap-3">

        {/* Label */}
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap flex-shrink-0">
          Data range
        </span>

        {/* Dual-handle slider */}
        <div className="relative flex-1 h-5 flex items-center">
          {/* Base track */}
          <div className="absolute inset-x-0 h-1.5 bg-slate-200 rounded-full" />
          {/* Active fill */}
          <div
            className="absolute h-1.5 bg-green-500 rounded-full pointer-events-none"
            style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }}
          />
          {/* Min handle */}
          <input
            type="range" min={YEAR_MIN} max={YEAR_MAX} value={filter.yearMin}
            onChange={e => onChange({ ...filter, yearMin: Math.min(+e.target.value, filter.yearMax - 1) })}
            className="dual-range-input"
          />
          {/* Max handle */}
          <input
            type="range" min={YEAR_MIN} max={YEAR_MAX} value={filter.yearMax}
            onChange={e => onChange({ ...filter, yearMax: Math.max(+e.target.value, filter.yearMin + 1) })}
            className="dual-range-input"
          />
        </div>

        {/* Year labels */}
        <span className="text-[11px] font-bold text-green-700 whitespace-nowrap flex-shrink-0">
          {filter.yearMin} – {filter.yearMax}
        </span>
      </div>
    </div>
  )
}
