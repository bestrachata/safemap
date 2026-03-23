'use client'

import { Polygon, Rectangle, Tooltip } from 'react-leaflet'
import { GridCell, HeatmapLayer } from '@/lib/types'
import { getLayerScore, scoreToColor } from '@/lib/safetyScore'

interface Props {
  cells: GridCell[]
  activeLayer: HeatmapLayer
  selectedCellId: string | null
  onCellClick: (cell: GridCell) => void
}

export default function GridOverlay({ cells, activeLayer, selectedCellId, onCellClick }: Props) {
  return (
    <>
      {cells.map(cell => {
        const score = getLayerScore(cell, activeLayer)
        const color = scoreToColor(score)
        const isSelected = cell.id === selectedCellId

        const pathOptions = {
          color: isSelected ? '#16A34A' : color,
          weight: isSelected ? 2.5 : 1,
          fillColor: color,
          fillOpacity: isSelected ? 0.55 : 0.40,
          opacity: isSelected ? 1 : 0.65,
        }

        const tooltip = (
          <Tooltip sticky direction="top" offset={[0, -4]}>
            <div className="text-xs font-medium">
              <div className="font-semibold">{cell.name}</div>
              <div>Score: {score}/100</div>
            </div>
          </Tooltip>
        )

        if (cell.polygon && cell.polygon.length >= 3) {
          return (
            <Polygon
              key={cell.id}
              positions={cell.polygon.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={pathOptions}
              eventHandlers={{ click: () => onCellClick(cell) }}
            >
              {tooltip}
            </Polygon>
          )
        }

        // Fallback to rectangle for cells without polygon data
        return (
          <Rectangle
            key={cell.id}
            bounds={[
              [cell.bounds.south, cell.bounds.west],
              [cell.bounds.north, cell.bounds.east],
            ]}
            pathOptions={pathOptions}
            eventHandlers={{ click: () => onCellClick(cell) }}
          >
            {tooltip}
          </Rectangle>
        )
      })}
    </>
  )
}
