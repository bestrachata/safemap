'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo } from 'react'
import { GridCell, HeatmapLayer, NavigationState, RouteResult, GeocodingResult, LatLng, CrimeLayerFilter, DEFAULT_CRIME_FILTER } from '@/lib/types'
import { Camera } from '@/lib/cctv'
import { SafetyDataAdapter } from '@/lib/adapters/safety-data'
import { getBearing } from '@/lib/geoUtils'
import TopBar from '@/components/ui/TopBar'
import LayerSelector from '@/components/ui/LayerSelector'
import SafetyLegend from '@/components/ui/SafetyLegend'
import SOSButton from '@/components/ui/SOSButton'
import YearSliderBar from '@/components/ui/YearSliderBar'
import FilterDropdown from '@/components/ui/FilterDropdown'
import BottomNav, { Tab } from '@/components/ui/BottomNav'
import AreaDetailPanel from '@/components/panels/AreaDetailPanel'
import NavigationPanel from '@/components/panels/NavigationPanel'
import CctvPanel from '@/components/ui/CctvPanel'
import CommunityScreen from '@/components/screens/CommunityScreen'
import ProfileScreen from '@/components/screens/ProfileScreen'
import SettingsScreen from '@/components/screens/SettingsScreen'

const SafetyMap = dynamic(() => import('@/components/map/SafetyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading map...</p>
      </div>
    </div>
  ),
})

const DEFAULT_NAV_STATE: NavigationState = {
  origin: null, destination: null,
  routes: [], selectedRoute: null,
  isNavigating: false, currentStepIndex: 0,
}

const NAV_BAR_H = 64 // px — keep in sync with BottomNav h-16

