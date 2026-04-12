/**
 * cctv.ts — 511NY traffic camera integration for AssureWay.
 *
 * Camera data is fetched via the internal /api/cameras route (which proxies
 * 511NY server-side to avoid CORS restrictions). Each camera has a real live
 * HLS (.m3u8) stream playable in the browser via hls.js.
 */

export interface Camera {
  id:           string
  name:         string
  intersection: string
  borough:      string
  lat:          number
  lng:          number
  /** Live HLS .m3u8 stream URL */
  videoUrl?:    string
  /** 511NY camera page URL */
  pageUrl?:     string
}

// ── Module-level cache ───────────────────────────────────────────────────────
let _liveCache: Camera[] | null = null
let _liveFetchedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Fetch cameras from the internal proxy route (/api/cameras).
 * Returns null on error; uses a 5-minute in-memory cache.
 */
export async function fetchLiveCameras(): Promise<Camera[] | null> {
  const now = Date.now()
  if (_liveCache && now - _liveFetchedAt < CACHE_TTL_MS) return _liveCache

  try {
    const res = await fetch('/api/cameras')
    if (!res.ok) throw new Error(`/api/cameras responded ${res.status}`)

    const cameras: Camera[] = await res.json()
    console.log(`[AssureWay] Loaded ${cameras.length} live cameras`)
    _liveCache     = cameras
    _liveFetchedAt = now
    return cameras
  } catch (err) {
    console.warn('[AssureWay] Camera fetch failed:', err)
    return null
  }
}

/** Whether a camera has a real live HLS stream. */
export function isLiveCamera(camera: Camera): boolean {
  return !!camera.videoUrl
}
