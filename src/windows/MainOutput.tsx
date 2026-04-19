import { useState, useEffect, useRef } from 'react'
import { usePresentationStore } from '../data/presentationStore'
import { useFontLoader } from '../hooks/useFontLoader'
import { resolveMediaUrl } from '../utils/url'
import { resolvePosition } from '../utils/layout'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Main Output Window
// Applies template background, typography, transitions from the active default.
// ─────────────────────────────────────────────────────────────────────────────

// Maps transition name → Tailwind animation classes
// NOTE: Duration is handled via inline style to support dynamic timing reliably
function getTransitionClasses(transition: string) {
  switch (transition) {
    case 'cut':        return ''
    case 'slide-up':   return 'animate-in slide-in-from-bottom-24 fade-in'
    case 'slide-left': return 'animate-in slide-in-from-right-24 fade-in'
    case 'zoom':       return 'animate-in zoom-in-75 fade-in'
    case 'flip':       return 'animate-in [perspective:1000px] [backface-visibility:hidden] flip-in'
    case 'blur':       return 'animate-in fade-in blur-sm'
    case 'fade':
    default:           return 'animate-in fade-in'
  }
}

// Resolve the background CSS for the template's bg_type
function resolveTemplateBg(bgType: string | null, bgValue: string | null): React.CSSProperties {
  if (!bgType || !bgValue) return {}
  if (bgType === 'color') return { background: bgValue }
  if (bgType === 'gradient') return { background: bgValue }
  return {}  // image/video handled via <img>/<video> elements
}

// Output window logic

