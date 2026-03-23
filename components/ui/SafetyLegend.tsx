'use client'

export default function SafetyLegend() {
  const scale = [
    { label: 'Safe', color: '#16A34A', range: '82–100' },
    { label: 'Good', color: '#65A30D', range: '65–81' },
    { label: 'Moderate', color: '#D97706', range: '50–64' },
    { label: 'Caution', color: '#EA580C', range: '35–49' },
    { label: 'Unsafe', color: '#DC2626', range: '0–34' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 w-36">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Safety Score</p>
      <div className="space-y-1.5">
        {scale.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color, opacity: 0.85 }}
            />
            <span className="text-xs text-slate-600 flex-1">{item.label}</span>
            <span className="text-xs text-slate-400">{item.range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
