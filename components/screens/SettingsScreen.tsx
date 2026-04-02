'use client'

import { useState } from 'react'

export default function SettingsScreen() {
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">AssureWay</p>
        <h2 className="text-lg font-bold text-slate-800 mt-0.5">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Distance units */}
        <div className="p-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distance Units</h3>
          <div className="flex gap-2">
            {(['metric', 'imperial'] as const).map(u => (
              <button key={u} onClick={() => setUnits(u)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors
                  ${units === u
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                {u === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="p-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">About</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {[
              { label: 'Version',     value: '1.0.0 (MVP)' },
              { label: 'Data source', value: 'NYC Open Data' },
              { label: 'Map tiles',   value: 'OpenStreetMap' },
            ].map((row, i, arr) => (
              <div key={row.label}
                className={`flex items-center justify-between px-4 py-3 bg-white ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className="text-sm font-medium text-slate-700">{row.value}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 px-4 py-3">
              <button className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                Clear all saved data
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
