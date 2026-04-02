'use client'

/**
 * RouteLayer — draws navigation routes on the Leaflet map.
 *
 * The selected route is broken into segments where each segment is coloured
 * by the safety score of the zone it passes through, matching the active
 * heatmap layer (composite, crime, lighting, environment, crowd).
 *
 * Algorithm:
 *  1. For every geometry point find the GridCell it belongs to.
 *  2. Score that cell according to `activeLayer`.
 *  3. Map the score to a colour via `scoreToColor`.
 *  4. Merge consecutive same-colour points → minimal number of Polylines.
 */

import React from 'react'
import { Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { GridCell, HeatmapLayer, LatLng, RouteResult } from '@/lib/types'
import { scoreToColor, getLayerScore } from '@/lib/safetyScore'

interface Props {
  routes:        RouteResult[]
  selectedRoute: RouteResult | null
  onRouteSelect: (route: RouteResult) => void
  cells?:        GridCell[]
  activeLayer?:  HeatmapLayer
}

// ── Cell lookup ───────────────────────────────────────────────────────────
function cellAtPoint(point: LatLng, cells: GridCell[]): GridCell | undefined {
  return cells.find(c =>
    point.lat >= c.bounds.south && point.lat <= c.bounds.north &&
    point.lng >= c.bounds.west  && point.lng <= c.bounds.east,
  )
}

// ── Build merged colour-segments from per-point cell lookup ───────────────
function buildColorSegments(
  route:       RouteResult,
  cells:       GridCell[],
  activeLayer: HeatmapLayer,
): { slice: LatLng[]; color: string; score: number; key: string }[] {
  const { geometry, safetyScore } = route
  if (geometry.length < 2) return []

  const fallbackScore = safetyScore ?? 68

  // Map every point → hex colour.
  // For performance on long real-street routes (400+ points) we reuse the
  // previous result for odd-indexed mid-points (every 2nd point is sampled).
  // Built with a for-loop so each entry can safely reference the previous one.
  const pointData: { color: string; score: number }[] = []
  for (let i = 0; i < geometry.length; i++) {
    if (i > 0 && i < geometry.length - 1 && i % 2 !== 0) {
      // Odd mid-point: inherit the colour from the previous point
      pointData.push(pointData[i - 1])
    } else {
      const cell  = cellAtPoint(geometry[i], cells)
      const score = cell ? getLayerScore(cell, activeLayer) : fallbackScore
      pointData.push({ color: scoreToColor(score), score })
    }
  }

  // Merge consecutive same-colour points into one segment
  const segments: { slice: LatLng[]; color: string; score: number; key: string }[] = []
  let cur = pointData[0]
  let slice: LatLng[] = [geometry[0]]

  for (let i = 1; i < geometry.length; i++) {
    const pd = pointData[i]
    if (pd.color === cur.color) {
      slice.push(geometry[i])
    } else {
      // Include the transition point in both segments for seamless joins
      slice.push(geometry[i])
      if (slice.length >= 2) {
        segments.push({ slice: [...slice], color: cur.color, score: cur.score, key: `seg-${segments.length}` })
      }
      cur   = pd
      slice = [geometry[i]]
    }
  }
  if (slice.length >= 2) {
    segments.push({ slice, color: cur.color, score: cur.score, key: `seg-${segments.length}` })
  }

  return segments
}

// ── Pin icon factory ──────────────────────────────────────────────────────
function createPinIcon(color: string, label?: string) {
  const inner = label
    ? `<span style="font-size:9px;font-weight:700;color:white;line-height:1">${label}</span>`
    : ''
  const size = label ? 22 : 14
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};border:2.5px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">${inner}</div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ── Segment tooltip label ─────────────────────────────────────────────────
function safetyLabel(score: number): string {
  if (score >= 82) return 'Safe'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Moderate'
  if (score >= 35) return 'Concerning'
  return 'Unsafe'
}

// ── Component ─────────────────────────────────────────────────────────────
export default function RouteLayer({
  routes, selectedRoute, onRouteSelect,
  cells = [], activeLayer = 'composite',
}: Props) {
  return (
    <>
      {routes.map((route, i) => {
        const isSelected = selectedRoute === route
        const baseColor  = scoreToColor(route.safetyScore ?? 50)

        if (isSelected && cells.length > 0) {
          const segments = buildColorSegments(route, cells, activeLayer)

          return (
            <React.Fragment key={`route-${i}`}>
              {/* Wide white halo for readability against any tile style */}
              <Polyline
                positions={route.geometry.map(p => [p.lat, p.lng])}
                pathOptions={{ color: 'white', weight: 12, opacity: 0.45, lineCap: 'round', lineJoin: 'round' }}
                eventHandlers={{ click: () => onRouteSelect(route) }}
              />

              {/* Coloured safety segments */}
              {segments.map(seg => (
                <Polyline
                  key={seg.key}
                  positions={seg.slice.map(p => [p.lat, p.lng])}
                  pathOptions={{
                    color:     seg.color,
                    weight:    6,
                    opacity:   0.95,
                    lineCap:   'round',
                    lineJoin:  'round',
                  }}
                  eventHandlers={{ click: () => onRouteSelect(route) }}
                >
                  {/* Hover tooltip showing safety level for this segment */}
                  <Popup>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: seg.color, flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>
                          {safetyLabel(seg.score)}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          Safety score {seg.score}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </React.Fragment>
          )
        }

        // Non-selected or no-cells fallback — single colour, dashed
        return (
          <Polyline
            key={`route-${i}`}
            positions={route.geometry.map(p => [p.lat, p.lng])}
            pathOptions={{
              color:     isSelected ? baseColor : baseColor,
              weight:    isSelected ? 5 : 3.5,
              opacity:   isSelected ? 0.9 : 0.35,
              lineCap:   'round',
              lineJoin:  'round',
              dashArray: isSelected ? undefined : '8 6',
            }}
            eventHandlers={{ click: () => onRouteSelect(route) }}
          />
        )
      })}

      {/* Origin / destination pins */}
      {routes.length > 0 && (() => {
        const first = routes[0].geometry[0]
        const last  = routes[0].geometry[routes[0].geometry.length - 1]
        return (
          <>
            <Marker position={[first.lat, first.lng]} icon={createPinIcon('#0d9488', 'A')}>
              <Popup><span style={{ fontSize: 12, fontWeight: 600 }}>Origin</span></Popup>
            </Marker>
            <Marker position={[last.lat, last.lng]} icon={createPinIcon('#DC2626', 'B')}>
              <Popup><span style={{ fontSize: 12, fontWeight: 600 }}>Destination</span></Popup>
            </Marker>
          </>
        )
      })()}

      {/* Safety alert markers on selected route */}
      {selectedRoute?.steps
        .filter(s => s.safetyAlert)
        .map((step, i) => (
          <Marker
            key={`alert-${i}`}
            position={[step.latlng.lat, step.latlng.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="
                width:22px;height:22px;background:#D97706;
                border:2.5px solid white;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:11px
              ">⚠️</div>`,
              iconSize:   [22, 22],
              iconAnchor: [11, 11],
            })}
          >
            <Popup>
              <span style={{ fontSize: 12, lineHeight: 1.5 }}>{step.safetyAlert}</span>
            </Popup>
          </Marker>
        ))}
    </>
  )
}
