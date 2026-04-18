import React, { useState, useEffect, useRef } from 'react'
import { usePresentationStore } from '../data/presentationStore'
import { useFontLoader } from '../hooks/useFontLoader'
import { resolveMediaUrl } from '../utils/url'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Stage Display Window
// ─────────────────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function useCountdown(targetMinutes = 5) {
  const [seconds, setSeconds] = useState(targetMinutes * 60)
  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return { display: `${mins}:${secs}`, done: seconds === 0 }
}

export default function StageDisplay() {
  const clock = useClock()
  const activeCountdown = useCountdown(5)
  const { 
    liveSlide, 
    liveNextSlide, 
    activeShow, 
    scriptureBackground, 
    showBackground, 
    textStyles, 
    mediaLoop,
    activeMedia,
    playbackMode,
    mediaMuted,
    mediaVolume,
    mediaPlaying,
    mediaCurrentTime,
    
    // Phase 10
    isBlanked,
    globalBlankType,
    globalBlankValue,
    isTimerEnabled,
    timerMode,
    timerTarget,
    timerColor,
    timerFontSize,
  } = usePresentationStore()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // ── Reactive Sync: Match Playback State ──
  useEffect(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    if (mediaPlaying && video.paused) {
      video.play().catch(() => {})
    } else if (!mediaPlaying && !video.paused) {
      video.pause()
    }
  }, [mediaPlaying])

  // ── Reactive Sync: Drift Correction (Snap to Master) ──
  useEffect(() => {
    if (!videoRef.current || !mediaPlaying) return
    const video = videoRef.current
    const drift = Math.abs(video.currentTime - mediaCurrentTime)
    // Snap if drift > 0.5s to ensure frame-accuracy without jitter
    if (drift > 0.5) {
      video.currentTime = mediaCurrentTime
    }
  }, [mediaCurrentTime, mediaPlaying])

  // Media Command Listener (for Stop / Seek / Heavy overrides)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'MEDIA_COMMAND' && videoRef.current) {
          const video = videoRef.current
          switch (msg.command) {
            case 'PLAY':
              video.play().catch(() => {})
              break
            case 'PAUSE':
              video.pause()
              break
            case 'STOP': 
              video.pause()
              video.currentTime = 0
              break
            case 'SEEK': 
              video.currentTime = msg.payload
              break
          }
        }
      } catch (e) {}
    }
    return () => ws.close()
  }, [])

  // Font loading
  useFontLoader(textStyles?.fontFamily)

  const current = liveSlide
  const next = liveNextSlide

  if (!current) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-6 p-12">
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between opacity-20 border-b border-white/5">
          <span className="font-mono text-xl">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="font-mono text-xl">{activeCountdown.display}</span>
        </div>
        <div className="flex flex-col items-center gap-4 opacity-10">
          <div className="w-24 h-24 rounded-full border-8 border-white/20 border-t-white/80 animate-spin" />
          <p className="text-white font-black tracking-[0.5em] uppercase text-sm">Standby</p>
        </div>
      </div>
    )
  }

  const { templateBgType, templateBgValue, fontFamily } = textStyles
  const isMediaSlide = current?.type === 'media'
  const hasTemplateCssBg = !isMediaSlide && (templateBgType === 'color' || templateBgType === 'gradient') && templateBgValue
  
  const showActiveBgLayer = activeMedia && (isMediaSlide || !hasTemplateCssBg)

  const containerBg: React.CSSProperties = (() => {
    if (isMediaSlide) return { background: '#000' }
    if (templateBgType === 'color' && templateBgValue) return { background: templateBgValue }
    if (templateBgType === 'gradient' && templateBgValue) return { background: templateBgValue }
    return { background: '#000' }
  })()

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-500 relative"
      style={{ ...containerBg, color: '#fff', fontFamily: fontFamily || 'Inter, sans-serif', userSelect: 'none' }}
    >
      {/* 2. Unified Media Layer (Foreground & Background) */}
      <div className={`absolute inset-0 ${playbackMode === 'foreground' ? 'z-20 opacity-100' : 'z-0 opacity-70'}`}>
        {activeMedia && (
          activeMedia.type === 'video' ? (
            <video 
              ref={videoRef}
              key={activeMedia.url} 
              src={resolveMediaUrl(activeMedia.url)} 
              autoPlay 
              loop={mediaLoop} 
              muted={true}
              className={`w-full h-full animate-in fade-in duration-1000 ${isMediaSlide ? 'object-contain' : 'object-cover pointer-events-none'}`} 
            />
          ) : (
            <img 
              key={activeMedia.url} 
              src={resolveMediaUrl(activeMedia.url)} 
              className="w-full h-full object-cover animate-in fade-in duration-1000 pointer-events-none" 
              alt="" 
            />
          )
        )}
      </div>

      {/* 3. Global Overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: `rgba(0,0,0,${isMediaSlide ? 0 : textStyles.bgOpacity * 0.5})` }}
      />

      {/* 4. Top Header Bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-4 shrink-0 bg-black/30"
        style={{ borderBottom: '3px solid rgba(255,255,255,0.1)' }}
      >
        <div className="w-1/3 text-4xl font-black font-mono tracking-tighter text-white tabular-nums">
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="w-1/3 text-center">
          <div className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mb-1">On Air</div>
          <div className="text-lg font-bold text-white truncate px-4">
             {isBlanked ? 'OUTPUT BLANKED' : (activeShow?.title || current.showTitle || 'Live Signal')}
          </div>
        </div>
        <div className="w-1/3 text-right">
          <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1 font-bold">
            {isTimerEnabled ? (timerMode === 'clock' ? 'Real Time' : 'Countdown') : 'Timer'}
          </div>
          <div className={`text-4xl font-black font-mono tracking-widest tabular-nums ${isTimerEnabled ? 'text-accent' : 'text-white/10'}`}>
            {isTimerEnabled ? (timerMode === 'clock' ? clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : timerTarget) : '00:00:00'}
          </div>
        </div>
      </div>

      {/* 5. Main Content Area (Text Only) */}
      <div
        className={`relative z-10 flex-1 flex items-center justify-center min-h-0 overflow-hidden ${isMediaSlide ? 'p-0' : 'px-16 py-10'}`}
        style={{ borderBottom: '3px solid rgba(255,255,255,0.08)' }}
      >
        {current.type === 'blank' ? (
          <div className="text-white/5 text-4xl font-black tracking-[1em] uppercase">— BLANK —</div>
        ) : isMediaSlide ? (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            {/* Media is handled by the Unified Media Layer in the background for sync stability */}
            <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 animate-in slide-in-from-right-4 duration-500">
              <span className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">{current.label}</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-h-full flex flex-col justify-center min-h-0 overflow-hidden relative z-10">
            <div className="text-accent text-xs font-black uppercase tracking-[0.4em] mb-4 text-center opacity-60 shrink-0">
              {current.label}
            </div>
            <p
              className="font-bold leading-tight text-center"
              style={{
                fontSize: 'clamp(28px, 6.5vh, 82px)',
                whiteSpace: 'pre-line',
                color: textStyles.color || '#ffffff',
                textShadow: `${textStyles.textShadowX}px ${textStyles.textShadowY}px ${textStyles.textShadowBlur}px ${textStyles.textShadowColor}`,
                fontFamily: fontFamily || 'Inter, sans-serif',
                textAlign: textStyles.textAlign,
                wordBreak: 'break-word'
              }}
            >
              {current.text}
            </p>
          </div>
        )}
      </div>

      {/* 6. Footer Preview Bar */}
      <div className="relative z-10 shrink-0 px-12 py-5 bg-black/40 border-t border-white/5 max-h-[25%] overflow-hidden flex flex-col" style={{ boxShadow: '0 -20px 40px rgba(0,0,0,0.5)' }}>
        <div className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-2 shrink-0">Next Step →</div>
        {next ? (
          <p
            className="text-white/60 font-semibold leading-snug truncate-lines-3 overflow-hidden"
            style={{ fontSize: 'clamp(18px, 3vh, 28px)', whiteSpace: 'pre-line' }}
          >
            {next.text || '— Blank —'}
          </p>
        ) : (
          <p className="text-white/20 font-black italic tracking-widest lowercase" style={{ fontSize: 18 }}>// end of sequence</p>
        )}
      </div>

      {/* Global Blank Warning Overlay for Stage Display */}
      {isBlanked && (
        <div className="absolute inset-0 z-[100] bg-red-900/40 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-red-600 animate-pulse pointer-events-none">
           <div className="bg-red-600 text-white px-12 py-4 rounded-full font-black text-6xl tracking-[0.2em] shadow-3xl">
              MAIN BLANKED
           </div>
           <p className="text-white/80 font-bold mt-8 text-xl uppercase tracking-widest">Audience sees nothing</p>
        </div>
      )}
    </div>
  )
}
