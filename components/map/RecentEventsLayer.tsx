'use client'

/**
 * RecentEventsLayer — most recent high-priority safety incidents as
 * SVG pin-icon markers. Shootings (red), hate crimes (orange), and
 * severe calls-for-service (amber) are the three categories shown.
 *
 * Data is pulled from the already-cached modules so there is no
 * additional network cost.
 */

import { useEffect, useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { getShootings } from '@/lib/shootings'
import { getHateCrimes, hateCrimesToPoints } from '@/lib/hateCrimes'
import { getCallsForService } from '@/lib/callsForService'

interface Event {
  id:       string
  lat:      number
  lng:      number
  type:     'shooting' | 'hate' | 'cfs'
  label:    string
  dateRaw:  string   // ISO string for sorting
}

// ── Colours per event type ────────────────────────────────────────────────────
const CONFIG = {
  shooting: { bg: '#DC2626', label: 'Shooting',   textColor: '#FEE2E2' },
  hate:     { bg: '#EA580C', label: 'Hate Crime', textColor: '#FFEDD5' },
  cfs:      { bg: '#D97706', label: 'Serious Call',textColor: '#FEF3C7' },
} as const

// ── SVG icon strings (white, embedded in DivIcon HTML) ───────────────────────
const SVG = {
  // Bold exclamation inside a circle — shooting
  shooting: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2.2"/>
    <path d="M12 7.5v5.5" stroke="white" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1.2" fill="white"/>
  </svg>`,

  // Warning triangle — hate crime
  hate: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke="white" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 9.5v4.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="17.5" r="1.1" fill="white"/>
  </svg>`,

  // Bell — serious call for service
  cfs: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"
      stroke="white" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`,
} as const

// ── Map pin DivIcon factory ───────────────────────────────────────────────────
function makePin(type: Event['type']) {
  const bg  = CONFIG[type].bg
  const svg = SVG[type]
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:36px">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${bg};
        box-shadow:0 3px 10px rgba(0,0,0,0.28);
        display:flex;align-items:center;justify-content:center;
      ">${svg}</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:9px solid ${bg};
        margin-top:-1px;
      "></div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [36, 45], iconAnchor: [18, 45] })
}

const PIN_CACHE = {
  shooting: makePin('shooting'),
  hate:     makePin('hate'),
  cfs:      makePin('cfs'),
}

// ── Date formatter: "15 March 2024" ──────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
function fmtDate(iso: string): string {
  if (!iso) return 'Unknown date'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Unknown date'
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ── How many per category to show ────────────────────────────────────────────
const MAX_PER_TYPE = 6   // 6 × 3 types = 18 markers total

// ── Component ────────────────────────────────────────────────────────────────
export default function RecentEventsLayer() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    async function load() {
      const [shootings, hateCrimes, cfsList] = await Promise.all([
        getShootings(),
        getHateCrimes(),
        getCallsForService(),
      ])

      const evts: Event[] = []

      // ── Shootings — always highest priority ──
      shootings
        .filter(s => s.lat && s.lng && s.date)
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        .slice(0, MAX_PER_TYPE)
        .forEach((s, i) => evts.push({
          id: `sh-${i}`, lat: s.lat, lng: s.lng, type: 'shooting',
          label: 'Shooting Incident',
          dateRaw: s.date ?? '',
        }))

      // ── Hate crimes ──
      const hcPoints = hateCrimesToPoints(hateCrimes)
      hateCrimes
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        .slice(0, MAX_PER_TYPE)
        .forEach((hc, i) => {
          const pt = hcPoints[i]
          if (!pt) return
          evts.push({
            id: `hc-${i}`, lat: pt.lat, lng: pt.lng, type: 'hate',
            label: hc.offense || 'Hate Crime',
            dateRaw: hc.date ?? '',
          })
        })

      // ── CFS — severity 3 only (most serious) ──
      cfsList
        .filter(c => c.severity === 3 && c.lat && c.lng && c.date)
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
        .slice(0, MAX_PER_TYPE)
        .forEach((c, i) => evts.push({
          id: `cfs-${i}`, lat: c.lat, lng: c.lng, type: 'cfs',
          label: c.typeDesc || 'Serious Incident',
          dateRaw: c.date ?? '',
        }))

      // Sort all events newest-first so z-index naturally puts recent ones on top
      evts.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw))
      setEvents(evts)
    }
    load()
  }, [])

  return (
    <>
      {events.map((ev, idx) => (
        <Marker
          key={ev.id}
          position={[ev.lat, ev.lng]}
          icon={PIN_CACHE[ev.type]}
          zIndexOffset={500 - idx}   // newer events render on top
        >
          <Popup>
            <div style={{ minWidth: 160, fontFamily: 'inherit' }}>
              {/* Category badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: CONFIG[ev.type].bg,
                color: 'white',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 99,
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 11 }}>
                  {ev.type === 'shooting' ? '⚠' : ev.type === 'hate' ? '△' : '🔔'}
                </span>
                {CONFIG[ev.type].label}
              </div>

              {/* Incident label */}
              <p style={{ margin: 0, fontWeight: 600, fontSize: 12, color: '#1e293b', lineHeight: 1.35 }}>
                {ev.label}
              </p>

              {/* Date */}
              <p style={{ margin: '5px 0 0', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{flexShrink:0}}>
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {fmtDate(ev.dateRaw)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
