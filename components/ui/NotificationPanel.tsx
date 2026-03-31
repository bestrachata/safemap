'use client'

/**
 * NotificationPanel — compact slide-down panel that appears just below
 * the top header bar.  Shows safety alerts, friend activity, and area
 * updates as a small overlay so the user can glance and dismiss quickly
 * without leaving the map.
 */

import { useState } from 'react'

interface Notification {
  id:      string
  type:    'alert' | 'friend' | 'area' | 'system'
  title:   string
  body:    string
  time:    string
  read:    boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'alert', read: false,
    title: 'Safety Alert — East Village',
    body:  'A shooting incident was reported near Ave B & E 7th St, 2 hours ago.',
    time:  '2h ago',
  },
  {
    id: 'n2', type: 'friend', read: false,
    title: 'Marcus Lee is in a lower-safety area',
    body:  'Your friend Marcus is currently in the Lower East Side. Consider sending a check-in ping.',
    time:  '15m ago',
  },
  {
    id: 'n3', type: 'area', read: false,
    title: 'Your saved route has a new alert',
    body:  'The Times Square → Central Park route has 2 new incident reports this week.',
    time:  '1h ago',
  },
  {
    id: 'n4', type: 'friend', read: true,
    title: 'Sarah Kim started a Group Journey',
    body:  'Sarah invited you to join a group journey in Central Park. Tap to view.',
    time:  '3h ago',
  },
  {
    id: 'n5', type: 'system', read: true,
    title: 'Weekly safety summary',
    body:  'Midtown safety score improved by 4 pts this week. Crime reports are down 12%.',
    time:  '1d ago',
  },
]

const TYPE_ICON: Record<Notification['type'], React.ReactNode> = {
  alert:  <span className="text-base">⚠️</span>,
  friend: <span className="text-base">👥</span>,
  area:   <span className="text-base">📍</span>,
  system: <span className="text-base">🛡️</span>,
}

const TYPE_COLOR: Record<Notification['type'], string> = {
  alert:  'bg-red-50 border-red-100',
  friend: 'bg-blue-50 border-blue-100',
  area:   'bg-amber-50 border-amber-100',
  system: 'bg-green-50 border-green-100',
}

interface Props {
  open:    boolean
  onClose: () => void
  /** px offset from top — should match the bottom edge of the TopBar */
  topOffset?: number
}

export default function NotificationPanel({ open, onClose, topOffset = 76 }: Props) {
  const [notes, setNotes] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  const unreadCount = notes.filter(n => !n.read).length

  function markAllRead() {
    setNotes(prev => prev.map(n => ({ ...n, read: true })))
  }

  function dismiss(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  if (!open) return null

  return (
    <>
      {/* Invisible backdrop — click to close */}
      <div
        className="absolute inset-0 z-[1050]"
        onClick={onClose}
      />

      {/* Panel — appears below the top header */}
      <div
        className="absolute left-3 right-3 z-[1051] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        style={{ top: topOffset + 8 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto max-h-[60vh]">
          {notes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-sm font-medium text-slate-500">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No new notifications</p>
            </div>
          ) : (
            notes.map((n, i) => (
              <div
                key={n.id}
                className={`relative flex items-start gap-3 px-4 py-3 transition-colors
                  ${i < notes.length - 1 ? 'border-b border-slate-50' : ''}
                  ${n.read ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                {/* Unread dot */}
                {!n.read && (
                  <span className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}

                {/* Type icon */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${TYPE_COLOR[n.type]}`}>
                  {TYPE_ICON[n.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${n.read ? 'font-medium text-slate-600' : 'font-semibold text-slate-800'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-300 mt-1 font-medium">{n.time}</p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(n.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors mt-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
