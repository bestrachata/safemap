'use client'

import { useState } from 'react'
import { Friend, SELF_USER, timeAgo } from '@/lib/friendData'

interface Props {
  open:              boolean
  friends:           Friend[]
  ghostMode:         boolean
  onGhostModeChange: (v: boolean) => void
  onClose:           () => void
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Friend['status'] }) {
  const map = {
    online: { dot: 'bg-green-500', text: 'Online',     cls: 'text-green-700 bg-green-50' },
    away:   { dot: 'bg-amber-400', text: 'Away',       cls: 'text-amber-700 bg-amber-50' },
    ghost:  { dot: 'bg-slate-300', text: 'Hidden',     cls: 'text-slate-500 bg-slate-100' },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  )
}

// ── Safety badge ──────────────────────────────────────────────────────────────
function SafetyBadge({ safe }: { safe: boolean }) {
  return safe
    ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Safe zone
      </span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Lower safety
      </span>
}

// ── Friend card ───────────────────────────────────────────────────────────────
function FriendCard({
  friend,
  onPing,
  onSos,
}: {
  friend: Friend
  onPing: (id: string) => void
  onSos:  (id: string) => void
}) {
  const [pinged, setPinged] = useState(false)
  const [sosed,  setSosed]  = useState(false)
  const inUnsafeZone = !friend.safeZone && friend.status !== 'ghost'

  function handlePing() {
    setPinged(true)
    onPing(friend.id)
    setTimeout(() => setPinged(false), 3000)
  }

  function handleSos() {
    setSosed(true)
    onSos(friend.id)
    setTimeout(() => setSosed(false), 4000)
  }

  return (
    <div className={`rounded-2xl border p-3 transition-all ${
      inUnsafeZone ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-white'
    }`}>
      <div className="flex items-center gap-3">

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={friend.avatarUrl}
            alt={friend.name}
            className="w-11 h-11 rounded-full object-cover shadow-sm"
            style={{ border: `2.5px solid ${friend.avatarColor}` }}
          />
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            friend.status === 'online' ? 'bg-green-500' :
            friend.status === 'away'   ? 'bg-amber-400' : 'bg-slate-300'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-800">{friend.name}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="text-xs text-slate-500 truncate">{friend.locationName}</span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(friend.lastSeen)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <StatusPill status={friend.status} />
            <SafetyBadge safe={friend.safeZone} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {/* Ping */}
          <button
            onClick={handlePing}
            className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all ${
              pinged
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
            }`}
          >
            {pinged ? '✓ Sent!' : '👋 Ping'}
          </button>

          {/* SOS to friend — only when they're in an unsafe zone */}
          {inUnsafeZone && (
            <button
              onClick={handleSos}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-all ${
                sosed
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
              }`}
            >
              {sosed ? '✓ Alert sent' : '🆘 SOS'}
            </button>
          )}
        </div>
      </div>

      {/* Unsafe-zone warning row */}
      {inUnsafeZone && (
        <div className="mt-2.5 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <p className="text-[11px] text-red-600 font-medium">
            {friend.name.split(' ')[0]} is in a lower-safety area. Tap SOS to send an alert.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function FriendsPanel({
  open, friends, ghostMode, onGhostModeChange, onClose,
}: Props) {
  const [pingLog, setPingLog] = useState<string[]>([])
  const [sosLog,  setSosLog]  = useState<string[]>([])

  const onlineCount = friends.filter(f => f.status === 'online').length
  const unsafeCount = friends.filter(f => !f.safeZone && f.status === 'online').length

  function handlePing(id: string) {
    const f = friends.find(fr => fr.id === id)
    if (f) setPingLog(prev => [`👋 Pinged ${f.name.split(' ')[0]}`, ...prev.slice(0, 1)])
  }

  function handleSos(id: string) {
    const f = friends.find(fr => fr.id === id)
    if (f) setSosLog(prev => [`🆘 SOS alert sent to ${f.name.split(' ')[0]}`, ...prev.slice(0, 1)])
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-[1100] bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1101] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '82vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(82vh - 40px)' }}>
          <div className="px-4 pb-6">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-800">Friends</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {onlineCount} online · {friends.length} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 border border-green-200 px-2.5 py-1 rounded-xl">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  Invite
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── My Status card ─────────────────────────────────────── */}
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={SELF_USER.avatarUrl}
                    alt="You"
                    className="w-12 h-12 rounded-full object-cover shadow"
                    style={{ border: '2.5px solid #0d9488' }}
                  />
                  {!ghostMode && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800">You</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {ghostMode ? '👻 Location hidden from friends' : '📍 Sharing your location'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    Share location
                  </span>
                  <div
                    onClick={() => onGhostModeChange(!ghostMode)}
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
                      ghostMode ? 'bg-slate-300' : 'bg-green-500'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      ghostMode ? 'left-1' : 'left-6'
                    }`} />
                  </div>
                </div>
              </div>
              {ghostMode && (
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-white/60 rounded-xl p-2.5">
                  <span className="text-base leading-none mt-px">👻</span>
                  <span>Your location is hidden. Friends won't see you on the map until you turn sharing back on.</span>
                </div>
              )}
            </div>

            {/* ── SOS banner — highlighted when friends are in unsafe areas ── */}
            <div className={`rounded-2xl p-4 mb-4 ${
              unsafeCount > 0
                ? 'bg-red-500 text-white'
                : 'bg-slate-800 text-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  unsafeCount > 0 ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {unsafeCount > 0
                      ? `${unsafeCount} friend${unsafeCount > 1 ? 's' : ''} in a lower-safety area`
                      : 'Emergency SOS'}
                  </p>
                  <p className="text-xs text-white/80 mt-0.5">
                    {unsafeCount > 0
                      ? 'Tap the SOS button on their card or use the map SOS button in an emergency.'
                      : 'Tap the red SOS button on the map to instantly alert your closest online friends with your location.'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Activity log (ping / SOS confirmations) ────────────── */}
            {(pingLog.length > 0 || sosLog.length > 0) && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 mb-3 flex flex-col gap-1">
                {sosLog[0] && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-700">{sosLog[0]}</span>
                  </div>
                )}
                {pingLog[0] && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700">{pingLog[0]}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Friends list ──────────────────────────────────────── */}
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
              Friends Nearby
            </p>

            <div className="flex flex-col gap-2.5">
              {friends
                .slice()
                .sort((a, b) => {
                  if (!a.safeZone && b.safeZone)   return -1
                  if (a.safeZone  && !b.safeZone)  return 1
                  if (a.status === 'online' && b.status !== 'online') return -1
                  if (a.status !== 'online' && b.status === 'online') return 1
                  return 0
                })
                .map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onPing={handlePing}
                    onSos={handleSos}
                  />
                ))
              }
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
