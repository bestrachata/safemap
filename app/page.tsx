'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo } from 'react'
import { GridCell, HeatmapLayer, NavigationState, RouteResult, GeocodingResult, LatLng, CrimeLayerFilter, DEFAULT_CRIME_FILTER, MapStyle } from '@/lib/types'
import { SafetyDataAdapter } from '@/lib/adapters/safety-data'
import { getBearing } from '@/lib/geoUtils'
import TopBar from '@/components/ui/TopBar'
import LayerSelector from '@/components/ui/LayerSelector'
import SafetyLegend from '@/components/ui/SafetyLegend'
import SOSButton from '@/components/ui/SOSButton'
import YearSliderBar from '@/components/ui/YearSliderBar'
import FilterDropdown from '@/components/ui/FilterDropdown'
import MapStylePicker from '@/components/ui/MapStylePicker'
import FriendsPanel from '@/components/ui/FriendsPanel'
import FriendQuickPanel from '@/components/ui/FriendQuickPanel'
import NotificationPanel from '@/components/ui/NotificationPanel'
import { MOCK_FRIENDS, Friend } from '@/lib/friendData'
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
        <p className="text-sm text-slate-500 font-medium">Loading map…</p>
      </div>
    </div>
  ),
})

const DEFAULT_NAV_STATE: NavigationState = {
  origin: null, destination: null,
  routes: [], selectedRoute: null,
  isNavigating: false, currentStepIndex: 0,
}

const NAV_BAR_H   = 64   // px — keep in sync with BottomNav h-16
const PILLS_H     = 44   // px — layer pills row height

// Use CSS calc() so the header never blocks the pills on notched phones.
// Single-row TopBar: env(safe-area-inset-top) + mt-3(12) + h-12(48) + 8px gap = +68px
const PILLS_TOP   = 'calc(env(safe-area-inset-top, 0px) + 68px)'
// SLIDER_TOP clears up to 2 pill rows (narrow screens stack pills + dropdowns):
// 68 (header) + 44 (pills) + 44 (dropdown row) + 8 (gap) = 164px
const SLIDER_TOP  = 'calc(env(safe-area-inset-top, 0px) + 164px)'

