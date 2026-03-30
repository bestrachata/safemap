'use client'

import { useState } from 'react'

const SCALE = [
  { label: 'Safe',     color: '#16A34A', range: '82–100' },
  { label: 'Good',     color: '#65A30D', range: '65–81'  },
  { label: 'Moderate', color: '#D97706', range: '50–64'  },
  { label: 'Caution',  color: '#EA580C', range: '35–49'  },
  { label: 'Unsafe',   color: '#DC2626', range: '0–34'   },
]

export default function SafetyLegend() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col items-start gap-1">
      {/* Full legend — shown when expanded */}
      {expanded && (
        <div className="bg-white rounded-2xl shadow-lg p-3 w-36 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Safety Score</p>
          <div className="space-y-1.5">
            {SCALE.map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600 flex-1">{item.label}</span>
                <span className="text-[10px] text-slate-400">{item.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed pill — always visible, tap to toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 bg-white rounded-xl shadow-md px-2.5 py-1.5 border border-slate-100 hover:shadow-lg transition-shadow"
        title="Toggle safety legend"
      >
        {/* Mini colour strip */}
        <div className="flex gap-0.5">
          {SCALE.map(item => (
            <span key={item.label} className="w-2 h-3.5 rounded-sm" style={{ backgroundColor: item.color }} />
          ))}
        </div>
        <span className="text-[10px] font-semibold text-slate-500">Legend</span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}
