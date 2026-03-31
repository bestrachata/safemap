'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapAdapter } from '@/lib/adapters/map'
import { GridCell, HeatmapLayer, RouteResult, LatLng, CrimeLayerFilter, DEFAULT_CRIME_FILTER, GeocodingResult, MapStyle } from '@/lib/types'
import { MAP_STYLES } from '@/components/ui/MapStylePicker'
import GridOverlay from './GridOverlay'
import RouteLayer from './RouteLayer'
import NavigationMarker from './NavigationMarker'
import ShootingLayer from './ShootingLayer'
import HateCrimeLayer from './HateCrimeLayer'
import CfsLayer from './CfsLayer'
import SyringeLayer from './SyringeLayer'
import SearchPinMarker from './SearchPinMarker'
import RecentEventsLayer from './RecentEventsLayer'
import FriendsLayer from './FriendsLayer'
import { Friend, SELF_USER } from '@/lib/friendData'

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
  navPosition: LatLng | null
  navBearing: number
  crimeFilter?: CrimeLayerFilter
  searchPin?: GeocodingResult | null
  mapStyle?: MapStyle
  friends?: Friend[]
  ghostMode?: boolean
  onFriendClick?: (friend: Friend) => void
}

export default function SafetyMap({
  cells, activeLayer, selectedCellId, onCellClick,
  routes, selectedRoute, onRouteSelect,
  flyToLocation, fitRouteBounds,
  navPosition, navBearing,
  crimeFilter = DEFAULT_CRIME_FILTER,
  searchPin = null,
  mapStyle = 'light',
  friends = [],
  ghostMode = false,
  onFriendClick,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const center = MapAdapter.getDefaultCenter()
  const tileConfig = MAP_STYLES.find(s => s.id === mapStyle) ?? MAP_STYLES[0]

  useEffect(() => {
    if (flyToLocation && mapRef.current) {
      mapRef.current.flyTo([flyToLocation.lat, flyToLocation.lng], 15, { duration: 1.2 })
    }
  }, [flyToLocation])

  useEffect(() => {
    if (!fitRouteBounds || fitRouteBounds.length < 2 || !mapRef.current) return
    const bounds = L.latLngBounds(fitRouteBounds.map(p => [p.lat, p.lng] as [number, number]))
    mapRef.current.fitBounds(bounds, {
      paddingTopLeft: L.point(50, 80),
      paddingBottomRight: L.point(50, 360),
      animate: true, duration: 1.2, maxZoom: 14,
    })
  }, [fitRouteBounds])

  useEffect(() => {
    if (!navPosition || !mapRef.current) return
    mapRef.current.flyTo([navPosition.lat, navPosition.lng], 17, {
      animate: true, duration: 0.9, easeLinearity: 0.5,
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
        key={tileConfig.id}
        url={tileConfig.tileUrl}
        attribution={tileConfig.attribution}
        maxZoom={MapAdapter.getMaxZoom()}
      />

      <GridOverlay cells={cells} activeLayer={activeLayer} selectedCellId={selectedCellId} onCellClick={onCellClick} />
      <RouteLayer
        routes={routes}
        selectedRoute={selectedRoute}
        onRouteSelect={onRouteSelect}
        cells={cells}
        activeLayer={activeLayer}
      />

      {/* Crime data dot layers */}
      <ShootingLayer  visible={activeLayer === 'crime' && crimeFilter.showShootings}  filter={crimeFilter} />
      <HateCrimeLayer visible={activeLayer === 'crime' && crimeFilter.showHateCrimes} filter={crimeFilter} />
      <CfsLayer       visible={activeLayer === 'crime'}                               filter={crimeFilter} />
      <SyringeLayer   visible={activeLayer === 'visualAppeal' && crimeFilter.showSyringes} filter={crimeFilter} />

      {/* Recent incident icons — always visible on the map */}
      <RecentEventsLayer />

      {/* Friend avatar pins */}
      <FriendsLayer
        friends={friends}
        selfUser={SELF_USER}
        ghostMode={ghostMode}
        onFriendClick={onFriendClick}
      />

      {/* Search pin */}
      <SearchPinMarker result={searchPin} />

      {/* Navigation arrow */}
      {navPosition && <NavigationMarker position={navPosition} bearing={navBearing} />}
    </MapContainer>
  )
}
