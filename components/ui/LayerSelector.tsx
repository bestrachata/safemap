'use client'

/**
 * LayerSelector — Nomadtable-style horizontal scrollable pill tabs.
 * Each pill represents a heatmap layer; the active one is highlighted green.
 */

import { HeatmapLayer } from '@/lib/types'

interface Props {
  activeLayer: HeatmapLayer
  onChange:    (layer: HeatmapLayer) => void
}

const LAYERS: { id: HeatmapLayer; label: string; icon: string }[] = [
  { id: 'composite',   label: 'Safety',       icon: '🛡️' },
  { id: 'crime',       label: 'Crime',         icon: '🔒' },
  { id: 'lighting',    label: 'Lighting',      icon: '💡' },
  { id: 'visualAppeal',label: 'Environment',   icon: '🌿' },
  { id: 'crowdDensity',label: 'Crowd',         icon: '👥' },
]

export default function LayerSelector({ activeLayer, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {LAYERS.map(layer => (
        <button
          key={layer.id}
          onClick={() => onChange(layer.id)}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
            ${activeLayer === layer.id
              ? 'bg-green-600 text-white shadow-md shadow-green-200'
              : 'bg-white/95 text-slate-600 shadow hover:bg-white hover:shadow-md'
            }`}
        >
          <span className="text-[13px] leading-none">{layer.icon}</span>
          <span>{layer.label}</span>
        </button>
      ))}
    </div>
  )
}
