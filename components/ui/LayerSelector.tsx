'use client'

import { useState, useRef, useEffect } from 'react'
import { HeatmapLayer } from '@/lib/types'

interface Props {
  activeLayer: HeatmapLayer
  onChange:    (layer: HeatmapLayer) => void
  /** When false the dropdown opens downward (use when control is near the top of screen) */
  dropUp?:     boolean
}

const LAYERS: { id: HeatmapLayer; label: string; icon: string; desc: string }[] = [
  { id: 'composite', label: 'Overall Safety', icon: '🛡️', desc: 'Combined score' },
  { id: 'crime', label: 'Crime Rate', icon: '🔒', desc: 'Historical incidents' },
  { id: 'lighting', label: 'Lighting', icon: '💡', desc: 'Street light coverage' },
  { id: 'visualAppeal', label: 'Environment', icon: '🌿', desc: 'Cleanliness & appeal' },
  { id: 'crowdDensity', label: 'Crowd Density', icon: '👥', desc: 'People around you' },
]

export default function LayerSelector({ activeLayer, onChange, dropUp = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active = LAYERS.find(l => l.id === activeLayer) ?? LAYERS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2.5 hover:shadow-xl transition-shadow"
      >
        <span className="text-base leading-none">{active.icon}</span>
        <span className="text-sm font-semibold text-slate-700">{active.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — opens upward by default, downward when dropUp=false */}
      {open && (
        <div className={`absolute w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10
          ${dropUp ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 right-0'}`}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 pt-3 pb-2">
            View heatmap by
          </p>
          {LAYERS.map(layer => (
            <button
              key={layer.id}
              onClick={() => { onChange(layer.id); setOpen(false) }}
              className={`
                w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors
                ${activeLayer === layer.id
                  ? 'bg-green-50'
                  : 'hover:bg-slate-50'
                }
              `}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{layer.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${activeLayer === layer.id ? 'text-green-700' : 'text-slate-700'}`}>
                  {layer.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{layer.desc}</p>
              </div>
              {activeLayer === layer.id && (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  )
}
