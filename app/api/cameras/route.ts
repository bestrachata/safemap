/**
 * GET /api/cameras
 *
 * Server-side proxy for the 511NY camera list.
 * The 511NY API has no CORS headers, so we fetch it here (server → server)
 * and return only the fields the client needs.
 */

import { NextResponse } from 'next/server'

interface Raw511Camera {
  ID:                string
  Name:              string
  DirectionOfTravel: string
  RoadwayName:       string
  Latitude:          number
  Longitude:         number
  Url:               string
  VideoUrl:          string | null
  Disabled:          boolean
  Blocked:           boolean
}

// NYC bounding box (all 5 boroughs + surrounding highways)
const NYC = { latMin: 40.490, latMax: 40.920, lngMin: -74.260, lngMax: -73.700 }

export async function GET() {
  const key =
    process.env.NEXT_PUBLIC_511NY_API_KEY ||
    '7ff124715b50478f8a2469266b5b1420'

  try {
    const res = await fetch(
      `https://511ny.org/api/getcameras?key=${key}&format=json`,
      { next: { revalidate: 300 } }   // cache for 5 min at the edge
    )
    if (!res.ok) throw new Error(`511NY responded ${res.status}`)

    const raw: Raw511Camera[] = await res.json()

    const cameras = raw
      .filter(c =>
        !c.Disabled &&
        !c.Blocked &&
        c.VideoUrl &&
        c.Latitude  >= NYC.latMin && c.Latitude  <= NYC.latMax &&
        c.Longitude >= NYC.lngMin && c.Longitude <= NYC.lngMax
      )
      .map(c => ({
        id:           c.ID,
        name:         c.Name || c.RoadwayName || 'Traffic Camera',
        intersection: [c.DirectionOfTravel, c.RoadwayName].filter(Boolean).join(' — '),
        borough:      'NYC',
        lat:          c.Latitude,
        lng:          c.Longitude,
        videoUrl:     c.VideoUrl!,
        pageUrl:      c.Url,
      }))

    return NextResponse.json(cameras)
  } catch (err) {
    console.error('[/api/cameras]', err)
    return NextResponse.json({ error: 'Failed to fetch cameras' }, { status: 502 })
  }
}
