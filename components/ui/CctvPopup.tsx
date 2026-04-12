'use client'

/**
 * CctvPopup — floating panel that plays a live 511NY HLS camera stream.
 *
 * Uses hls.js (dynamically imported) for all browsers.
 * Falls back to native <video> src for Safari (which supports HLS natively).
 */

import { useEffect, useRef, useState } from 'react'
import { Camera } from '@/lib/cctv'

interface Props {
  camera:  Camera
  onClose: () => void
}

type Status = 'loading' | 'playing' | 'error'

export default function CctvPopup({ camera, onClose }: Props) {
  const videoRef          = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !camera.videoUrl) { setStatus('error'); return }

    setStatus('loading')
    let destroyed = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hlsInstance: any = null

    async function load() {
      const Hls = (await import('hls.js')).default
      if (destroyed) return

      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          lowLatencyMode:    true,
          backBufferLength:  5,
          maxBufferLength:   15,
        })
        hlsInstance.loadSource(camera.videoUrl!)
        hlsInstance.attachMedia(video!)
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video!.play().catch(() => {})
          setStatus('playing')
        })
        hlsInstance.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
          if (data.fatal) setStatus('error')
        })
      } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video!.src = camera.videoUrl!
        video!.play().catch(() => {})
        setStatus('playing')
      } else {
        setStatus('error')
      }
    }

    load()

    return () => {
      destroyed = true
      hlsInstance?.destroy()
    }
  }, [camera.videoUrl])

  return (
    <>
      {/* Invisible backdrop — tap outside to close */}
      <div className="fixed inset-0 z-[1099]" onClick={onClose} />

      {/* Panel — compact card anchored bottom-right, max 288 px wide */}
      <div
        className="fixed right-3 z-[1100] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white truncate leading-tight">
              {camera.name.split('at')[0].trim()}
            </p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">{camera.intersection}</p>
          </div>

          {/* Live badge */}
          {status === 'playing' && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          {status === 'loading' && (
            <span className="w-3 h-3 border-[1.5px] border-slate-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600 flex-shrink-0 ml-0.5"
            aria-label="Close"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video area — fixed height so it never overflows on small screens */}
        <div className="relative w-full h-36 bg-slate-950">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-950">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-[10px]">Connecting…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-950">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a1 1 0 011-1h9a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
              </svg>
              <p className="text-slate-400 text-[10px] text-center px-3">Feed unavailable</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900">
          <p className="text-[8px] text-slate-500">DOT Camera · 511NY</p>
          {camera.pageUrl && (
            <a
              href={camera.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[8px] text-teal-400 hover:text-teal-300 transition-colors"
            >
              511NY ↗
            </a>
          )}
        </div>
      </div>
    </>
  )
}
