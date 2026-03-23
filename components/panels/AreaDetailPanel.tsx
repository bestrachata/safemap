'use client'

import { useEffect, useState } from 'react'
import { CellDetail, GridCell } from '@/lib/types'
import { SafetyDataAdapter } from '@/lib/adapters/safety-data'
import { scoreToColor, scoreLabel } from '@/lib/safetyScore'
import SafetyBadge from '@/components/ui/SafetyBadge'

interface Props {
  cell: GridCell | null
  onClose: () => void
}

interface FactorBarProps {
  label: string
  score: number
  icon: string
}

function FactorBar({ label, score, icon }: FactorBarProps) {
  const color = scoreToColor(score)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <span>{icon}</span>{label}
        </span>
        <span className="text-xs font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function AreaDetailPanel({ cell, onClose }: Props) {
  const [detail, setDetail] = useState<CellDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    if (!cell) { setDetail(null); return }
    setLoading(true)
    setImgIndex(0)
    SafetyDataAdapter.getCellDetail(cell.id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [cell])

  const visible = !!cell

  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1001]
        flex flex-col overflow-hidden
        transition-transform duration-300 ease-out
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Area Detail</p>
          <h2 className="text-lg font-bold text-slate-800 mt-0.5 leading-tight">
            {detail?.name ?? cell?.name ?? '—'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && detail && (
          <div className="p-5 space-y-5">
            {/* Score hero */}
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-center">
                <div
                  className="text-4xl font-black"
                  style={{ color: scoreToColor(detail.compositeScore) }}
                >
                  {detail.compositeScore}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">/ 100</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700">{scoreLabel(detail.compositeScore)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {detail.incidentCount} incident{detail.incidentCount !== 1 ? 's' : ''} this month
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Best: {detail.bestTime}
                  </span>
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    Caution: {detail.worstTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Factor breakdown */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Safety Factors</h3>
              <div className="space-y-3">
                <FactorBar label="Crime Rate" score={detail.factors.crimeScore} icon="🔒" />
                <FactorBar label="Lighting" score={detail.factors.lightingScore} icon="💡" />
                <FactorBar label="Environment" score={detail.factors.visualAppealScore} icon="🌿" />
                <FactorBar label="Crowd Density" score={detail.factors.crowdScore} icon="👥" />
              </div>
            </div>

            {/* Images */}
            {detail.imageUrls.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Area Photos</h3>
                <div className="relative rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.imageUrls[imgIndex]}
                    alt={`${detail.name} photo ${imgIndex + 1}`}
                    className="w-full h-44 object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80' }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {detail.imageUrls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">AI Safety Analysis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{detail.description}</p>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Safety Tips</h3>
              <div className="space-y-2">
                {detail.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
