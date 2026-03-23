'use client'

import { scoreLabel, scoreBgClass } from '@/lib/safetyScore'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function SafetyBadge({ score, size = 'md', showLabel = true }: Props) {
  const bgClass = scoreBgClass(score)

  const sizeClasses = {
    sm: 'text-sm font-semibold px-2 py-0.5',
    md: 'text-base font-bold px-3 py-1',
    lg: 'text-4xl font-black px-4 py-2',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses[size]} ${bgClass}`}>
      <span>{score}</span>
      {showLabel && size !== 'lg' && (
        <span className="opacity-75 text-xs font-medium">{scoreLabel(score)}</span>
      )}
      {size === 'lg' && (
        <span className="text-sm font-medium opacity-70 ml-1">/ 100</span>
      )}
    </span>
  )
}
