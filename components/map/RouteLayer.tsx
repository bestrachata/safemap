'use client'

import { Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { RouteResult } from '@/lib/types'
import { scoreToColor } from '@/lib/safetyScore'

interface Props {
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  onRouteSelect: (route: RouteResult) => void
}

function createPinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function RouteLayer({ routes, selectedRoute, onRouteSelect }: Props) {
  return (
    <>
      {routes.map((route, i) => {
        const isSelected = selectedRoute?.label === route.label
        const color = route.label === 'safest' ? '#16A34A' : '#3B82F6'

        return (
          <Polyline
            key={`route-${i}`}
            positions={route.geometry.map(p => [p.lat, p.lng])}
            pathOptions={{
              color,
              weight: isSelected ? 6 : 3.5,
              opacity: isSelected ? 0.95 : 0.45,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: route.label === 'fastest' && !isSelected ? '8 6' : undefined,
            }}
            eventHandlers={{ click: () => onRouteSelect(route) }}
          />
        )
      })}

      {/* Origin + destination markers */}
      {routes.length > 0 && (
        <>
          <Marker
            position={[routes[0].geometry[0].lat, routes[0].geometry[0].lng]}
            icon={createPinIcon('#16A34A')}
          >
            <Popup>
              <span className="text-xs font-semibold">Origin</span>
            </Popup>
          </Marker>
          <Marker
            position={[
              routes[0].geometry[routes[0].geometry.length - 1].lat,
              routes[0].geometry[routes[0].geometry.length - 1].lng,
            ]}
            icon={createPinIcon('#DC2626')}
          >
            <Popup>
              <span className="text-xs font-semibold">Destination</span>
            </Popup>
          </Marker>
        </>
      )}

      {/* Safety alert markers on selected route */}
      {selectedRoute?.steps
        .filter(s => s.safetyAlert)
        .map((step, i) => (
          <Marker
            key={`alert-${i}`}
            position={[step.latlng.lat, step.latlng.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="width:20px;height:20px;background:#D97706;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:10px">⚠️</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <span className="text-xs">{step.safetyAlert}</span>
            </Popup>
          </Marker>
        ))}
    </>
  )
}
