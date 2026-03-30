'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapAdapter } from '@/lib/adapters/map'
import { GridCell, HeatmapLayer, RouteResult, LatLng, CrimeLayerFilter, DEFAULT_CRIME_FILTER, GeocodingResult } from '@/lib/types'
import GridOverlay from './GridOverlay'
import RouteLayer from './RouteLayer'
import NavigationMarker from './NavigationMarker'
import ShootingLayer from './ShootingLayer'
import HateCrimeLayer from './HateCrimeLayer'
import CfsLayer from './CfsLayer'
import SyringeLayer from './SyringeLayer'
import CctvLayer from './CctvLayer'
import SearchPinMarker from './SearchPinMarker'
import { Camera } from '@/lib/cctv'

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
  // navigation tracking
  navPosition: LatLng | null
  navBearing: number
  crimeFilter?: CrimeLayerFilter
  // cctv layer
  showCctv?: boolean
  selectedCameraId?: string | null
  onCameraSelect?: (cam: Camera) => void
  // search pin
  searchPin?: GeocodingResult | null
}

export default function SafetyMap({
  cells, activeLayer, selectedCellId, onCellClick,
  routes, selectedRoute, onRouteSelect,
  flyToLocation, fitRouteBounds,
  navPosition, navBearing,
  crimeFilter = DEFAULT_CRIME_FILTER,
  showCctv = false,
  selectedCameraId = null,
  onCameraSelect,
  searchPin = null,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const center = MapAdapter.getDefaultCenter()

  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo([flyToLocation.lat, flyToLocation.lng], 15, { duration: 1.2 })
    }
  }, [flyToLocation])

  // Fit full route into view (overview before starting navigation)
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

  // Follow the current navigation position step by step
  useEffect(() => {
    if (!navPosition || !mapRef.current) return
    mapRef.current.flyTo([navPosition.lat, navPosition.lng], 17, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.5,
    })
  }, [navPosition])

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

      {/* Real crime incident dots — only when crime layer is active */}
      <ShootingLayer   visible={activeLayer === 'crime' && crimeFilter.showShootings}  filter={crimeFilter} />
      <HateCrimeLayer  visible={activeLayer === 'crime' && crimeFilter.showHateCrimes} filter={crimeFilter} />
      <CfsLayer        visible={activeLayer === 'crime'}                                filter={crimeFilter} />

      {/* Syringe collection events — shown when visual appeal layer is active */}
      <SyringeLayer    visible={activeLayer === 'visualAppeal' && crimeFilter.showSyringes} filter={crimeFilter} />

      {/* Search result pin — shown after user selects a location from the TopBar */}
      <SearchPinMarker result={searchPin} />

      {/* CCTV camera markers — shown when the CCTV layer is toggled on */}
      <CctvLayer
        visible={showCctv}
        selectedCameraId={selectedCameraId}
        onCameraSelect={cam => onCameraSelect?.(cam)}
      />

      {/* Directional user marker — only shown during active navigation */}
      {navPosition && (
        <NavigationMarker position={navPosition} bearing={navBearing} />
      )}
    </MapContainer>
  )
}
