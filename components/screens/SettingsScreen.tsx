'use client'

import { useState } from 'react'

function FactorRow({ label, icon, value, onChange, description }: {
  label: string; icon: string; value: number
  onChange: (v: number) => void; description: string
}) {
  const pct = value
  return (
    <div className="py-3.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <span>{icon}</span>{label}
        </span>
        <span className="text-sm font-semibold text-green-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 opacity-0 absolute"
        style={{ marginTop: '-14px' }}
      />
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  )
}

function ToggleRow({ label, description, value, onChange }: {
  label: string; description: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-slate-50 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors mt-0.5 ${value ? 'bg-green-500' : 'bg-slate-200'}`}
        aria-checked={value}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function SettingsScreen() {
  const [weights, setWeights] = useState({ crime: 40, lighting: 25, visual: 20, crowd: 15 })
  const [notifs, setNotifs]   = useState({ alerts: true, weekly: false, routes: true })
  const [units, setUnits]     = useState<'metric' | 'imperial'>('metric')

  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header — matches AreaDetailPanel style */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">SafeMap</p>
        <h2 className="text-lg font-bold text-slate-800 mt-0.5">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Safety factor weights */}
        <div className="p-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Safety Score Weights</h3>
          <p className="text-xs text-slate-400 mb-3">Adjust how each factor contributes to the scores shown on the map.</p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 relative">
            <FactorRow label="Crime History" icon="🔒" value={weights.crime}
              onChange={v => setWeights(p => ({ ...p, crime: v }))}
              description="Historical incident frequency and severity." />
            <FactorRow label="Lighting" icon="💡" value={weights.lighting}
              onChange={v => setWeights(p => ({ ...p, lighting: v }))}
              description="Street light coverage and brightness at night." />
            <FactorRow label="Environment" icon="🌿" value={weights.visual}
              onChange={v => setWeights(p => ({ ...p, visual: v }))}
              description="Visual appeal, cleanliness, and upkeep." />
            <FactorRow label="Crowd Density" icon="👥" value={weights.crowd}
              onChange={v => setWeights(p => ({ ...p, crowd: v }))}
              description="Foot traffic — more people generally means safer." />
          </div>
          <p className="text-xs mt-2 text-right">
            Total weight:&nbsp;
            <span className={`font-semibold ${total === 100 ? 'text-green-600' : 'text-amber-500'}`}>
              {total}%
            </span>
            {total !== 100 && <span className="text-slate-400"> (should be 100%)</span>}
          </p>
        </div>

        {/* Notifications */}
        <div className="p-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Notifications</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4">
            <ToggleRow label="Safety Alerts" description="Incidents near your saved places."
              value={notifs.alerts} onChange={v => setNotifs(p => ({ ...p, alerts: v }))} />
            <ToggleRow label="Route Updates" description="Real-time safety updates while navigating."
              value={notifs.routes} onChange={v => setNotifs(p => ({ ...p, routes: v }))} />
            <ToggleRow label="Weekly Summary" description="A weekly safety digest for your area."
              value={notifs.weekly} onChange={v => setNotifs(p => ({ ...p, weekly: v }))} />
          </div>
        </div>

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
