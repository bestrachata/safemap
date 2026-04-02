'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { LatLng } from '@/lib/types'

interface Props {
  position: LatLng
  bearing: number   // degrees clockwise from north
  color?: string
}

/**
 * A Leaflet DivIcon marker that renders a pulsing green arrow pointing in the
 * direction of travel. Recreated whenever position or bearing changes.
 */
export default function NavigationMarker({ position, bearing, color = '#0d9488' }: Props) {
  const map = useMap()

  useEffect(() => {
    // Arrow SVG — points UP at 0° so CSS rotation maps 0 = north, 90 = east, etc.
    const arrowHtml = `
      <div style="position:relative;width:52px;height:52px;">
        <!-- outer pulsing ring -->
        <div class="nav-pulse-ring" style="
          position:absolute;inset:0;border-radius:50%;
          background:${color}26;
        "></div>
        <!-- inner solid circle -->
        <div style="
          position:absolute;inset:8px;border-radius:50%;
          background:white;box-shadow:0 2px 8px rgba(0,0,0,0.2);
        "></div>
        <!-- directional arrow -->
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%) rotate(${bearing}deg);
          width:30px;height:30px;
        ">
          <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="15" fill="${color}"/>
            <!-- chevron arrow pointing north (0°) -->
            <path d="M15 7 L22 20 L15 16 L8 20 Z" fill="white"/>
          </svg>
        </div>
      </div>
    `

    const icon = L.divIcon({
      className: '',
      html: arrowHtml,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
    })

    const marker = L.marker([position.lat, position.lng], {
      icon,
      zIndexOffset: 3000,
      interactive: false,
    }).addTo(map)

    return () => { marker.remove() }
  }, [position, bearing, color, map])

  return null
}
