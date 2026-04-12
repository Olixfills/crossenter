import { useState, useEffect } from 'react'
import { usePresentationStore } from '../data/presentationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Stage Display Window
// High-contrast monitor for musicians / speakers on stage.
// Shows: current slide text (large), next slide preview, clock, countdown.
// Now applies template background from the active default template.
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
  const countdown = useCountdown(5)
  const { liveSlide, liveNextSlide, activeShow, scriptureBackground, showBackground, textStyles } = usePresentationStore()

  const current  = liveSlide
  const next     = liveNextSlide

  const { templateBgType, templateBgValue, fontFamily } = textStyles

  // Media background (image/video from user setting)
  const activeBg = current?.type === 'scripture' 
    ? scriptureBackground 
    : (current?.type === 'media' && current.media_url 
      ? { url: current.media_url, type: current.media_type || 'image' } 
      : showBackground)

  // Resolve container background:
  // 1. Media slide → black (video/image is shown fullscreen)
  // 2. Template color → CSS color
  // 3. Template gradient → CSS gradient
  // 4. Template image/video bg → black (shown as layer below)
  // 5. No template → dark fallback
  const containerBg: React.CSSProperties = (() => {
    if (current?.type === 'media') return { background: '#000' }
    if (templateBgType === 'color' && templateBgValue) return { background: templateBgValue }
    if (templateBgType === 'gradient' && templateBgValue) return { background: templateBgValue }
    return { background: '#000' }
  })()

  if (!current) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center gap-6 p-12">
         {/* Top bar replica even when empty for UI consistency */}
         <div className="absolute top-0 left-0 right-0 p-6 flex justify-between opacity-20 border-b border-white/5">
            <span className="font-mono text-xl">{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="font-mono text-xl">{countdown.display}</span>
         </div>
         <div className="flex flex-col items-center gap-4 opacity-10">
            <div className="w-24 h-24 rounded-full border-8 border-white/20 border-t-white/80 animate-spin" />
            <p className="text-white font-black tracking-[0.5em] uppercase text-sm">Standby</p>
         </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-500 relative"
      style={{ ...containerBg, color: '#fff', fontFamily: fontFamily || 'Inter, sans-serif', userSelect: 'none' }}
    >
      {/* ── Template image/video background layer ── */}
      {(templateBgType === 'image' || templateBgType === 'video') && templateBgValue && current?.type !== 'media' && (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
          {templateBgType === 'video' ? (
            <video src={templateBgValue.startsWith('http') ? templateBgValue : `crossenter://${templateBgValue}`}
              autoPlay loop muted className="w-full h-full object-cover" />
          ) : (
            <img src={templateBgValue.startsWith('http') ? templateBgValue : `crossenter://${templateBgValue}`}
              className="w-full h-full object-cover" alt="" />
          )}
        </div>
      )}

      {/* ── Background layer for user-set media backgrounds ── */}
      {activeBg && current?.type !== 'media' && !templateBgType && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
           {activeBg.type === 'video' ? (
              <video src={activeBg.url} autoPlay loop muted className="w-full h-full object-cover" />
           ) : (
              <img src={activeBg.url} className="w-full h-full object-cover" alt="" />
           )}
        </div>
      )}

      {/* ── Readability overlay ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: `rgba(0,0,0,${current?.type === 'media' ? 0 : textStyles.bgOpacity * 0.5})` }}
      />

      {/* ── Top bar: Clock + Countdown ───── */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-4 shrink-0 bg-black/30"
        style={{ borderBottom: '3px solid rgba(255,255,255,0.1)' }}
      >
        {/* Wall clock */}
        <div className="w-1/3">
          <div className="text-4xl font-black font-mono tracking-tighter text-white">
            {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1 font-bold">
            {clock.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Show title */}
        <div className="w-1/3 text-center">
          <div className="text-[10px] text-accent font-black uppercase tracking-[0.3em] mb-1">On Air</div>
          <div className="text-lg font-bold text-white truncate px-4">{activeShow?.title || current.showTitle || 'Live Signal'}</div>
        </div>

        {/* Countdown timer */}
        <div className="w-1/3 text-right">
          <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1 font-bold">Timer</div>
          <div className={`text-4xl font-black font-mono tracking-widest ${countdown.done ? 'text-red-500' : 'text-accent'}`}>
            {countdown.display}
          </div>
        </div>
      </div>

      {/* ── Current slide (large) ─────────── */}
      <div
        className={`relative z-10 flex-1 flex items-center justify-center min-h-0 overflow-hidden ${current.type === 'media' ? 'p-0' : 'px-16 py-10'}`}
        style={{ borderBottom: '3px solid rgba(255,255,255,0.08)' }}
      >
        {current.type === 'blank' ? (
          <div className="text-white/5 text-4xl font-black tracking-[1em] uppercase">— BLANK —</div>
        ) : current.type === 'media' && current.media_url ? (
          <div className="w-full h-full flex items-center justify-center relative z-10">
             {current.media_type === 'video' ? (
                <video src={current.media_url} autoPlay loop muted className="w-full h-full object-cover" />
             ) : (
                <img src={current.media_url} className="w-full h-full object-cover" alt="" />
             )}
             {/* Small label overlay */}
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

      {/* ── Next slide preview ────────────── */}
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
    </div>
  )
}
