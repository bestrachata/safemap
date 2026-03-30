/**
 * NYC traffic camera data + 511NY live feed integration.
 *
 * ── How to enable real live feeds ──────────────────────────────────────────
 * 1. Register for a FREE developer key at https://511ny.org/developers
 * 2. Create (or open) `.env.local` in the project root and add:
 *       NEXT_PUBLIC_511NY_API_KEY=your_key_here
 * 3. Restart the dev server — real camera locations and live JPEG feeds
 *    will load automatically.  The picsum fallback is used only when the
 *    key is absent or the API is unreachable.
 * ───────────────────────────────────────────────────────────────────────────
 */

export interface Camera {
  id:           string
  name:         string
  intersection: string
  borough:      string
  lat:          number
  lng:          number
  /** Direct URL to the live JPEG snapshot (from 511NY). Absent on mock cameras. */
  liveUrl?:     string
}

// ── 511NY raw response shape ────────────────────────────────────────────────
interface Raw511Camera {
  Id:                string
  Name:              string
  DirectionOfTravel: string
  RoadwayName:       string
  Latitude:          number
  Longitude:         number
  Url:               string   // still-image URL
  VideoUrl:          string
}

// ── Module-level cache ──────────────────────────────────────────────────────
let _liveCache: Camera[] | null = null
let _liveFetchedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000   // refresh camera list every 5 min

/**
 * Fetch real cameras from 511NY when NEXT_PUBLIC_511NY_API_KEY is set.
 * Returns null if no key is configured or the request fails.
 */
export async function fetchLiveCameras(): Promise<Camera[] | null> {
  const key = process.env.NEXT_PUBLIC_511NY_API_KEY
  if (!key) return null

  const now = Date.now()
  if (_liveCache && now - _liveFetchedAt < CACHE_TTL_MS) return _liveCache

  try {
    const res = await fetch(
      `https://511ny.org/api/getcameras?key=${key}&format=json`,
      { next: { revalidate: 300 } }   // Next.js cache hint
    )
    if (!res.ok) throw new Error(`511NY responded ${res.status}`)

    const raw: Raw511Camera[] = await res.json()

    // Filter to Manhattan bounding box and keep only cameras with image URLs
    const cameras: Camera[] = raw
      .filter(c =>
        c.Latitude  >= 40.700 && c.Latitude  <= 40.880 &&
        c.Longitude >= -74.020 && c.Longitude <= -73.910 &&
        c.Url
      )
      .map(c => ({
        id:           c.Id,
        name:         c.RoadwayName || c.Name || 'Traffic Camera',
        intersection: [c.DirectionOfTravel, c.RoadwayName].filter(Boolean).join(' — '),
        borough:      'Manhattan',
        lat:          c.Latitude,
        lng:          c.Longitude,
        liveUrl:      c.Url,
      }))

    console.log(`[cctv] loaded ${cameras.length} live cameras from 511NY`)
    _liveCache     = cameras
    _liveFetchedAt = now
    return cameras
  } catch (err) {
    console.warn('[cctv] 511NY fetch failed:', err)
    return null
  }
}

/**
 * Returns the image URL for a camera snapshot.
 *
 * • If the camera has a real liveUrl (from 511NY), returns it with a
 *   timestamp cache-buster so each refresh actually re-fetches the image.
 * • Otherwise falls back to a stable grayscale picsum photo (demo mode).
 *   refreshIndex cycles through 5 variants so the "feed" appears to update.
 */
export function cameraSnapshotUrl(camera: Camera, refreshIndex = 0): string {
  if (camera.liveUrl) {
    return `${camera.liveUrl}?t=${Date.now()}`
  }
  // Demo fallback — grayscale stock photo, stable seed per camera
  const suffix = refreshIndex > 0 ? `_${refreshIndex % 5}` : ''
  return `https://picsum.photos/seed/nyc${camera.id}${suffix}/640/480?grayscale`
}

/** Whether a camera is showing a real live feed vs. the demo fallback. */
export function isLiveCamera(camera: Camera): boolean {
  return !!camera.liveUrl
}

