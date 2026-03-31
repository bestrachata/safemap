'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Friend, SELF_USER, SelfUser, timeAgo } from '@/lib/friendData'

interface Props {
  friends:         Friend[]
  selfUser:        SelfUser
  ghostMode:       boolean
  onFriendClick?:  (friend: Friend) => void
}

// ── Build a circular photo-avatar DivIcon ─────────────────────────────────
function makeAvatarIcon(
  avatarUrl:   string,
  avatarColor: string,       // ring / tail colour fallback
  status:      Friend['status'],
  safeZone:    boolean,
  isSelf = false,
) {
  const size     = isSelf ? 42 : 36
  const ringColor = !safeZone && status === 'online' ? '#EF4444'
                  : status === 'online'              ? '#22C55E'
                  : status === 'away'                ? '#F59E0B'
                  : '#94A3B8'

  const pulse = status === 'online' ? `
    <div style="
      position:absolute;inset:-4px;border-radius:50%;
      border:2px solid ${ringColor};
      animation:friendPulse 2.5s ease-out infinite;
      opacity:0.45;
    "></div>` : ''

  const glow = !safeZone && status === 'online'
    ? 'box-shadow:0 0 0 3px rgba(239,68,68,0.22),0 2px 8px rgba(0,0,0,0.22);'
    : 'box-shadow:0 2px 8px rgba(0,0,0,0.22);'

  const selfBadge = isSelf ? `
    <div style="
      position:absolute;top:-8px;left:50%;transform:translateX(-50%);
      background:#16A34A;color:white;font-size:7px;font-weight:800;
      padding:1px 5px;border-radius:99px;white-space:nowrap;
    ">YOU</div>` : ''

  const statusDot = `
    <div style="
      position:absolute;bottom:1px;right:1px;
      width:${isSelf ? 11 : 10}px;height:${isSelf ? 11 : 10}px;
      border-radius:50%;background:${ringColor};
      border:2px solid white;
    "></div>`

  const html = `
    <div style="position:relative;width:${size}px;height:${size + (isSelf ? 10 : 0) + 7}px;display:flex;flex-direction:column;align-items:center;">
      ${selfBadge}
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse}
        <img
          src="${avatarUrl}"
          width="${size}" height="${size}"
          style="
            width:${size}px;height:${size}px;border-radius:50%;
            object-fit:cover;display:block;
            border:2.5px solid white;
            ${glow}
          "
        />
        ${statusDot}
      </div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:7px solid white;
        filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));
        margin-top:-1px;
      "></div>
    </div>`

  const h = size + (isSelf ? 10 : 0) + 7
  return L.divIcon({ html, className: '', iconSize: [size, h], iconAnchor: [size / 2, h] })
}

const SELF_ICON = makeAvatarIcon(SELF_USER.avatarUrl, SELF_USER.avatarColor, 'online', true, true)

export default function FriendsLayer({ friends, selfUser, ghostMode, onFriendClick }: Props) {
  const visibleFriends = friends.filter(f => f.status !== 'ghost')

  return (
    <>
      {/* Self marker — keeps a simple popup */}
      {!ghostMode && (
        <Marker position={[selfUser.lat, selfUser.lng]} icon={SELF_ICON} zIndexOffset={1000}>
          <Popup>
            <div style={{ minWidth: 148, fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <img src={selfUser.avatarUrl} width={32} height={32}
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #16A34A' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>You</div>
                  <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>📍 Sharing location</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Empire State Building area</div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Friend markers — clicking opens the FriendQuickPanel instead of a Popup */}
      {visibleFriends.map(friend => {
        const icon = makeAvatarIcon(friend.avatarUrl, friend.avatarColor, friend.status, friend.safeZone)
        return (
          <Marker
            key={friend.id}
            position={[friend.lat, friend.lng]}
            icon={icon}
            zIndexOffset={friend.status === 'online' ? 800 : 600}
            eventHandlers={{ click: () => onFriendClick?.(friend) }}
          />
        )
      })}
    </>
  )
}
