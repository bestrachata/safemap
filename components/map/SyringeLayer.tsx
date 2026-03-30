'use client'

import { useEffect, useState } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import { getSyringeData, SyringeRecord } from '@/lib/syringes'
import { CrimeLayerFilter } from '@/lib/types'

interface Props {
  visible: boolean
  filter:  CrimeLayerFilter
}

const PRECINCT_CENTROIDS: Record<string, [number, number]> = {
  '1':  [40.7128, -74.0059], '5':  [40.7142, -73.9999],
  '6':  [40.7334, -74.0027], '7':  [40.7154, -73.9835],
  '9':  [40.7269, -73.9800], '10': [40.7455, -74.0019],
  '13': [40.7384, -73.9850], '14': [40.7467, -73.9913],
  '17': [40.7560, -73.9675], '18': [40.7636, -73.9876],
  '19': [40.7704, -73.9580], '20': [40.7844, -73.9785],
  '22': [40.7851, -73.9683], '23': [40.7959, -73.9395],
  '24': [40.7900, -73.9713], '25': [40.8050, -73.9349],
  '26': [40.8087, -73.9647], '28': [40.8158, -73.9543],
  '30': [40.8231, -73.9492], '32': [40.8261, -73.9420],
  '33': [40.8393, -73.9396], '34': [40.8676, -73.9242],
}

export default function SyringeLayer({ visible, filter }: Props) {
  const [records, setRecords] = useState<SyringeRecord[]>([])

  useEffect(() => {
    if (!visible) return
    getSyringeData().then(setRecords)
  }, [visible])

  const shown = records.filter(r => {
    if (!PRECINCT_CENTROIDS[r.precinct]) return false
    if (r.date) {
      const year = new Date(r.date).getFullYear()
      if (year < filter.yearMin || year > filter.yearMax) return false
    }
    return true
  })

  if (!visible || !shown.length) return null

  return (
    <>
      {shown.map((r, i) => {
        const base = PRECINCT_CENTROIDS[r.precinct]
        // Small jitter so stacked precinct-centroid points don't fully overlap
        const jitter = () => (Math.random() - 0.5) * 0.004
        const pos: [number, number] = [base[0] + jitter(), base[1] + jitter()]
        return (
          <CircleMarker
            key={i}
            center={pos}
            radius={Math.min(3 + r.total * 0.2, 8)}
            pathOptions={{ color: '#7C3AED', fillColor: '#7C3AED', fillOpacity: 0.5, weight: 0 }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
              <div className="text-xs">
                <p className="font-semibold text-purple-700 whitespace-nowrap">Syringe Collection</p>
                <p className="text-slate-600 whitespace-nowrap">{r.location}</p>
                <p className="text-slate-500 whitespace-nowrap">
                  {r.total} syringe{r.total !== 1 ? 's' : ''} ·{' '}
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
