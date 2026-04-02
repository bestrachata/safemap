'use client'

import L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'
import { GeocodingResult } from '@/lib/types'

interface Props {
  result: GeocodingResult | null
}

/** Classic teardrop pin in the app's green, with a white inner ring. */
function makeIcon() {
  const html = `
    <div style="
      position: relative;
      width: 28px;
      height: 38px;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
    ">
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- pin body -->
        <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z"
              fill="#0d9488"/>
        <!-- white outer circle -->
        <circle cx="14" cy="14" r="7" fill="white"/>
        <!-- green inner dot -->
        <circle cx="14" cy="14" r="3.5" fill="#0d9488"/>
      </svg>
    </div>`

  return L.divIcon({
    html,
    className: '',
    iconSize:   [28, 38],
    iconAnchor: [14, 38],   // tip of the pin at the coordinate
  })
}

const PIN_ICON = makeIcon()

export default function SearchPinMarker({ result }: Props) {
  if (!result) return null

  const name    = result.label.split(',')[0].trim()
  const address = result.label.split(',').slice(1, 3).join(',').trim()

  return (
    <Marker
      position={[result.latlng.lat, result.latlng.lng]}
      icon={PIN_ICON}
      zIndexOffset={2000}
    >
      <Tooltip
        direction="top"
        offset={[0, -40]}
        opacity={1}
        permanent
      >
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-800">{name}</p>
          {address && <p className="text-slate-400 mt-0.5">{address}</p>}
        </div>
      </Tooltip>
    </Marker>
  )
}
