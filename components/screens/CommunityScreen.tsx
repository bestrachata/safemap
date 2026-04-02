'use client'

/**
 * CommunityScreen — social-media-style safety feed.
 *
 * Sections:
 *  1. Stories bar    — quick avatar updates, + self "post" shortcut
 *  2. Insights row   — horizontal scroll cards (safest area, trending, streak)
 *  3. Filter tabs    — All / Alerts / Safe Spots / Tips
 *  4. Post feed      — rich cards with photo, location, reactions
 *  5. Post composer  — slide-up sheet to create a new update
 */

import { useState } from 'react'
import { scoreToColor } from '@/lib/safetyScore'
import { SELF_USER } from '@/lib/friendData'

// ─── Types ──────────────────────────────────────────────────────────────────

type PostCategory = 'alert' | 'caution' | 'safe' | 'tip'
type FilterKey    = 'all' | 'alert' | 'safe' | 'tip'

interface Post {
  id:        number
  user:      string
  avatar:    string
  verified?: boolean
  time:      string
  location:  string
  lat:       number
  lng:       number
  category:  PostCategory
  photo?:    string
  caption:   string
  score:     number
  likes:     number
  comments:  number
}

interface Story {
  id:       number
  user:     string
  avatar:   string
  isSelf?:  boolean
  category: PostCategory
  unseen:   boolean
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const CAT_CFG: Record<PostCategory, { label: string; color: string; bg: string; text: string; ring: string }> = {
  alert:   { label: '🚨 Alert',    color: '#DC2626', bg: 'bg-red-50',    text: 'text-red-600',    ring: 'ring-red-400'   },
  caution: { label: '⚠️ Caution',  color: '#D97706', bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-400' },
  safe:    { label: '✅ Safe Spot', color: '#0d9488', bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-400' },
  tip:     { label: '💡 Tip',      color: '#2563EB', bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-400'  },
}

const MOCK_STORIES: Story[] = [
  { id: 0, user: 'You',      avatar: SELF_USER.avatarUrl,                 isSelf: true,  category: 'tip',     unseen: false },
  { id: 1, user: 'Sarah M.', avatar: 'https://i.pravatar.cc/150?img=47', category: 'safe',   unseen: true  },
  { id: 2, user: 'James K.', avatar: 'https://i.pravatar.cc/150?img=12', category: 'alert',  unseen: true  },
  { id: 3, user: 'Priya S.', avatar: 'https://i.pravatar.cc/150?img=25', category: 'tip',    unseen: true  },
  { id: 4, user: 'David L.', avatar: 'https://i.pravatar.cc/150?img=8',  category: 'safe',   unseen: false },
  { id: 5, user: 'Mei C.',   avatar: 'https://i.pravatar.cc/150?img=56', category: 'caution',unseen: true  },
  { id: 6, user: 'Omar A.',  avatar: 'https://i.pravatar.cc/150?img=3',  category: 'tip',    unseen: false },
]

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    user: 'Sarah M.', avatar: 'https://i.pravatar.cc/150?img=47', verified: true,
    time: '8 min ago', location: 'Times Square, 42nd St', lat: 40.7580, lng: -73.9855,
    category: 'alert',
    photo: 'https://picsum.photos/seed/ts42/600/360',
    caption: 'Aggressive panhandler near the TKTS booth entrance. Avoid the north steps late at night — saw multiple people being followed. Police have been notified.',
    score: 38, likes: 24, comments: 7,
  },
  {
    id: 2,
    user: 'James K.', avatar: 'https://i.pravatar.cc/150?img=12', verified: true,
    time: '42 min ago', location: "Hell's Kitchen, 9th Ave", lat: 40.7630, lng: -73.9893,
    category: 'safe',
    photo: 'https://picsum.photos/seed/hk9av/600/360',
    caption: 'Evening walk from 42nd to 50th along 9th Ave is great right now. Well-lit storefronts, lots of foot traffic, and a visible NYPD patrol car parked at 46th.',
    score: 84, likes: 53, comments: 12,
  },
  {
    id: 3,
    user: 'Priya S.', avatar: 'https://i.pravatar.cc/150?img=25',
    time: '1 hr ago', location: 'East Harlem, 116th St', lat: 40.7980, lng: -73.9378,
    category: 'caution',
    photo: 'https://picsum.photos/seed/eh116/600/360',
    caption: 'Multiple car break-ins reported near Park Ave intersection this afternoon. Saw shattered glass on at least 3 vehicles. Keep valuables out of sight.',
    score: 44, likes: 31, comments: 9,
  },
  {
    id: 4,
    user: 'David L.', avatar: 'https://i.pravatar.cc/150?img=8',
    time: '2 hr ago', location: 'Financial District, Wall St', lat: 40.7069, lng: -74.0089,
    category: 'safe',
    photo: 'https://picsum.photos/seed/fidi/600/360',
    caption: 'Great police presence around NYSE area during evening commute. Perfect for solo walks, even late. The FiDi deserves a better safety rep.',
    score: 91, likes: 18, comments: 4,
  },
  {
    id: 5,
    user: 'Mei C.', avatar: 'https://i.pravatar.cc/150?img=56',
    time: '3 hr ago', location: 'Chinatown, Mott St', lat: 40.7157, lng: -73.9970,
    category: 'tip',
    photo: 'https://picsum.photos/seed/china/600/360',
    caption: 'Pro tip for Chinatown at night: stick to Canal St rather than the side streets. Canal is busy, well-lit, and has constant foot traffic past midnight.',
    score: 66, likes: 44, comments: 16,
  },
  {
    id: 6,
    user: 'Omar A.', avatar: 'https://i.pravatar.cc/150?img=3', verified: true,
    time: '5 hr ago', location: 'Midtown East, Lexington Ave', lat: 40.7549, lng: -73.9721,
    category: 'tip',
    caption: "If you're taking the 4/5/6 late at night, the 51st St station is much better lit and staffed than Grand Central right now due to construction. Easy 2-block walk.",
    score: 76, likes: 62, comments: 21,
  },
  {
    id: 7,
    user: 'Lena R.', avatar: 'https://i.pravatar.cc/150?img=44',
    time: '6 hr ago', location: 'Washington Heights, 181st St', lat: 40.8511, lng: -73.9370,
    category: 'alert',
    photo: 'https://picsum.photos/seed/wh181/600/360',
    caption: 'Witnessed a robbery attempt near the A/1 station entrance around 11pm. Two individuals on bikes snatching phones. Stay aware near the station exits.',
    score: 29, likes: 77, comments: 34,
  },
  {
    id: 8,
    user: 'Kenji T.', avatar: 'https://i.pravatar.cc/150?img=60',
    time: '8 hr ago', location: 'Tribeca, Hudson St', lat: 40.7195, lng: -74.0089,
    category: 'safe',
    photo: 'https://picsum.photos/seed/tribeca/600/360',
    caption: "Tribeca at midnight is surprisingly chill. Quiet streets, good lighting, mostly restaurant-goers. Felt completely safe walking 10 blocks alone — this is NYC's best kept secret.",
    score: 89, likes: 105, comments: 28,
  },
]

const INSIGHTS = [
  {
    id: 'safest',
    icon: '🏆',
    label: 'Safest This Week',
    value: 'Tribeca',
    sub: 'Score 89 · ↑ 4pts',
    color: 'from-green-500 to-emerald-400',
  },
  {
    id: 'trending',
    icon: '🔥',
    label: 'Most Active',
    value: "Hell's Kitchen",
    sub: '47 new reports',
    color: 'from-orange-500 to-amber-400',
  },
  {
    id: 'posts',
    icon: '📸',
    label: 'Posts Today',
    value: '138',
    sub: 'Across 32 zones',
    color: 'from-blue-500 to-indigo-400',
  },
  {
    id: 'streak',
    icon: '⚡',
    label: 'Top Reporter',
    value: 'Sarah M.',
    sub: '23 posts · Verified',
    color: 'from-purple-500 to-violet-400',
  },
]

// ─── Composer initial state ────────────────────────────────────────────────

const BLANK_FORM = { caption: '', location: '', category: 'safe' as PostCategory }

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all',   label: 'All'       },
  { key: 'alert', label: '🚨 Alerts' },
  { key: 'safe',  label: '✅ Safe'   },
  { key: 'tip',   label: '💡 Tips'   },
]

// ─── Sub-components ────────────────────────────────────────────────────────

function StoryBubble({ story, onClick }: { story: Story; onClick: () => void }) {
  const cfg = CAT_CFG[story.category]
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="relative">
        {story.isSelf ? (
          <div className={`w-14 h-14 rounded-full ring-2 ring-offset-2 ring-green-500 overflow-hidden`}>
            <img src={story.avatar} alt="You" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-600 rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        ) : (
          <div className={`w-14 h-14 rounded-full p-0.5 ${story.unseen ? `ring-2 ring-offset-1 ${cfg.ring}` : 'ring-1 ring-offset-1 ring-slate-200'}`}>
            <img src={story.avatar} alt={story.user} className="w-full h-full object-cover rounded-full" />
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-500 font-medium w-14 text-center truncate">
        {story.isSelf ? 'Your story' : story.user.split(' ')[0]}
      </span>
    </button>
  )
}

function InsightCard({ icon, label, value, sub, color }: typeof INSIGHTS[0]) {
  return (
    <div className={`flex-shrink-0 w-36 rounded-2xl bg-gradient-to-br ${color} p-3.5 text-white shadow-md`}>
      <span className="text-2xl leading-none">{icon}</span>
      <p className="text-[10px] font-semibold opacity-80 mt-2 uppercase tracking-wide">{label}</p>
      <p className="text-base font-black leading-tight mt-0.5 truncate">{value}</p>
      <p className="text-[10px] opacity-75 mt-0.5">{sub}</p>
    </div>
  )
}

function PostCard({ post, liked, onLike, onComment }: {
  post: Post
  liked: boolean
  onLike: () => void
  onComment: () => void
}) {
  const cfg = CAT_CFG[post.category]
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Post header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        <div className="relative flex-shrink-0">
          <img src={post.avatar} alt={post.user} className="w-9 h-9 rounded-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[11px]">
            {post.category === 'alert'   && '🚨'}
            {post.category === 'caution' && '⚠️'}
            {post.category === 'safe'    && '✅'}
            {post.category === 'tip'     && '💡'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-slate-800">{post.user}</span>
            {post.verified && (
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] text-slate-400 truncate">{post.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-400">{post.time}</span>
        </div>
      </div>

      {/* Photo */}
      {post.photo && (
        <div className="relative mx-4 rounded-xl overflow-hidden">
          <img
            src={post.photo}
            alt="Post photo"
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          {/* Safety score badge over photo */}
          <div
            className="absolute top-2.5 right-2.5 rounded-xl px-2 py-1 flex items-center gap-1 backdrop-blur-sm bg-black/30"
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: scoreToColor(post.score) }} />
            <span className="text-[11px] font-black text-white">Safety {post.score}</span>
          </div>
        </div>
      )}

      {/* Caption */}
      <div className="px-4 pt-2.5 pb-1">
        <p className="text-sm text-slate-700 leading-relaxed">{post.caption}</p>
        {/* Inline safety score if no photo */}
        {!post.photo && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scoreToColor(post.score) }} />
            <span className="text-xs font-semibold" style={{ color: scoreToColor(post.score) }}>
              Safety Score {post.score}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0 px-3 pb-3 pt-1 border-t border-slate-50 mt-2">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl transition-colors
            ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-50'}`}
        >
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-semibold">{post.likes + (liked ? 1 : 0)}</span>
        </button>

        <button
          onClick={onComment}
          className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-semibold">{post.comments}</span>
        </button>

        <button className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs font-semibold">Share</span>
        </button>
      </div>
    </div>
  )
}

