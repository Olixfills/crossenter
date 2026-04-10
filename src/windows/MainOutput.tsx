import { useState, useEffect } from 'react'
import { usePresentationStore } from '../data/presentationStore'

export default function MainOutput() {
  const { liveSlide, textStyles, scriptureBackground, showBackground } = usePresentationStore()
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Decide which background to use based on context
  const activeBg = liveSlide?.type === 'scripture' 
    ? scriptureBackground 
    : (liveSlide?.type === 'media' && liveSlide.media_url 
      ? { url: liveSlide.media_url, type: (liveSlide.media_type as any) || 'image', path: liveSlide.media_url, name: liveSlide.label } 
      : showBackground)

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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black select-none">
      
      {/* ── Background Layer ────────────────── */}
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
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a0b2e] to-black opacity-60" />
        )}
      </div>

      {/* ── Overlay Layer (Readability) ─────── */}
      <div 
        className="absolute inset-0 z-1 transition-opacity duration-1000" 
        style={{ 
          background: `rgba(0,0,0,${liveSlide?.type === 'media' ? 0 : (activeBg ? textStyles.bgOpacity : 0.2)})` 
        }} 
      />

      {/* ── Content Layer ───────────────────── */}
      {liveSlide.type !== 'blank' && (
        <div 
          className="relative z-10 w-full px-24 max-w-[95vw] pointer-events-none transition-all duration-700"
          style={{ 
            textAlign: textStyles.textAlign as any,
            padding: `${textStyles.padding}px`
          }}
        >
          <p
            className="leading-[1.1] animate-in slide-in-from-bottom-12 duration-1000"
            style={{
              fontSize: `${textStyles.fontSize}px`,
              color: textStyles.color,
              fontWeight: textStyles.fontWeight,
              textShadow: shadowStr,
              whiteSpace: 'pre-line',
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
                }}
              >
                {liveSlide.label}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Clock / Meta (Optional Visibility) ── */}
      <div className="absolute bottom-12 right-12 z-20 opacity-30 text-white font-black text-xl tracking-tighter">
        {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
