/**
 * friendData.ts — Mock friend data for the AssureWay social layer.
 */

export type FriendStatus = 'online' | 'away' | 'ghost'

export interface Friend {
  id:          string
  name:        string
  initials:    string
  avatarColor: string
  avatarUrl:   string
  lat:         number
  lng:         number
  status:      FriendStatus
  locationName:string
  lastSeen:    string
  safeZone:    boolean
}

export const MOCK_FRIENDS: Friend[] = [
  {
    id: 'f1', name: 'Alice Chen', initials: 'AC', avatarColor: '#7C3AED',
    avatarUrl: 'https://i.pravatar.cc/80?img=47',
    lat: 40.7580, lng: -73.9855, status: 'online',
    locationName: 'Times Square', lastSeen: new Date(Date.now() - 2 * 60_000).toISOString(),
    safeZone: true,
  },
  {
    id: 'f2', name: 'Marcus Lee', initials: 'ML', avatarColor: '#0369A1',
    avatarUrl: 'https://i.pravatar.cc/80?img=12',
    lat: 40.7260, lng: -73.9844, status: 'online',
    locationName: 'East Village', lastSeen: new Date(Date.now() - 5 * 60_000).toISOString(),
    safeZone: false,
  },
  {
    id: 'f3', name: 'Sarah Kim', initials: 'SK', avatarColor: '#B45309',
    avatarUrl: 'https://i.pravatar.cc/80?img=25',
    lat: 40.7851, lng: -73.9683, status: 'online',
    locationName: 'Central Park', lastSeen: new Date(Date.now() - 1 * 60_000).toISOString(),
    safeZone: true,
  },
  {
    id: 'f4', name: 'Jordan Park', initials: 'JP', avatarColor: '#BE185D',
    avatarUrl: 'https://i.pravatar.cc/80?img=33',
    lat: 40.7157, lng: -73.9860, status: 'away',
    locationName: 'Lower East Side', lastSeen: new Date(Date.now() - 18 * 60_000).toISOString(),
    safeZone: false,
  },
  {
    id: 'f5', name: 'Emily Wang', initials: 'EW', avatarColor: '#065F46',
    avatarUrl: 'https://i.pravatar.cc/80?img=56',
    lat: 40.7549, lng: -73.9840, status: 'ghost',
    locationName: 'Midtown', lastSeen: new Date(Date.now() - 60 * 60_000).toISOString(),
    safeZone: true,
  },
]

export interface SelfUser {
  name:        string
  initials:    string
  avatarColor: string
  avatarUrl:   string
  lat:         number
  lng:         number
}

export const SELF_USER: SelfUser = {
  name: 'You', initials: 'ME', avatarColor: '#16A34A',
  avatarUrl: 'https://i.pravatar.cc/80?img=70',
  lat: 40.7484, lng: -73.9857,
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
