/**
 * cctv.ts — 511NY traffic camera integration for AssureWay.
 *
 * Fetches real DOT cameras across NYC. Each camera that has a VideoUrl
 * provides a live HLS (.m3u8) stream playable via hls.js.
 *
 * API key can be set via NEXT_PUBLIC_511NY_API_KEY env var.
 * The key is also embedded here as a fallback so the feature works
 * out-of-the-box during development.
 */

export interface Camera {
  id:           string
  name:         string
  intersection: string
  borough:      string
  lat:          number
  lng:          number
  /** Live HLS .m3u8 stream URL — present when 511NY provides one */
  videoUrl?:    string
  /** 511NY camera page URL (used as fallback label link) */
  pageUrl?:     string
}

// ── 511NY raw response shape (actual field names from the API) ───────────────
interface Raw511Camera {
  ID:                string
  Name:              string
  DirectionOfTravel: string
  RoadwayName:       string
  Latitude:          number
  Longitude:         number
  Url:               string        // 511ny.org map page
  VideoUrl:          string | null // HLS .m3u8 live stream
  Disabled:          boolean
  Blocked:           boolean
}

// ── Module-level cache ───────────────────────────────────────────────────────
let _liveCache: Camera[] | null = null
let _liveFetchedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000   // refresh list every 5 min

// NYC bounding box (all 5 boroughs + surrounding highways)
const NYC_BOUNDS = {
  latMin: 40.490, latMax: 40.920,
  lngMin: -74.260, lngMax: -73.700,
}

/**
 * Fetch real cameras from 511NY.
 * Returns null if the request fails; returns cached data within TTL.
 */
export async function fetchLiveCameras(): Promise<Camera[] | null> {
  const key =
    process.env.NEXT_PUBLIC_511NY_API_KEY ||
    '7ff124715b50478f8a2469266b5b1420'

  const now = Date.now()
  if (_liveCache && now - _liveFetchedAt < CACHE_TTL_MS) return _liveCache

  try {
    const res = await fetch(
      `https://511ny.org/api/getcameras?key=${key}&format=json`,
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error(`511NY responded ${res.status}`)

    const raw: Raw511Camera[] = await res.json()

    const cameras: Camera[] = raw
      .filter(c =>
        !c.Disabled &&
        !c.Blocked &&
        c.VideoUrl &&
        c.Latitude  >= NYC_BOUNDS.latMin && c.Latitude  <= NYC_BOUNDS.latMax &&
        c.Longitude >= NYC_BOUNDS.lngMin && c.Longitude <= NYC_BOUNDS.lngMax
      )
      .map(c => ({
        id:           c.ID,
        name:         c.Name || c.RoadwayName || 'Traffic Camera',
        intersection: [c.DirectionOfTravel, c.RoadwayName]
                        .filter(Boolean).join(' — '),
        borough:      'NYC',
        lat:          c.Latitude,
        lng:          c.Longitude,
        videoUrl:     c.VideoUrl!,
        pageUrl:      c.Url,
      }))

    console.log(`[AssureWay] Loaded ${cameras.length} live cameras from 511NY`)
    _liveCache     = cameras
    _liveFetchedAt = now
    return cameras
  } catch (err) {
    console.warn('[AssureWay] 511NY camera fetch failed:', err)
    return null
  }
}

/** Whether a camera has a real live HLS stream. */
export function isLiveCamera(camera: Camera): boolean {
  return !!camera.videoUrl
}
