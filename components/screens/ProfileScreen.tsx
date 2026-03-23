'use client'

import { scoreToColor } from '@/lib/safetyScore'

const SAVED_PLACES = [
  { name: 'Home', address: '230 W 73rd St, Upper West Side', icon: '🏠' },
  { name: 'Work', address: '350 5th Ave, Midtown',           icon: '🏢' },
  { name: 'Gym',  address: '151 E 86th St, Upper East Side', icon: '💪' },
]

const RECENT_ROUTES = [
  { from: 'Times Square',    to: 'Central Park',    score: 84, date: 'Today' },
  { from: 'Grand Central',   to: 'Upper East Side', score: 88, date: 'Yesterday' },
  { from: 'Financial Dist.', to: 'Brooklyn Bridge', score: 77, date: 'Mon' },
]

export default function ProfileScreen() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header — matches AreaDetailPanel style */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">SafeMap</p>
        <h2 className="text-lg font-bold text-slate-800 mt-0.5">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* User card */}
        <div className="m-5 bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">Guest User</p>
            <p className="text-xs text-slate-400 mt-0.5">New York, NY</p>
          </div>
          <button className="text-xs font-semibold text-green-600 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-50 transition-colors flex-shrink-0">
            Sign in
          </button>
        </div>

        {/* Stats */}
        <div className="px-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: '12', label: 'Routes' },
              { value: '8',  label: 'Areas saved' },
              { value: '83', label: 'Avg safety' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Saved places */}
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saved Places</h3>
            <button className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors">+ Add</button>
          </div>
          <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {SAVED_PLACES.map((place, i) => (
              <div key={place.name}
                className={`flex items-center gap-3 px-4 py-3 bg-white ${i < SAVED_PLACES.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <span className="text-lg w-7 text-center flex-shrink-0">{place.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{place.name}</p>
                  <p className="text-xs text-slate-400 truncate">{place.address}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Recent routes */}
        <div className="p-5 pb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Routes</h3>
          <div className="space-y-2">
            {RECENT_ROUTES.map((route, i) => (
              <div key={i} className="bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">{route.from}</span>
                    <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700 truncate">{route.to}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{route.date}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: scoreToColor(route.score), backgroundColor: `${scoreToColor(route.score)}15` }}>
                  {route.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign-in CTA — plain card, no gradient */}
        <div className="p-5">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-bold text-slate-800">Unlock your full safety profile</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sign in to sync routes, get personalised alerts, and access community reports.
            </p>
            <button className="mt-3 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-700 active:scale-95 transition-all">
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
