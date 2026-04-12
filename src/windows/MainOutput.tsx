import { useState, useEffect, useRef } from 'react'
import { usePresentationStore } from '../data/presentationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Main Output Window
// Applies template background, typography, transitions from the active default.
// ─────────────────────────────────────────────────────────────────────────────

// Maps transition name → CSS animation class to apply on the content layer
function getTransitionClasses(transition: string, duration: number) {
  const d = `duration-[${duration}ms]`
  switch (transition) {
    case 'cut':        return ''
    case 'slide-up':   return `animate-in slide-in-from-bottom-16 fade-in ${d}`
    case 'slide-left': return `animate-in slide-in-from-right-16 fade-in ${d}`
    case 'zoom':       return `animate-in zoom-in-75 fade-in ${d}`
    case 'flip':       return `animate-in flip-in ${d}`
    case 'fade':
    default:           return `animate-in fade-in ${d}`
  }
}

// Resolve the background CSS for the template's bg_type
function resolveTemplateBg(bgType: string | null, bgValue: string | null): React.CSSProperties {
  if (!bgType || !bgValue) return {}
  if (bgType === 'color') return { background: bgValue }
  if (bgType === 'gradient') return { background: bgValue }
  return {}  // image/video handled via <img>/<video> elements
}

export default function MainOutput() {
  const { liveSlide, textStyles, scriptureBackground, showBackground } = usePresentationStore()
  const [clock, setClock] = useState(new Date())
  const [slideKey, setSlideKey] = useState(0)
  const prevSlideRef = useRef<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Bump key whenever the slide changes so transition re-fires
  useEffect(() => {
    if (liveSlide?.id !== prevSlideRef.current) {
      setSlideKey(k => k + 1)
      prevSlideRef.current = liveSlide?.id || null
    }
  }, [liveSlide?.id])

  const { templateBgType, templateBgValue, transition, transitionDuration } = textStyles

  // Background priority:
  // 1. Media slides → always use the media file itself
  // 2. Template color/gradient → always wins (overrides user's stored media bg)
  // 3. Template image/video → use stored scriptureBackground/showBackground (still user-managed)
  // 4. No template → show stored scriptureBackground/showBackground
  const isMediaSlide = liveSlide?.type === 'media' && liveSlide.media_url
  const hasTemplateCssBg = (templateBgType === 'color' || templateBgType === 'gradient') && templateBgValue

  // The media layer below the text (image or video element)
  const activeBg = isMediaSlide
    ? { url: liveSlide.media_url!, type: (liveSlide.media_type as any) || 'image', path: liveSlide.media_url! }
    : hasTemplateCssBg
      ? null  // template color/gradient is applied via CSS — no image layer needed
      : liveSlide?.type === 'scripture'
        ? scriptureBackground
        : showBackground

  const templateCssBg = resolveTemplateBg(templateBgType, templateBgValue ?? null)

  // Container background: template CSS bg (color/gradient) or pitch black for media/image
  const containerStyle: React.CSSProperties = isMediaSlide
    ? { background: '#000' }
    : hasTemplateCssBg
      ? templateCssBg
      : { background: '#000' }

  const transitionClass = getTransitionClasses(transition, transitionDuration)

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
      
      {/* ── Background Layer (media/image bg when no template CSS bg) ── */}
      <div className="absolute inset-0 z-0">
        {activeBg ? (
          activeBg.type === 'video' ? (
            <video 
              key={activeBg.path}
              src={activeBg.url} 
              autoPlay 
              loop 
              muted 
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          ) : (
            <img 
              key={activeBg.path}
              src={activeBg.url} 
              className="w-full h-full object-cover animate-in fade-in duration-1000"
              alt=""
            />
          )
        ) : null}
      </div>

      {/* ── Overlay Layer (Readability) ─────── */}
      <div 
        className="absolute inset-0 z-[1] transition-opacity duration-1000" 
        style={{ 
          background: `rgba(0,0,0,${liveSlide?.type === 'media' ? 0 : textStyles.bgOpacity})` 
        }} 
      />

      {/* ── Content Layer with Transition ───── */}
      {liveSlide.type !== 'blank' && (
        <div 
          key={slideKey}
          className={`relative z-10 w-full pointer-events-none ${transitionClass}`}
          style={{ 
            textAlign: textStyles.textAlign as any,
            padding: `${textStyles.padding}px`,
            fontFamily: textStyles.fontFamily || 'Inter, system-ui, sans-serif',
          }}
        >
          <p
            className="leading-[1.1] whitespace-pre-line"
            style={{
              fontSize: `${textStyles.fontSize}px`,
              color: textStyles.color,
              fontWeight: textStyles.fontWeight,
              textShadow: shadowStr,
              fontFamily: textStyles.fontFamily || 'Inter, system-ui, sans-serif',
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

      {/* ── Clock / Meta ── */}
      <div className="absolute bottom-12 right-12 z-20 opacity-30 text-white font-black text-xl tracking-tighter">
        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