// ─── Post composer sheet ───────────────────────────────────────────────────

function PostComposer({ onClose, onPost }: { onClose: () => void; onPost: () => void }) {
  const [form, setForm] = useState(BLANK_FORM)
  const [hasPhoto, setHasPhoto] = useState(false)

  function submit() {
    if (!form.caption.trim()) return
    onPost()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 z-[1200]" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[1201] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onClose} className="text-sm text-slate-500 font-medium hover:text-slate-700">
            Cancel
          </button>
          <h3 className="text-sm font-bold text-slate-800">Share Update</h3>
          <button
            onClick={submit}
            disabled={!form.caption.trim()}
            className="text-sm font-bold text-green-600 disabled:text-slate-300 hover:text-green-700 transition-colors"
          >
            Post
          </button>
        </div>

        <div className="px-5 pb-4 space-y-4">
          {/* Category selector */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Category</p>
            <div className="flex gap-2">
              {(Object.keys(CAT_CFG) as PostCategory[]).map(cat => {
                const cfg = CAT_CFG[cat]
                const active = form.category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all
                      ${active ? `${cfg.bg} ${cfg.text} ring-1 ring-current` : 'bg-slate-100 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Photo area */}
          <button
            onClick={() => setHasPhoto(h => !h)}
            className={`w-full rounded-2xl border-2 border-dashed py-6 flex flex-col items-center gap-2 transition-colors
              ${hasPhoto ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
          >
            {hasPhoto ? (
              <>
                <span className="text-2xl">✅</span>
                <p className="text-sm font-medium text-green-700">Photo added (tap to remove)</p>
              </>
            ) : (
              <>
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">Add a photo</p>
                <p className="text-xs text-slate-400">Tap to attach from your library</p>
              </>
            )}
          </button>

          {/* Location */}
          <div className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3.5 py-2.5">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pin a location (e.g. Times Square)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Caption */}
          <div className="bg-slate-100 rounded-xl px-3.5 py-2.5">
            <textarea
              placeholder="What's happening here? Share what you see so others stay informed…"
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              rows={3}
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Safety note */}
          <p className="text-[11px] text-slate-400 text-center">
            Your update helps keep the community safe. Posts are anonymous by default.
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const [filter,          setFilter]          = useState<FilterKey>('all')
  const [liked,           setLiked]           = useState<Set<number>>(new Set())
  const [showComposer,    setShowComposer]     = useState(false)
  const [showThanks,      setShowThanks]       = useState(false)
  const [commentOpen,     setCommentOpen]      = useState<number | null>(null)

  function toggleLike(id: number) {
    setLiked(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function handlePost() {
    setShowThanks(true)
    setTimeout(() => setShowThanks(false), 3000)
  }

  const filtered = filter === 'all'
    ? MOCK_POSTS
    : MOCK_POSTS.filter(p =>
        filter === 'alert' ? p.category === 'alert' || p.category === 'caution'
        : p.category === filter
      )

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">AssureWay</p>
          <h2 className="text-xl font-black text-slate-800 leading-tight">Community</h2>
        </div>
        <div className="flex items-center gap-2">
          {showThanks && (
            <span className="text-xs font-semibold text-green-600 animate-pulse">✓ Posted!</span>
          )}
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post
          </button>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Stories bar */}
        <div className="bg-white border-b border-slate-100">
          <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
            {MOCK_STORIES.map(story => (
              <StoryBubble
                key={story.id}
                story={story}
                onClick={story.isSelf ? () => setShowComposer(true) : () => {}}
              />
            ))}
          </div>
        </div>

        {/* Insights row */}
        <div className="pt-4 pb-2">
          <div className="px-4 flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">This Week&apos;s Insights</h3>
            <span className="text-[10px] font-semibold text-green-600">View all →</span>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
            {INSIGHTS.map(ins => <InsightCard key={ins.id} {...ins} />)}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-4 pt-2 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all
                ${filter === tab.key
                  ? 'bg-green-600 text-white shadow-sm shadow-green-200'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Post feed */}
        <div className="px-4 pb-6 space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl">🔍</span>
              <p className="text-slate-500 text-sm mt-3 font-medium">No posts in this category yet.</p>
              <p className="text-slate-400 text-xs mt-1">Be the first to share an update!</p>
            </div>
          )}
          {filtered.map(post => (
            <PostCard
              key={post.id}
              post={post}
              liked={liked.has(post.id)}
              onLike={() => toggleLike(post.id)}
              onComment={() => setCommentOpen(commentOpen === post.id ? null : post.id)}
            />
          ))}
          {filtered.length > 0 && (
            <button className="w-full py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              Load more
            </button>
          )}
        </div>
      </div>

      {/* ── Quick comment hint (non-functional, UX placeholder) ─────────── */}
      {commentOpen !== null && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 z-[500]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
          <img src={SELF_USER.avatarUrl} alt="You" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2 text-sm text-slate-400">
            Add a comment…
          </div>
          <button onClick={() => setCommentOpen(null)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Post composer ────────────────────────────────────────────────── */}
      {showComposer && (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onPost={handlePost}
        />
      )}
    </div>
  )
}
