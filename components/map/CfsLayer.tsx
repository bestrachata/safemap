'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import { getCallsForService, CfsRecord } from '@/lib/callsForService'
import { CrimeLayerFilter } from '@/lib/types'

interface Props {
  visible: boolean
  filter:  CrimeLayerFilter
}

const SEVERITY_COLOR: Record<number, string> = {
  1: '#F59E0B',  // amber  — quality of life
  2: '#F97316',  // orange — disturbance / disorder
  3: '#EF4444',  // red    — serious crime
}

const SEVERITY_LABEL: Record<number, string> = {
  1: 'Quality of Life',
  2: 'Disturbance',
  3: 'Serious Incident',
}

export default function CfsLayer({ visible, filter }: Props) {
  const [records, setRecords] = useState<CfsRecord[]>([])

  useEffect(() => {
    if (!visible) return
    getCallsForService().then(setRecords)
  }, [visible])

  const shown = records.filter(r => {
    // Year filter
    if (r.date) {
      const year = new Date(r.date).getFullYear()
      if (year < filter.yearMin || year > filter.yearMax) return false
    }
    // Severity visibility toggles
    if (r.severity === 3 && !filter.showCfsSevere)   return false
    if (r.severity === 2 && !filter.showCfsDisorder) return false
    if (r.severity === 1 && !filter.showCfsQol)      return false
    return true
  })

  if (!visible || !shown.length) return null

  return (
    <>
      {shown.map((r, i) => {
        const color = SEVERITY_COLOR[r.severity] ?? '#F59E0B'
        return (
          <CircleMarker
            key={i}
            center={[r.lat, r.lng]}
            radius={2 + r.severity}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 0 }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
              <div className="text-xs">
                <p className="font-semibold whitespace-nowrap" style={{ color }}>
                  {r.typeDesc}
                </p>
                <p className="text-slate-500 whitespace-nowrap mt-0.5">
                  {SEVERITY_LABEL[r.severity]} ·{' '}
                  {r.date ? new Date(r.date).toLocaleDateString() : 'Date unknown'}
                </p>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}
