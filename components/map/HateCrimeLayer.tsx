'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import { getHateCrimes, HateCrimeRecord, hateCrimesToPoints } from '@/lib/hateCrimes'
import { LatLng, CrimeLayerFilter } from '@/lib/types'

interface Props {
  visible: boolean
  filter:  CrimeLayerFilter
}

export default function HateCrimeLayer({ visible, filter }: Props) {
  const [records, setRecords] = useState<HateCrimeRecord[]>([])
  const [points, setPoints]   = useState<LatLng[]>([])

  useEffect(() => {
    if (!visible) return
    getHateCrimes().then(data => {
      setRecords(data)
      setPoints(hateCrimesToPoints(data))
    })
  }, [visible])

  // Pair record + point, then apply year filter
  const shown = records
    .map((r, i) => ({ r, p: points[i] }))
    .filter(({ r, p }) => {
      if (!p) return false
      if (!r.date) return true
      const year = new Date(r.date).getFullYear()
      return year >= filter.yearMin && year <= filter.yearMax
    })

  if (!visible || !shown.length) return null

  return (
    <>
      {shown.map(({ r, p }, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: '#D97706', fillColor: '#EA580C', fillOpacity: 0.6, weight: 0 }}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
            <div className="text-xs">
              <p className="font-semibold text-orange-700 whitespace-nowrap">Hate Crime Incident</p>
              <p className="text-slate-600 whitespace-nowrap">{r.category}</p>
              <p className="text-slate-500 whitespace-nowrap">{r.bias}</p>
              <p className="text-slate-400 whitespace-nowrap">
                {r.date ? new Date(r.date).toLocaleDateString() : ''}
              </p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}