export default function MainOutput() {
  const { 
    liveSlide, 
    textStyles, 
    scriptureBackground, 
    showBackground, 
    playbackMode, 
    activeMedia,
    mediaMuted,
    mediaVolume,
    mediaLoop,
    isBlanked,
    globalBlankType,
    globalBlankValue,

    // Phase 10
    isLogoEnabled,
    logoUrl,
    logoPosition,
    logoScale,
    logoOpacity,
    logoIsFullScreen,
    isTimerEnabled,
    timerMode,
    timerTarget,
    timerPosition,
    timerColor,
    timerFontSize,
    isSafetyEnabled,
    safetyUrl,

    // Phase 10: Alerts
    activeAlertText,
    alertBgColor,
    alertTextColor,
    alertScrollSpeed,
  } = usePresentationStore()
  const [clock, setClock] = useState(new Date())
  const [slideKey, setSlideKey] = useState(0)
  const prevSlideRef = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 1. Load the template font dynamically
  useFontLoader(textStyles.fontFamily)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Timer Countdown Logic
  const [countdown, setCountdown] = useState("00:00:00")
  useEffect(() => {
    if (timerMode !== 'countdown' || !timerTarget) return
    const timer = setInterval(() => {
      const [h, m, s] = timerTarget.split(':').map(Number)
      const targetSecs = (h || 0) * 3600 + (m || 0) * 60 + (s || 0)
      
      // For now, let's just show the static target if we're not running a global sync clock
      // Real countdown synchronization would need a "StartTime" in the store.
      // But for Phase 10, let's keep it simple: just show the target or clock.
      setCountdown(timerTarget)
    }, 1000)
    return () => clearInterval(timer)
  }, [timerTarget, timerMode])

  useEffect(() => {
    if (liveSlide?.id !== prevSlideRef.current) {
      setSlideKey(k => k + 1)
      prevSlideRef.current = liveSlide?.id || null
    }
  }, [liveSlide?.id])

  // --- WebSocket & Sync Logic ---
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    wsRef.current = ws
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'MEDIA_COMMAND' && videoRef.current) {
          const video = videoRef.current
          switch (msg.command) {
            case 'PLAY': video.play(); break
            case 'PAUSE': video.pause(); break
            case 'SEEK': video.currentTime = msg.payload; break
            case 'STOP': video.pause(); video.currentTime = 0; break
            case 'SET_VOLUME': video.volume = msg.payload; break
            case 'TOGGLE_MUTE': video.muted = !video.muted; break
            case 'TOGGLE_LOOP': video.loop = !video.loop; break
          }
        }
        // Also listen for loop state from SYNC_STATE if needed, 
        // but typically we rely on the command or the immediate store value.
      } catch (e) { console.error(e) }
    }
    
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  // Throttled sync broadcaster (now uses the persistent WS ref)
  const handleTimeUpdate = () => {
    if (!videoRef.current || playbackMode !== 'foreground' || !wsRef.current) return
    if (wsRef.current.readyState !== WebSocket.OPEN) return

    const video = videoRef.current
    wsRef.current.send(JSON.stringify({
      type: 'MEDIA_SYNC',
      payload: {
        currentTime: video.currentTime,
        duration: video.duration,
        playing: !video.paused,
        muted: video.muted,
        volume: video.volume,
        loop: video.loop
      }
    }))
  }

  const { templateBgType, templateBgValue, transition, transitionDuration } = textStyles

  const isMediaSlide = liveSlide?.type === 'media' && liveSlide.media_url
  const hasTemplateCssBg = (templateBgType === 'color' || templateBgType === 'gradient') && templateBgValue

  const templateCssBg = resolveTemplateBg(templateBgType, templateBgValue ?? null)
  const containerStyle: React.CSSProperties = (isMediaSlide || activeMedia?.type === 'video')
    ? { background: '#000' }
    : hasTemplateCssBg ? templateCssBg : { background: '#000' }

  // 2. Fixed Transition
  const transitionClass = getTransitionClasses(transition || 'fade')
  const contentStyle: React.CSSProperties = {
    textAlign: textStyles.textAlign as any,
    padding: `${textStyles.padding}px`,
    fontFamily: textStyles.fontFamily || 'Inter, system-ui, sans-serif',
    animationDuration: `${transitionDuration || 700}ms`,
    animationFillMode: 'forwards'
  }

  if (!liveSlide) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 opacity-5 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
           <div className="w-24 h-24 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
           <p className="text-white font-black tracking-[1em] uppercase text-[10px]">Signal Lost</p>
        </div>
      </div>
    )
  }

  const shadowStr = `${textStyles.textShadowX}px ${textStyles.textShadowY}px ${textStyles.textShadowBlur}px ${textStyles.textShadowColor}`

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={containerStyle}
    >
      
      {/* ── Background/Media Layer ── */}
      <div className={`absolute inset-0 ${playbackMode === 'foreground' ? 'z-20' : 'z-0'}`}>
        {activeMedia && (
          activeMedia.type === 'video' ? (
            <video 
              ref={videoRef}
              key={activeMedia.url} 
              src={resolveMediaUrl(activeMedia.url)} 
              autoPlay 
              loop={mediaLoop} 
              muted={playbackMode === 'background' ? true : mediaMuted} 
              onTimeUpdate={handleTimeUpdate}
              onPlay={handleTimeUpdate}
              onPause={handleTimeUpdate}
              className={`w-full h-full animate-in fade-in duration-1000 ${playbackMode === 'background' ? 'object-cover' : 'object-contain'}`} 
            />
          ) : (
            <img 
              key={activeMedia.url} 
              src={resolveMediaUrl(activeMedia.url)} 
              className="w-full h-full object-cover animate-in fade-in duration-1000" 
              alt="" 
            />
          )
        )}
      </div>

      {/* ── Overlay Layer ── */}
      <div 
        className="absolute inset-0 z-[1] transition-opacity duration-1000" 
        style={{ background: `rgba(0,0,0,${playbackMode === 'foreground' ? 0 : textStyles.bgOpacity})` }} 
      />

      {/* ── Content Layer with Transition ───── */}
      {liveSlide.type !== 'blank' && playbackMode !== 'foreground' && (
        <div 
          key={slideKey}
          className={`relative z-10 w-full pointer-events-none ${transitionClass}`}
          style={contentStyle}
        >
          <p
            className="leading-[1.1] whitespace-pre-line"
            style={{
              fontSize: `${textStyles.fontSize}px`,
              color: textStyles.color,
              fontWeight: textStyles.fontWeight,
              textShadow: shadowStr,
              fontFamily: 'inherit',
            }}
          >
            {liveSlide.text}
          </p>
          
          {liveSlide.type === 'scripture' && liveSlide.label && (
            <div 
              className="mt-12 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300"
              style={{
                textAlign: textStyles.textAlign as any === 'center' ? 'center' : 'right'
              }}
            >
              <span 
                className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md font-black uppercase tracking-[0.3em] italic"
                style={{
                  fontSize: `${Math.max(16, textStyles.fontSize * 0.35)}px`,
                  color: textStyles.color,
                  textShadow: shadowStr,
                  fontFamily: textStyles.fontFamily || 'Inter, system-ui, sans-serif',
                }}
              >
                {liveSlide.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Alert Layer (Phase 10) ── */}
      {activeAlertText && (
        <div 
          className="absolute bottom-0 left-0 right-0 py-4 px-6 z-[75] overflow-hidden flex items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 backdrop-blur-md"
          style={{ backgroundColor: alertBgColor }}
        >
          <div 
            className="whitespace-nowrap animate-marquee flex items-center gap-12"
            style={{ animationDuration: alertScrollSpeed }}
          >
             <p className="text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-8" style={{ color: alertTextColor }}>
                <span>{activeAlertText}</span>
                <span className="opacity-30">•</span>
                <span>{activeAlertText}</span>
                <span className="opacity-30">•</span>
                <span>{activeAlertText}</span>
                <span className="opacity-30">•</span>
             </p>
          </div>
        </div>
      )}

      {/* ── Safety Layer (Phase 10) ── */}
      {isSafetyEnabled && safetyUrl && (
        <div className="absolute inset-0 z-[5]">
           <img src={resolveMediaUrl(safetyUrl)} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Safety" />
        </div>
      )}

      {/* ── Logo Overlay Layer (Phase 10) ── */}
      {isLogoEnabled && logoUrl && (
        <div 
          className={`absolute z-[110] transition-all duration-700 flex flex-col pointer-events-none ${logoIsFullScreen ? 'inset-0 items-center justify-center p-0' : `p-4 ${resolvePosition(logoPosition)}`}`}
          style={logoIsFullScreen ? { backgroundColor: '#000' } : {}}
        >
           <img 
             src={resolveMediaUrl(logoUrl)} 
             style={logoIsFullScreen ? {
               width: '100%',
               height: '100%',
               objectFit: 'contain',
               opacity: logoOpacity
             } : { 
               width: `${logoScale * 1.5}px`, // Adjusted for 16:9 rectangular assumption
               opacity: logoOpacity 
             }} 
             className="drop-shadow-2xl transition-all"
             alt="Logo" 
           />
        </div>
      )}

      {/* ── Quick Timer Layer (Phase 10) ── */}
      {isTimerEnabled && (
        <div className={`absolute z-[105] p-6 flex flex-col pointer-events-none transition-all duration-700 ${resolvePosition(timerPosition)}`}>
           <p className="font-black tracking-tighter shadow-black animate-in zoom-in-95 duration-500" style={{ color: timerColor, fontSize: `${timerFontSize}px` }}>
              {timerMode === 'clock' 
                ? clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
                : countdown}
           </p>
        </div>
      )}

      {/* ── Global Blank Overlay (Phase 9.5) ── */}
      <div 
        className={`absolute inset-0 z-[100] transition-opacity duration-700 bg-black ${isBlanked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{
          ...(globalBlankType === 'color' && { backgroundColor: globalBlankValue }),
          ...(globalBlankType === 'gradient' && { backgroundImage: globalBlankValue })
        }}
      >
        {globalBlankType === 'image' && isBlanked && (
          <img 
            src={resolveMediaUrl(globalBlankValue)} 
            className="w-full h-full object-cover" 
            alt="Blank"
          />
        )}
      </div>
    </div>
  )
}
