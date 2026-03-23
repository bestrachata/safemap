'use client'

import { useState } from 'react'
import { scoreToColor } from '@/lib/safetyScore'

const REPORTS = [
  { id: 1, user: 'Sarah M.', time: '12 min ago', location: 'Times Square, 42nd St',    type: 'alert', severity: 38, message: 'Aggressive panhandler near the TKTS booth. Avoid the north steps late at night.', upvotes: 14 },
  { id: 2, user: 'James K.', time: '1 hr ago',   location: "Hell's Kitchen, 9th Ave",  type: 'tip',   severity: 72, message: 'Well-lit route along 9th Ave between 42nd–50th. Good foot traffic all evening.', upvotes: 31 },
  { id: 3, user: 'Priya S.', time: '2 hr ago',   location: 'East Harlem, 116th St',    type: 'alert', severity: 44, message: 'Multiple car break-ins reported near the Park Ave intersection. Keep valuables hidden.', upvotes: 22 },
  { id: 4, user: 'David L.', time: '3 hr ago',   location: 'Financial District',       type: 'safe',  severity: 91, message: 'Great police presence around the NYSE area during evening commute. Very safe walk.', upvotes: 8 },
  { id: 5, user: 'Mei C.',   time: '5 hr ago',   location: 'Chinatown, Mott St',       type: 'tip',   severity: 66, message: 'Sticking to Canal St is much safer than side streets after 10pm. Busy and well-lit.', upvotes: 19 },
]

const TRENDING = [
  { name: 'Battery Park City', score: 91 },
  { name: 'Upper East Side',   score: 88 },
  { name: 'Tribeca',           score: 85 },
  { name: 'Gramercy',          score: 84 },
]

const TYPE_CFG = {
  alert: { label: 'Alert', color: '#DC2626', bg: 'bg-red-50',   text: 'text-red-600'   },
  tip:   { label: 'Tip',   color: '#2563EB', bg: 'bg-blue-50',  text: 'text-blue-600'  },
  safe:  { label: 'Safe',  color: '#16A34A', bg: 'bg-green-50', text: 'text-green-700' },
}

export default function CommunityScreen() {
  const [liked, setLiked] = useState<Set<number>>(new Set())

  function toggleLike(id: number) {
    setLiked(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header — matches AreaDetailPanel style */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">SafeMap</p>
          <h2 className="text-lg font-bold text-slate-800 mt-0.5">Community</h2>
        </div>
        <button className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-green-700 active:scale-95 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Safest zones this week */}
        <div className="p-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Safest This Week</h3>
          <div className="grid grid-cols-2 gap-2">
            {TRENDING.map(zone => (
              <div key={zone.name} className="bg-slate-50 rounded-2xl px-3.5 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 truncate pr-2">{zone.name}</span>
                <span className="text-sm font-black flex-shrink-0" style={{ color: scoreToColor(zone.score) }}>
                  {zone.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Reports</h3>
          {REPORTS.map(report => {
            const cfg = TYPE_CFG[report.type as keyof typeof TYPE_CFG]
            return (
              <div key={report.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                {/* Report header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{report.user}</span>
                  <span className="text-xs text-slate-400 ml-auto">{report.time}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 mb-2">
                  <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-slate-400 truncate">{report.location}</span>
                </div>

                {/* Message */}
                <p className="text-sm text-slate-600 leading-relaxed">{report.message}</p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                  <button
                    onClick={() => toggleLike(report.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked.has(report.id) ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill={liked.has(report.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {report.upvotes + (liked.has(report.id) ? 1 : 0)} helpful
                  </button>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreToColor(report.severity) }} />
                    <span className="text-xs font-semibold" style={{ color: scoreToColor(report.severity) }}>
                      Safety {report.severity}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load more */}
        <div className="px-5 pb-5">
          <button className="w-full py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
            Load more reports
          </button>
        </div>
      </div>
    </div>
  )
}