// ── Static fallback cameras (used when no 511NY key is configured) ──────────
export const NYC_CAMERAS: Camera[] = [
  { id: '10013', name: 'Times Square',        intersection: '7th Ave & W 42nd St',      borough: 'Manhattan', lat: 40.7580, lng: -73.9855 },
  { id: '10025', name: 'Grand Central',        intersection: 'Park Ave & E 42nd St',      borough: 'Manhattan', lat: 40.7527, lng: -73.9772 },
  { id: '10034', name: 'Herald Square',        intersection: 'Broadway & W 34th St',      borough: 'Manhattan', lat: 40.7497, lng: -73.9878 },
  { id: '10048', name: 'Union Square',         intersection: '14th St & Broadway',        borough: 'Manhattan', lat: 40.7359, lng: -73.9906 },
  { id: '10061', name: 'Columbus Circle',      intersection: 'Broadway & W 59th St',      borough: 'Manhattan', lat: 40.7681, lng: -73.9819 },
  { id: '10072', name: 'Washington Square',    intersection: '5th Ave & Washington Sq N', borough: 'Manhattan', lat: 40.7308, lng: -73.9973 },
  { id: '10082', name: 'Rockefeller Center',   intersection: '5th Ave & W 50th St',       borough: 'Manhattan', lat: 40.7587, lng: -73.9787 },
  { id: '10091', name: 'Bryant Park',          intersection: '6th Ave & W 42nd St',       borough: 'Manhattan', lat: 40.7536, lng: -73.9832 },
  { id: '10105', name: 'Flatiron District',    intersection: '5th Ave & W 23rd St',       borough: 'Manhattan', lat: 40.7411, lng: -73.9897 },
  { id: '10114', name: 'Chelsea',              intersection: '8th Ave & W 23rd St',       borough: 'Manhattan', lat: 40.7461, lng: -74.0016 },
  { id: '10127', name: 'Midtown East',         intersection: 'Lexington Ave & E 53rd St', borough: 'Manhattan', lat: 40.7578, lng: -73.9714 },
  { id: '10136', name: 'East Village',         intersection: 'Ave A & E 10th St',         borough: 'Manhattan', lat: 40.7265, lng: -73.9800 },
  { id: '10145', name: 'SoHo',                 intersection: 'Spring St & Broadway',      borough: 'Manhattan', lat: 40.7228, lng: -74.0010 },
  { id: '10158', name: 'Financial District',   intersection: 'Broadway & Wall St',        borough: 'Manhattan', lat: 40.7074, lng: -74.0113 },
  { id: '10167', name: 'Upper East Side',      intersection: 'Park Ave & E 86th St',      borough: 'Manhattan', lat: 40.7796, lng: -73.9587 },
  { id: '10174', name: 'Upper West Side',      intersection: 'Broadway & W 79th St',      borough: 'Manhattan', lat: 40.7835, lng: -73.9802 },
  { id: '10183', name: 'Harlem',               intersection: '125th St & Lenox Ave',      borough: 'Manhattan', lat: 40.8079, lng: -73.9459 },
  { id: '10192', name: "Hell's Kitchen",        intersection: '9th Ave & W 46th St',       borough: 'Manhattan', lat: 40.7622, lng: -73.9911 },
  { id: '10201', name: 'Tribeca',              intersection: 'Hudson St & Franklin St',   borough: 'Manhattan', lat: 40.7163, lng: -74.0086 },
  { id: '10215', name: 'Chinatown',            intersection: 'Canal St & Mott St',        borough: 'Manhattan', lat: 40.7158, lng: -73.9993 },
  { id: '10224', name: 'Lower East Side',      intersection: 'Delancey St & Bowery',      borough: 'Manhattan', lat: 40.7185, lng: -73.9966 },
  { id: '10233', name: 'Kips Bay',             intersection: '2nd Ave & E 34th St',       borough: 'Manhattan', lat: 40.7451, lng: -73.9775 },
  { id: '10242', name: 'Murray Hill',          intersection: 'Park Ave & E 34th St',      borough: 'Manhattan', lat: 40.7481, lng: -73.9794 },
  { id: '10256', name: 'Morningside Heights',  intersection: 'Broadway & W 110th St',     borough: 'Manhattan', lat: 40.8006, lng: -73.9660 },
  { id: '10265', name: 'Inwood',               intersection: 'Broadway & W 207th St',     borough: 'Manhattan', lat: 40.8676, lng: -73.9182 },
]