export default function HomePage() {
  const [activeTab, setActiveTab]       = useState<Tab>('map')
  const [activeLayer, setActiveLayer]   = useState<HeatmapLayer>('composite')
  const [cells, setCells]               = useState<GridCell[]>([])
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null)
  const [navState, setNavState]         = useState<NavigationState>(DEFAULT_NAV_STATE)
  const [navSheetOpen, setNavSheetOpen] = useState(false)
  const [flyToLocation, setFlyToLocation] = useState<LatLng | null>(null)
  const [fitRouteBounds, setFitRouteBounds] = useState<LatLng[] | null>(null)
  const [crimeFilter, setCrimeFilter]   = useState<CrimeLayerFilter>(DEFAULT_CRIME_FILTER)
  const [mapStyle, setMapStyle]         = useState<MapStyle>('color')
  const [searchPin, setSearchPin]       = useState<GeocodingResult | null>(null)
  const [friendsPanelOpen, setFriendsPanelOpen]       = useState(false)
  const [selectedFriend, setSelectedFriend]           = useState<Friend | null>(null)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [ghostMode, setGhostMode]                     = useState(false)

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

  // ── Derive navigation position + bearing from current step ─────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleCellClick(cell: GridCell) {
    if (!navSheetOpen && !navState.isNavigating) setSelectedCell(cell)
  }

  function handleLocationSelect(result: GeocodingResult) {
    setSearchPin(result)
    setFlyToLocation(result.latlng)
    setTimeout(() => setFlyToLocation(null), 2000)
  }

  function handleGetDirections(result: GeocodingResult) {
    setSearchPin(null)
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

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div
        className={isNavigating ? 'map-nav-tilt' : 'map-nav-normal'}
        style={{ position: 'absolute', inset: 0, bottom: showBottomNav ? NAV_BAR_H : 0 }}
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
          mapStyle={mapStyle}
          searchPin={searchPin}
          friends={MOCK_FRIENDS}
          ghostMode={ghostMode}
          onFriendClick={f => setSelectedFriend(f)}
        />
      </div>

      {/* ── Non-map screens slide over the map ────────────────────────────── */}
      {(['community', 'profile', 'settings'] as const).map(tab => (
        <div key={tab}
          className="absolute inset-x-0 top-0 z-[999] overflow-hidden transition-transform duration-300 ease-out"
          style={{
            bottom: `calc(${NAV_BAR_H}px + env(safe-area-inset-bottom, 0px))`,
            transform: activeTab === tab ? 'translateY(0)' : 'translateY(calc(100% + 80px))',
          }}
        >
          {tab === 'community' && <CommunityScreen />}
          {tab === 'profile'   && <ProfileScreen onClose={() => handleTabChange('map')} />}
          {tab === 'settings'  && <SettingsScreen />}
        </div>
      ))}

      {/* ── Map tab UI ─────────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <>
          {/* TopBar — hidden during active navigation */}
          {!isNavigating && (
            <TopBar
              onLocationSelect={handleLocationSelect}
              onGetDirections={handleGetDirections}
              onClear={() => setSearchPin(null)}
              onProfileClick={() => handleTabChange('profile')}
              onFriendsClick={() => setFriendsPanelOpen(true)}
              onNotificationClick={() => setNotificationPanelOpen(v => !v)}
            />
          )}

          {/* ── Layer pills row + dropdowns ───────────────────────────────────
              Below 380 px the bar stacks vertically: pills on row 1 (full
              width, scrollable) and the two icon buttons on row 2.
              Above 380 px everything stays on one horizontal row.          */}
          <div
            className="absolute z-[1000] left-3 right-3 flex flex-col min-[380px]:flex-row min-[380px]:items-center gap-1.5 transition-all duration-200"
            style={{ top: isNavigating ? 'calc(env(safe-area-inset-top, 0px) + 95px)' : PILLS_TOP }}
          >
            {/* Pills — full-width on narrow, flex-1 on wide */}
            <div className="w-full min-[380px]:flex-1 min-[380px]:min-w-0 overflow-x-auto no-scrollbar">
              <LayerSelector activeLayer={activeLayer} onChange={setActiveLayer} />
            </div>

            {/* Dropdowns — row 2 on narrow (self-end keeps them right-aligned),
                inline sibling on wide                                       */}
            <div className="flex items-center gap-1.5 flex-shrink-0 self-end min-[380px]:self-auto">
              <FilterDropdown
                activeLayer={activeLayer}
                filter={crimeFilter}
                onChange={setCrimeFilter}
                dropUp={false}
              />
              <MapStylePicker
                value={mapStyle}
                onChange={setMapStyle}
                dropUp={false}
              />
            </div>
          </div>

          {/* Year range slider — shown below pills when crime/visual layer active */}
          <YearSliderBar
            activeLayer={activeLayer}
            filter={crimeFilter}
            onChange={setCrimeFilter}
            topOffset={isNavigating ? 'calc(env(safe-area-inset-top, 0px) + 138px)' : SLIDER_TOP}
          />

          {/* ── Legend + city indicator — bottom left ────────────────────────
              Hidden during active navigation and when nav sheet is open       */}
          {!navSheetOpen && !isNavigating && (
            <div
              className="fixed left-3 z-[1003] flex flex-col items-start gap-1.5"
              style={{ bottom: `calc(${NAV_BAR_H}px + env(safe-area-inset-bottom, 0px) + 12px)` }}
            >
              <SafetyLegend />
              {cells.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow px-2.5 py-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-700">New York</span>
                  <span className="text-[11px] text-slate-400">· {cells.length} zones</span>
                </div>
              )}
            </div>
          )}

          {/* ── SOS + Navigate FAB — bottom right ───────────────────────────── */}
          <div
            className="fixed right-3 z-[1004] flex flex-col items-center gap-2.5"
            style={{ bottom: isNavigating
              ? `calc(env(safe-area-inset-bottom, 0px) + 12px)`
              : `calc(${NAV_BAR_H}px + env(safe-area-inset-bottom, 0px) + 12px)` }}
          >
            <SOSButton />
            {!isNavigating && !navSheetOpen && (
              <button
                onClick={openNavigate}
                className="w-14 h-14 bg-green-600 text-white rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 hover:bg-green-700 active:scale-95 transition-all"
                title="Navigate"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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

          {/* Sheet backdrop — only while the user is still entering locations
              (no routes yet). Once a route is displayed the backdrop is removed
              so the user can freely drag/zoom the map preview. */}
          {navSheetOpen && !isNavigating && navState.routes.length === 0 && (
            <div className="absolute inset-0 z-[1000] bg-black/10" onClick={closeNavSheet} />
          )}

          {/* Area detail panel */}
          <AreaDetailPanel
            cell={!navSheetOpen && !isNavigating ? selectedCell : null}
            onClose={() => setSelectedCell(null)}
          />

          {/* Notification panel — drops down below the TopBar */}
          {!isNavigating && (
            <NotificationPanel
              open={notificationPanelOpen}
              onClose={() => setNotificationPanelOpen(false)}
              topOffset={72}
            />
          )}

          {/* Friends panel — full list */}
          <FriendsPanel
            open={friendsPanelOpen}
            friends={MOCK_FRIENDS}
            ghostMode={ghostMode}
            onGhostModeChange={setGhostMode}
            onClose={() => setFriendsPanelOpen(false)}
          />

          {/* Friend quick-card — shown when tapping a friend marker */}
          {selectedFriend && (
            <FriendQuickPanel
              friend={selectedFriend}
              onClose={() => setSelectedFriend(null)}
            />
          )}
        </>
      )}

      {/* Bottom navigation bar */}
      {showBottomNav && <BottomNav activeTab={activeTab} onChange={handleTabChange} />}
    </main>
  )
}
