'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import { getShootings, ShootingPoint } from '@/lib/shootings'
import { CrimeLayerFilter } from '@/lib/types'

interface Props {
  visible: boolean
  filter:  CrimeLayerFilter
}

export default function ShootingLayer({ visible, filter }: Props) {
  const [points, setPoints] = useState<ShootingPoint[]>([])

  useEffect(() => {
    if (!visible) return
    getShootings().then(setPoints)
  }, [visible])

  const shown = points.filter(p => {
    if (!p.date) return true
    const year = new Date(p.date).getFullYear()
    return year >= filter.yearMin && year <= filter.yearMax
  })

  if (!visible || !shown.length) return null

  return (
    <>
      {shown.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.6, weight: 0 }}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
            <div className="text-xs whitespace-nowrap">
              <p className="font-semibold text-red-700">Shooting Incident</p>
              <p className="text-slate-500">{p.date ? new Date(p.date).toLocaleDateString() : 'Date unknown'}</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}
