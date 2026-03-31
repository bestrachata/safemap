'use client'

/**
 * FriendQuickPanel — small floating card that appears when tapping a friend
 * marker on the map.
 *
 * Shows: avatar, name, status, last-seen, distance from user, location name,
 * safety zone badge, and quick Ping / SOS action buttons.
 */

import { useState } from 'react'
import { Friend, SELF_USER, timeAgo } from '@/lib/friendData'

// ── Haversine distance ────────────────────────────────────────────────────
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtDist(m: number): string {
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`
}

const STATUS_COLOR: Record<Friend['status'], string> = {
  online: '#22c55e',
  away:   '#f59e0b',
  ghost:  '#94a3b8',
}
const STATUS_LABEL: Record<Friend['status'], string> = {
  online: 'Online',
  away:   'Away',
  ghost:  'Hidden',
}

interface Props {
  friend:  Friend
  onClose: () => void
}

export default function FriendQuickPanel({ friend, onClose }: Props) {
  const [pingState, setPingState] = useState<'idle' | 'sent'>('idle')
  const [sosState,  setSosState]  = useState<'idle' | 'sent'>('idle')

  const distM  = haversineM(SELF_USER.lat, SELF_USER.lng, friend.lat, friend.lng)
  const ringColor = !friend.safeZone && friend.status === 'online'
    ? '#EF4444'
    : STATUS_COLOR[friend.status]

  function handlePing() {
    if (pingState !== 'idle') return
    setPingState('sent')
    setTimeout(() => setPingState('idle'), 3000)
  }

  function handleSos() {
    if (sosState !== 'idle') return
    setSosState('sent')
    setTimeout(() => setSosState('idle'), 4000)
  }

  return (
    <>
      {/* Invisible backdrop to close on outside tap */}
      <div
        className="absolute inset-0 z-[1099]"
        onClick={onClose}
      />

      {/* Card — sits above bottom nav, slides up */}
      <div
        className="absolute left-3 right-3 z-[1100] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors z-10"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-4 pt-4 pb-4">
          {/* Top row — avatar + info */}
          <div className="flex items-center gap-3.5 mb-3.5">
            {/* Avatar with status ring */}
            <div className="relative flex-shrink-0">
              <img
                src={friend.avatarUrl}
                alt={friend.name}
                className="w-14 h-14 rounded-2xl object-cover"
                style={{ border: `2.5px solid ${ringColor}` }}
              />
              {/* Status dot */}
              <span
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ backgroundColor: ringColor }}
              />
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-bold text-slate-800 leading-tight">{friend.name}</h3>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: ringColor, backgroundColor: `${ringColor}18` }}
                >
                  {STATUS_LABEL[friend.status]}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(friend.lastSeen)}</p>
            </div>
          </div>

          {/* Location + distance row */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3.5 py-2.5 mb-3">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-slate-700 truncate">{friend.locationName}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-semibold text-slate-500">{fmtDist(distM)}</span>
            </div>
          </div>

          {/* Safety zone warning */}
          {!friend.safeZone && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
              <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs font-semibold text-red-600">In a lower safety area</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5">
            {/* Ping */}
            <button
              onClick={handlePing}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all
                ${pingState === 'sent'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                }`}
            >
              <span className="text-base leading-none">{pingState === 'sent' ? '✓' : '👋'}</span>
              <span>{pingState === 'sent' ? 'Pinged!' : 'Ping'}</span>
            </button>

            {/* SOS */}
            <button
              onClick={handleSos}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all
                ${sosState === 'sent'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-sm shadow-red-200'
                }`}
            >
              <span className="text-base leading-none">{sosState === 'sent' ? '✓' : '🆘'}</span>
              <span>{sosState === 'sent' ? 'Alert sent' : 'SOS'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
