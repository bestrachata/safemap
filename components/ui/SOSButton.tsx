'use client'

import { useState } from 'react'

export default function SOSButton() {
  const [open, setOpen] = useState(false)
  const [called, setCalled] = useState(false)

  function handleCall() {
    setCalled(true)
    setTimeout(() => { setCalled(false); setOpen(false) }, 3000)
  }

  return (
    <>
      {/* SOS trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 hover:bg-red-700 active:scale-95 transition-all border-2 border-white"
        title="Emergency SOS"
      >
        <span className="text-[13px] font-black tracking-widest leading-none">SOS</span>
        <span className="text-[8px] font-semibold text-red-200 leading-none tracking-wide">HELP</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none">Emergency SOS</p>
                <p className="text-red-200 text-xs mt-0.5">Get help immediately</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Call 911 */}
              {called ? (
                <div className="w-full py-4 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-bold text-green-700">Connecting to 911…</span>
                </div>
              ) : (
                <button
                  onClick={handleCall}
                  className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold text-base flex items-center justify-center gap-2.5 hover:bg-red-700 active:scale-[0.98] transition-all shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call 911
                </button>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="py-3 rounded-xl border border-slate-200 flex flex-col items-center gap-1.5 hover:bg-slate-50 active:scale-[0.98] transition-all">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-700">Share Location</span>
                </button>
                <button className="py-3 rounded-xl border border-slate-200 flex flex-col items-center gap-1.5 hover:bg-slate-50 active:scale-[0.98] transition-all">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-700">Alert Contacts</span>
                </button>
              </div>

              {/* Nearest help */}
              <div className="bg-slate-50 rounded-2xl p-3.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nearest Help</p>
                <div className="space-y-2">
                  {[
                    { icon: '🚓', label: '1st Precinct NYPD',    dist: '0.3 mi' },
                    { icon: '🏥', label: 'NewYork-Presbyterian', dist: '0.8 mi' },
                    { icon: '🚒', label: 'Engine Co. 10 FDNY',   dist: '0.5 mi' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-sm text-slate-700 font-medium">{item.label}</span>
                      <span className="text-xs text-slate-400 font-medium">{item.dist}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
