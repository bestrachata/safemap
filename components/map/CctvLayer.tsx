'use client'

import { useEffect, useState, useCallback } from 'react'
import { Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Camera, fetchLiveCameras } from '@/lib/cctv'

interface Props {
  visible:          boolean
  onCameraSelect:   (cam: Camera) => void
  selectedCameraId: string | null
}

function makeCameraIcon(selected: boolean) {
  const bg   = selected ? '#0d9488' : '#1e293b'
  const ring = selected ? '#99f6e4' : '#e2e8f0'
  const size = selected ? 34 : 28
  const svg  = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="16" fill="${bg}" stroke="${ring}" stroke-width="2.5"/>
      <path d="M8 13h12a1 1 0 011 1v7a1 1 0 01-1 1H8a1 1 0 01-1-1v-7a1 1 0 011-1z"
            fill="white" fill-opacity="0.95"/>
      <path d="M21 15.5l4-2v7l-4-2" fill="white" fill-opacity="0.95"/>
      <circle cx="14" cy="17" r="2" fill="${bg}"/>
    </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

/** Inner component — has access to the Leaflet map context */
function CctvMarkers({
  allCameras, onCameraSelect, selectedCameraId,
}: {
  allCameras: Camera[]
  onCameraSelect: (cam: Camera) => void
  selectedCameraId: string | null
}) {
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null)

  const updateBounds = useCallback((map: L.Map) => {
    setBounds(map.getBounds())
  }, [])

  const map = useMapEvents({
    moveend: () => updateBounds(map),
    zoomend: () => updateBounds(map),
  })

  // Initialise bounds on first render
  useEffect(() => {
    updateBounds(map)
  }, [map, updateBounds])

  // Only render cameras inside the current viewport
  const visible = bounds
    ? allCameras.filter(c => bounds.contains([c.lat, c.lng]))
    : []

  return (
    <>
      {visible.map(cam => (
        <Marker
          key={cam.id}
          position={[cam.lat, cam.lng]}
          icon={makeCameraIcon(cam.id === selectedCameraId)}
          eventHandlers={{ click: () => onCameraSelect(cam) }}
          zIndexOffset={selectedCameraId === cam.id ? 500 : 100}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={0.94}>
            <div className="text-xs whitespace-nowrap">
              <p className="font-semibold text-slate-800">{cam.name.split('at')[0].trim()}</p>
              <p className="text-slate-400 text-[10px]">{cam.intersection}</p>
              {cam.videoUrl && (
                <p className="text-teal-600 text-[10px] font-semibold mt-0.5">● Live stream</p>
              )}
            </div>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

export default function CctvLayer({ visible, onCameraSelect, selectedCameraId }: Props) {
  const [allCameras, setAllCameras] = useState<Camera[]>([])

  // Load all cameras once on mount (or when first toggled on)
  useEffect(() => {
    if (!visible) return
    if (allCameras.length > 0) return
    fetchLiveCameras().then(live => setAllCameras(live ?? []))
  }, [visible, allCameras.length])

  if (!visible || allCameras.length === 0) return null

  return (
    <CctvMarkers
      allCameras={allCameras}
      onCameraSelect={onCameraSelect}
      selectedCameraId={selectedCameraId}
    />
  )
}