export default function HomePage() {
  const [activeTab, setActiveTab]         = useState<Tab>('map')
  const [activeLayer, setActiveLayer]     = useState<HeatmapLayer>('composite')
  const [cells, setCells]                 = useState<GridCell[]>([])
  const [selectedCell, setSelectedCell]   = useState<GridCell | null>(null)
  const [navState, setNavState]           = useState<NavigationState>(DEFAULT_NAV_STATE)
  const [navSheetOpen, setNavSheetOpen]   = useState(false)
  const [flyToLocation, setFlyToLocation] = useState<LatLng | null>(null)
  const [fitRouteBounds, setFitRouteBounds] = useState<LatLng[] | null>(null)
  const [crimeFilter, setCrimeFilter]     = useState<CrimeLayerFilter>(DEFAULT_CRIME_FILTER)
  const [showCctv, setShowCctv]           = useState(true)
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [searchPin, setSearchPin]         = useState<GeocodingResult | null>(null)

  useEffect(() => {
    SafetyDataAdapter.getGridCells().then(setCells)
  }, [])

  // Fit map to route when routes are first calculated
  useEffect(() => {
    const route = navState.selectedRoute
    if (route?.geometry?.length) {
      setFitRouteBounds(route.geometry)
      setTimeout(() => setFitRouteBounds(null), 2500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.routes])

  // ── Derive navigation position + bearing from current step ──────────────────
  const navPosition = useMemo<LatLng | null>(() => {
    if (!navState.isNavigating || !navState.selectedRoute) return null
    const step = navState.selectedRoute.steps[navState.currentStepIndex ?? 0]
    return step?.latlng ?? null
  }, [navState.isNavigating, navState.selectedRoute, navState.currentStepIndex])

  const navBearing = useMemo<number>(() => {
    if (!navState.selectedRoute) return 0
    const steps = navState.selectedRoute.steps
    const idx   = navState.currentStepIndex ?? 0
    const from  = steps[idx]?.latlng
    const to    = steps[idx + 1]?.latlng
    if (!from || !to) return 0
    return getBearing(from, to)
  }, [navState.selectedRoute, navState.currentStepIndex])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleCellClick(cell: GridCell) {
    if (!navSheetOpen && !navState.isNavigating) setSelectedCell(cell)
  }

  function handleLocationSelect(result: GeocodingResult) {
    setSearchPin(result)
    setFlyToLocation(result.latlng)
    setTimeout(() => setFlyToLocation(null), 2000)
  }

  function handleGetDirections(result: GeocodingResult) {
    setSearchPin(null)           // pin not needed once directions are requested
    setSelectedCell(null)
    setNavState(prev => ({ ...prev, destination: result }))
    setNavSheetOpen(true)
  }

  function handleRouteSelect(route: RouteResult) {
    setNavState(prev => ({ ...prev, selectedRoute: route }))
    if (route.geometry?.length) {
      setFitRouteBounds(route.geometry)
      setTimeout(() => setFitRouteBounds(null), 2500)
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab !== 'map') { setSelectedCell(null); setNavSheetOpen(false) }
  }

  function openNavigate() { setSelectedCell(null); setSearchPin(null); setNavSheetOpen(true) }

  function closeNavSheet() {
    setNavSheetOpen(false)
    if (!navState.isNavigating) setNavState(DEFAULT_NAV_STATE)
  }

  const isNavigating  = navState.isNavigating
  const showBottomNav = !isNavigating

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-100">

      {/* Map — tilts via CSS perspective when navigating */}
      <div
        className={isNavigating ? 'map-nav-tilt' : 'map-nav-normal'}
        style={{
          position: 'absolute',
          inset: 0,
          bottom: showBottomNav ? NAV_BAR_H : 0,
        }}
      >
        <SafetyMap
          cells={cells}
          activeLayer={activeLayer}
          selectedCellId={selectedCell?.id ?? null}
          onCellClick={handleCellClick}
          routes={navState.routes}
          selectedRoute={navState.selectedRoute}
          onRouteSelect={handleRouteSelect}
          flyToLocation={flyToLocation}
          fitRouteBounds={fitRouteBounds}
          navPosition={navPosition}
          navBearing={navBearing}
          crimeFilter={crimeFilter}
          showCctv={showCctv}
          selectedCameraId={selectedCamera?.id ?? null}
          onCameraSelect={setSelectedCamera}
          searchPin={searchPin}
        />
      </div>

      {/* Non-map screens slide in over the map.
          Off-screen state uses translateY(calc(100% + 80px)) — the extra 80px
          ensures the container clears the viewport completely. Without it the
          top of the screen (e.g. "Settings" header) peeks at the bottom because
          the container height is screen_height - NAV_BAR_H, so plain 100% only
          moves the top edge to screen_height - NAV_BAR_H, leaving NAV_BAR_H
          pixels visible through main's overflow: hidden boundary. */}
      {(['community', 'profile', 'settings'] as const).map(tab => (
        <div key={tab}
          className="absolute inset-x-0 top-0 z-[999] overflow-hidden transition-transform duration-300 ease-out"
          style={{ bottom: `calc(${NAV_BAR_H}px + env(safe-area-inset-bottom, 0px))`, transform: activeTab === tab ? 'translateY(0)' : 'translateY(calc(100% + 80px))' }}
        >
          {tab === 'community' && <CommunityScreen />}
          {tab === 'profile'   && <ProfileScreen />}
          {tab === 'settings'  && <SettingsScreen />}
        </div>
      ))}

      {/* Map tab UI */}
      {activeTab === 'map' && (
        <>
          {/* Top search bar — hidden during active navigation */}
          {!isNavigating && (
            <TopBar
              onLocationSelect={handleLocationSelect}
              onGetDirections={handleGetDirections}
              onClear={() => setSearchPin(null)}
            />
          )}

          {/* Year range slider — always shown when crime/visual layer active.
              Sits below search bar normally, or below the nav header when navigating. */}
          <YearSliderBar
            activeLayer={activeLayer}
            filter={crimeFilter}
            onChange={setCrimeFilter}
            topOffset={isNavigating ? 90 : 72}
          />

          {/* Layer selector + filter — always accessible.
              • Normal map:   bottom-centre, dropdowns open upward
              • navSheetOpen: top-right (below TopBar), dropdowns open downward
              • isNavigating: top-right (below nav header ~95px), dropdowns open downward */}
          <div
            className={`absolute z-[1000] flex items-center gap-2 transition-all duration-200
              ${navSheetOpen || isNavigating ? 'right-3' : 'left-1/2 -translate-x-1/2'}`}
            style={
              isNavigating  ? { top: 95 } :
              navSheetOpen  ? { top: 72 } :
              { bottom: NAV_BAR_H + 12 }
            }
          >
            <LayerSelector
              activeLayer={activeLayer}
              onChange={setActiveLayer}
              dropUp={!navSheetOpen && !isNavigating}
            />
            <FilterDropdown
              activeLayer={activeLayer}
              filter={crimeFilter}
              onChange={setCrimeFilter}
              dropUp={!navSheetOpen && !isNavigating}
            />
          </div>

          {/* Legend + city indicator + CCTV toggle — bottom left.
              Hidden during navigation and when nav sheet is open. */}
          {!navSheetOpen && !isNavigating && (
            <div
              className="absolute left-3 z-[1000] flex flex-col items-start gap-1.5"
              style={{ bottom: NAV_BAR_H + 12 }}
            >
              <SafetyLegend />
              <div className="flex flex-col items-start gap-1">
                {cells.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow px-2.5 py-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700">New York</span>
                    <span className="text-[11px] text-slate-400">· {cells.length}</span>
                  </div>
                )}
                {/* CCTV layer toggle — compact pill */}
                <button
                  onClick={() => { setShowCctv(v => !v); if (showCctv) setSelectedCamera(null) }}
                  title={showCctv ? 'Hide CCTV cameras' : 'Show CCTV cameras'}
                  className={`flex items-center gap-1.5 rounded-xl shadow px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    showCctv
                      ? 'bg-green-600 text-white'
                      : 'bg-white/90 backdrop-blur-sm text-slate-500 hover:bg-white'
                  }`}
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M3 8h12a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
                  </svg>
                  CCTV
                </button>
              </div>
            </div>
          )}

          {/* SOS + Navigate — right-side action stack */}
          <div
            className="absolute right-3 z-[1001] flex flex-col items-center gap-2.5"
            style={{ bottom: isNavigating ? 12 : NAV_BAR_H + 12 }}
          >
            <SOSButton />
            {!isNavigating && !navSheetOpen && (
              <button
                onClick={openNavigate}
                className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 hover:bg-green-700 active:scale-95 transition-all"
                title="Navigate"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-[9px] font-bold tracking-wide leading-none">GO</span>
              </button>
            )}
          </div>

          {/* Navigation sheet + active nav header */}
          <NavigationPanel
            open={navSheetOpen || isNavigating}
            navState={navState}
            onNavStateChange={setNavState}
            onClose={closeNavSheet}
          />

          {/* Sheet backdrop */}
          {navSheetOpen && !isNavigating && (
            <div className="absolute inset-0 z-[1000] bg-black/10" onClick={closeNavSheet} />
          )}

          {/* Area detail panel */}
          <AreaDetailPanel
            cell={!navSheetOpen && !isNavigating ? selectedCell : null}
            onClose={() => setSelectedCell(null)}
          />

          {/* CCTV live feed panel — shown when a camera marker is clicked */}
          <CctvPanel
            camera={selectedCamera}
            onClose={() => setSelectedCamera(null)}
          />
        </>
      )}

      {/* Bottom navigation bar */}
      {showBottomNav && <BottomNav activeTab={activeTab} onChange={handleTabChange} />}

    </main>
  )
}
