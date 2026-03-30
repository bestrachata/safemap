'use client'

/**
 * CctvPanel — floating popup showing a camera feed for the selected marker.
 *
 * Images are served by picsum.photos (grayscale, stable seed per camera).
 * A refreshIndex cycles through 5 variants every REFRESH_MS to simulate a
 * live feed.  The hard LOAD_TIMEOUT_MS guard prevents the spinner from hanging
 * if the image server is slow.
 *
 * For production: swap cameraSnapshotUrl() to return actual 511NY / NYC DOT
 * URLs once an API key is available (free registration at 511ny.org/developers).
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Camera, cameraSnapshotUrl, isLiveCamera } from '@/lib/cctv'

interface Props {
  camera:  Camera | null
  onClose: () => void
}

const REFRESH_MS      = 8_000   // cycle to next image variant
const LOAD_TIMEOUT_MS = 6_000   // force error if image never resolves

export default function CctvPanel({ camera, onClose }: Props) {
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [imgSrc,       setImgSrc]       = useState('')
  const [status,       setStatus]       = useState<'loading' | 'ok' | 'error'>('loading')
  const [elapsed,      setElapsed]      = useState(0)

  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null)

  const loadImage = useCallback((cam: Camera, idx: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    setStatus('loading')
    setElapsed(0)
    setImgSrc(cameraSnapshotUrl(cam, idx))

    // Hard timeout so the spinner never hangs forever
    timeoutRef.current = setTimeout(() => {
      setStatus(s => s === 'loading' ? 'error' : s)
    }, LOAD_TIMEOUT_MS)
  }, [])

  // Start refresh cycle when a new camera is selected
  useEffect(() => {
    if (!camera) { setImgSrc(''); setRefreshIndex(0); return }

    setRefreshIndex(0)
    loadImage(camera, 0)

    if (refreshRef.current) clearInterval(refreshRef.current)
    refreshRef.current = setInterval(() => {
      setRefreshIndex(i => {
        const next = i + 1
        loadImage(camera, next)
        return next
      })
    }, REFRESH_MS)

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [camera, loadImage])

  function handleLoad()  { if (timeoutRef.current) clearTimeout(timeoutRef.current); setStatus('ok') }
  function handleError() { if (timeoutRef.current) clearTimeout(timeoutRef.current); setStatus('error') }

  // Tick elapsed counter while feed is open
  useEffect(() => {
    if (!camera) return
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [camera, imgSrc])

  if (!camera) return null

  const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false })

  return (
    <div
      className="absolute inset-0 z-[1200] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ width: 'min(360px, 92vw)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/80">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-red-600 rounded px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white tracking-widest">LIVE</span>
            </span>
            <span className="text-white text-xs font-semibold truncate max-w-[160px]">
              {camera.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Close camera feed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Feed area ──────────────────────────────────────────── */}
        <div className="relative bg-slate-900" style={{ aspectRatio: '4/3' }}>

          {/* Image — always mounted so callbacks fire; hidden until ok */}
          {imgSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imgSrc}
              src={imgSrc}
              alt={`Feed: ${camera.name}`}
              className="w-full h-full object-cover"
              style={{ display: status === 'ok' ? 'block' : 'none' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs">Connecting to feed…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.118a1 1 0 01-1.447.894L15 14M3 8h12a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-slate-300 text-sm font-medium">Image unavailable</p>
                <p className="text-slate-600 text-xs mt-1">Tap to retry</p>
              </div>
              <button
                onClick={() => camera && loadImage(camera, refreshIndex)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-green-400 hover:bg-slate-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* HUD overlays when feed is live */}
          {status === 'ok' && (
            <>
              <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-0.5 font-mono text-[10px] text-white/80">
                {timeStr}
              </div>
              <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-0.5 font-mono text-[10px] text-white/50">
                CAM-{camera.id}
              </div>
              {/* Scanline overlay for CCTV aesthetic */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }} />
              {/* Show DEMO badge for picsum fallback, nothing for real feed */}
              {!isLiveCamera(camera) && (
                <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-0.5 text-[9px] text-white/40 font-mono">
                  DEMO
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-3 py-2.5 bg-slate-900/90 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{camera.intersection}</p>
            <p className="text-slate-400 text-[10px]">{camera.borough}, New York</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-slate-500 text-[10px]">{isLiveCamera(camera) ? '● Live · refresh 8s' : 'Demo mode'}</p>
            <p className="text-slate-600 text-[10px] font-mono">+{elapsed}s</p>
          </div>
        </div>

      </div>
    </div>
  )
}
