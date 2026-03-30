'use client'

import React from 'react'
import { Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { LatLng, RouteResult } from '@/lib/types'
import { scoreToColor } from '@/lib/safetyScore'

interface Props {
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  onRouteSelect: (route: RouteResult) => void
}

/** Find the index in `geometry` whose point is closest to `target`. */
function closestIndex(geometry: LatLng[], target: LatLng): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < geometry.length; i++) {
    const d = Math.hypot(geometry[i].lat - target.lat, geometry[i].lng - target.lng)
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

/**
 * Split the route geometry into per-step sub-polylines and return each with
 * a safety color derived from the step's alert status + overall route score.
 */
function buildSegments(route: RouteResult) {
  const { geometry, steps, safetyScore } = route
  if (!steps.length || geometry.length < 2) return null

  const indices = steps.map(s => closestIndex(geometry, s.latlng))

  return steps.map((step, i) => {
    const start = indices[i]
    const end   = i < indices.length - 1 ? indices[i + 1] : geometry.length - 1
    if (end <= start) return null

    const slice = geometry.slice(start, end + 1)
    // Danger segments get a warm amber/red; safe segments follow the safety score hue
    const color = step.safetyAlert
      ? (safetyScore < 50 ? '#DC2626' : '#D97706')   // red if already low, amber otherwise
      : scoreToColor(safetyScore)

    return { slice, color, key: `seg-${i}` }
  }).filter(Boolean) as { slice: LatLng[]; color: string; key: string }[]
}

function createPinIcon(color: string, label?: string) {
  const inner = label
    ? `<span style="font-size:9px;font-weight:700;color:white;line-height:1">${label}</span>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${label ? 22 : 14}px;height:${label ? 22 : 14}px;
      background:${color};border:2.5px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">${inner}</div>`,
    iconSize: [label ? 22 : 14, label ? 22 : 14],
    iconAnchor: [label ? 11 : 7, label ? 11 : 7],
  })
}

export default function RouteLayer({ routes, selectedRoute, onRouteSelect }: Props) {
  return (
    <>
      {routes.map((route, i) => {
        const isSelected = selectedRoute === route
        const baseColor  = scoreToColor(route.safetyScore ?? 50)
        const segments   = isSelected ? buildSegments(route) : null

        return (
          <React.Fragment key={`route-${i}`}>
            {isSelected && segments ? (
              /* Selected route: render each step's segment in its own safety colour */
              <>
                {/* Soft white halo behind the coloured line for readability */}
                <Polyline
                  positions={route.geometry.map(p => [p.lat, p.lng])}
                  pathOptions={{ color: 'white', weight: 10, opacity: 0.5, lineCap: 'round', lineJoin: 'round' }}
                  eventHandlers={{ click: () => onRouteSelect(route) }}
                />
                {segments.map(seg => (
                  <Polyline
                    key={seg.key}
                    positions={seg.slice.map(p => [p.lat, p.lng])}
                    pathOptions={{
                      color: seg.color,
                      weight: 6,
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                    eventHandlers={{ click: () => onRouteSelect(route) }}
                  />
                ))}
              </>
            ) : (
              /* Non-selected routes: single colour from safety score, dashed */
              <Polyline
                positions={route.geometry.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: baseColor,
                  weight: 3.5,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                  dashArray: '8 6',
                }}
                eventHandlers={{ click: () => onRouteSelect(route) }}
              />
            )}
          </React.Fragment>
        )
      })}

      {/* Origin / destination pins */}
      {routes.length > 0 && (() => {
        const first = routes[0].geometry[0]
        const last  = routes[0].geometry[routes[0].geometry.length - 1]
        return (
          <>
            <Marker position={[first.lat, first.lng]} icon={createPinIcon('#16A34A', 'A')}>
              <Popup><span className="text-xs font-semibold">Origin</span></Popup>
            </Marker>
            <Marker position={[last.lat, last.lng]} icon={createPinIcon('#DC2626', 'B')}>
              <Popup><span className="text-xs font-semibold">Destination</span></Popup>
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
              html: `<div style="width:22px;height:22px;background:#D97706;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:11px">⚠️</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          >
            <Popup><span className="text-xs leading-relaxed">{step.safetyAlert}</span></Popup>
          </Marker>
        ))}
    </>
  )
}
