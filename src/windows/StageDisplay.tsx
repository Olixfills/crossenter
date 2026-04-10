import { useState, useEffect } from 'react'
import { usePresentationStore } from '../data/presentationStore'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Stage Display Window
// High-contrast monitor for musicians / speakers on stage.
// Shows: current slide text (large), next slide preview, clock, countdown.
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
  const { liveSlide, liveNextSlide, activeShow, scriptureBackground, showBackground } = usePresentationStore()

  const current  = liveSlide
  const next     = liveNextSlide

  const activeBg = current?.type === 'scripture' 
    ? scriptureBackground 
    : (current?.type === 'media' && current.media_url 
      ? { url: current.media_url, type: current.media_type || 'image' } 
      : showBackground)

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
      style={{ background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', userSelect: 'none' }}
    >
      {/* Background layer for media (Global backgrounds only, not for media slides themselves) */}
      {activeBg && current?.type !== 'media' && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
           {activeBg.type === 'video' ? (
              <video src={activeBg.url} autoPlay loop muted className="w-full h-full object-cover" />
           ) : (
              <img src={activeBg.url} className="w-full h-full object-cover" />
           )}
        </div>
      )}
      {/* ── Top bar: Clock + Countdown ───── */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0 bg-zinc-900/40"
        style={{ borderBottom: '3px solid #333' }}
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
        className={`flex-1 flex items-center justify-center min-h-0 overflow-hidden relative z-10 ${current.type === 'media' ? 'p-0' : 'px-16 py-10 bg-gradient-to-b from-black/80 to-zinc-950/80'}`}
        style={{ borderBottom: '3px solid #333' }}
      >
        {current.type === 'blank' ? (
          <div className="text-white/5 text-4xl font-black tracking-[1em] uppercase">— BLANK —</div>
        ) : current.type === 'media' && current.media_url ? (
          <div className="w-full h-full flex items-center justify-center relative">
             {current.media_type === 'video' ? (
                <video src={current.media_url} autoPlay loop muted className="w-full h-full object-cover" />
             ) : (
                <img src={current.media_url} className="w-full h-full object-cover" />
             )}
             
             {/* Small label overlay */}
             <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 animate-in slide-in-from-right-4 duration-500">
                <span className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">{current.label}</span>
             </div>
          </div>
        ) : (
          <div className="w-full max-h-full flex flex-col justify-center min-h-0 overflow-hidden">
            <div className="text-accent text-xs font-black uppercase tracking-[0.4em] mb-4 text-center opacity-60 shrink-0">
               {current.label}
            </div>
            <p
              className="text-white font-bold leading-tight text-center"
              style={{
                fontSize: 'clamp(28px, 6.5vh, 82px)',
                whiteSpace: 'pre-line',
                textShadow: '0 10px 40px rgba(0,0,0,0.5)',
                wordBreak: 'break-word'
              }}
            >
              {current.text}
            </p>
          </div>
        )}
      </div>

      {/* ── Next slide preview ────────────── */}
      <div className="shrink-0 px-12 py-5 bg-zinc-900 border-t border-white/5 max-h-[25%] overflow-hidden flex flex-col" style={{ boxShadow: '0 -20px 40px rgba(0,0,0,0.5)' }}>
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
