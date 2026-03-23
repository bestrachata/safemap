'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapAdapter } from '@/lib/adapters/map'
import { GridCell, HeatmapLayer, RouteResult, LatLng } from '@/lib/types'
import GridOverlay from './GridOverlay'
import RouteLayer from './RouteLayer'

// Fix Leaflet default icon paths in Next.js
import L from 'leaflet'
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  cells: GridCell[]
  activeLayer: HeatmapLayer
  selectedCellId: string | null
  onCellClick: (cell: GridCell) => void
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  onRouteSelect: (route: RouteResult) => void
  flyToLocation: LatLng | null
  fitRouteBounds: LatLng[] | null
}

export default function SafetyMap({
  cells,
  activeLayer,
  selectedCellId,
  onCellClick,
  routes,
  selectedRoute,
  onRouteSelect,
  flyToLocation,
  fitRouteBounds,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const center = MapAdapter.getDefaultCenter()

  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo([flyToLocation.lat, flyToLocation.lng], 15, { duration: 1.2 })
    }
  }, [flyToLocation])

  // Animate map to show the full route, leaving room above the bottom sheet
  useEffect(() => {
    if (!fitRouteBounds || fitRouteBounds.length < 2 || !mapRef.current) return
    const bounds = L.latLngBounds(fitRouteBounds.map(p => [p.lat, p.lng] as [number, number]))
    mapRef.current.fitBounds(bounds, {
      paddingTopLeft: L.point(50, 80),
      paddingBottomRight: L.point(50, 360),
      animate: true,
      duration: 1.2,
      maxZoom: 14,
    })
  }, [fitRouteBounds])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={MapAdapter.getDefaultZoom()}
      maxZoom={MapAdapter.getMaxZoom()}
      className="w-full h-full"
      zoomControl={false}
      ref={mapRef}
    >
      <TileLayer
        url={MapAdapter.getTileUrl()}
        attribution={MapAdapter.getTileAttribution()}
        maxZoom={MapAdapter.getMaxZoom()}
      />

      <GridOverlay
        cells={cells}
        activeLayer={activeLayer}
        selectedCellId={selectedCellId}
        onCellClick={onCellClick}
      />

      <RouteLayer
        routes={routes}
        selectedRoute={selectedRoute}
        onRouteSelect={onRouteSelect}
      />
    </MapContainer>
  )
}
