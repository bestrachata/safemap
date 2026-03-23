'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { GridCell, HeatmapLayer, NavigationState, RouteResult, GeocodingResult, LatLng } from '@/lib/types'
import { SafetyDataAdapter } from '@/lib/adapters/safety-data'
import TopBar from '@/components/ui/TopBar'
import LayerSelector from '@/components/ui/LayerSelector'
import SafetyLegend from '@/components/ui/SafetyLegend'
import BottomNav, { Tab } from '@/components/ui/BottomNav'
import AreaDetailPanel from '@/components/panels/AreaDetailPanel'
import NavigationPanel from '@/components/panels/NavigationPanel'
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
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [activeLayer, setActiveLayer] = useState<HeatmapLayer>('composite')
  const [cells, setCells] = useState<GridCell[]>([])
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null)
  const [navState, setNavState] = useState<NavigationState>(DEFAULT_NAV_STATE)
  const [navSheetOpen, setNavSheetOpen] = useState(false)
  const [flyToLocation, setFlyToLocation] = useState<LatLng | null>(null)
  const [fitRouteBounds, setFitRouteBounds] = useState<LatLng[] | null>(null)

  useEffect(() => {
    SafetyDataAdapter.getGridCells().then(setCells)
  }, [])

  // Fit map to route whenever routes are first calculated
  useEffect(() => {
    const route = navState.selectedRoute
    if (route?.geometry?.length) {
      setFitRouteBounds(route.geometry)
      setTimeout(() => setFitRouteBounds(null), 2500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState.routes])

  function handleCellClick(cell: GridCell) {
    if (!navSheetOpen && !navState.isNavigating) setSelectedCell(cell)
  }

  function handleLocationSelect(result: GeocodingResult) {
    setFlyToLocation(result.latlng)
    setTimeout(() => setFlyToLocation(null), 2000)
  }

  // Called when user taps "Directions" on a search suggestion — opens the nav
  // panel with the chosen place pre-filled as the destination.
  function handleGetDirections(result: GeocodingResult) {
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

  function openNavigate() {
    setSelectedCell(null)
    setNavSheetOpen(true)
  }

  function closeNavSheet() {
    setNavSheetOpen(false)
    if (!navState.isNavigating) setNavState(DEFAULT_NAV_STATE)
  }

  const isNavigating = navState.isNavigating
  const showBottomNav = !isNavigating

  return (
    <main className="w-screen h-screen relative overflow-hidden bg-slate-100">

      {/* Map always rendered under everything */}
      <div className="absolute inset-0" style={{ bottom: showBottomNav ? NAV_BAR_H : 0 }}>
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
        />
      </div>

      {/* Non-map screens slide in over the map */}
      {(['community', 'profile', 'settings'] as const).map(tab => (
        <div key={tab}
          className="absolute inset-x-0 top-0 z-[999] overflow-hidden transition-transform duration-300 ease-out"
          style={{ bottom: NAV_BAR_H, transform: activeTab === tab ? 'translateY(0)' : 'translateY(100%)' }}
        >
          {tab === 'community' && <CommunityScreen />}
          {tab === 'profile'   && <ProfileScreen />}
          {tab === 'settings'  && <SettingsScreen />}
        </div>
      ))}

      {/* Map tab UI — only visible on the map tab */}
      {activeTab === 'map' && (
        <>
          {/* Top search bar — hidden during active navigation */}
          {!isNavigating && (
            <TopBar
              onLocationSelect={handleLocationSelect}
              onGetDirections={handleGetDirections}
            />
          )}

          {/* Bottom map controls — float above the nav bar */}
          {!isNavigating && !navSheetOpen && (
            <>
              <div className="absolute left-1/2 -translate-x-1/2 z-[1000]" style={{ bottom: NAV_BAR_H + 12 }}>
                <LayerSelector activeLayer={activeLayer} onChange={setActiveLayer} />
              </div>
              <div className="absolute right-3 z-[1000]" style={{ bottom: NAV_BAR_H + 12 }}>
                <SafetyLegend />
              </div>
              {cells.length > 0 && (
                <div className="absolute left-3 z-[1000]" style={{ bottom: NAV_BAR_H + 12 }}>
                  <div className="bg-white rounded-xl shadow px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-slate-600">New York</span>
                    <span className="text-xs text-slate-400">· {cells.length} zones</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigate FAB */}
          {!isNavigating && !navSheetOpen && (
            <button
              onClick={openNavigate}
              className="absolute right-3 z-[1000] w-12 h-12 bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all"
              style={{ bottom: NAV_BAR_H + 72 }}
              title="Navigate"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          )}

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
        </>
      )}

      {/* Bottom navigation bar */}
      {showBottomNav && <BottomNav activeTab={activeTab} onChange={handleTabChange} />}

    </main>
  )
}
