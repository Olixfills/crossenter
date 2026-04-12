import { useEditorStore } from '../../data/editorStore'
import { useRef, useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Template Canvas
// Displays a live 16:9 preview of the draftTemplate with a dummy text block.
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_TEXT = 'In the beginning God created the heavens and the earth. And the earth was without form, and void; and darkness was upon the face of the deep.'

export default function TemplateCanvas() {
  const { draftTemplate } = useEditorStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // ── Scaling Logic (same as show Canvas) ────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const parent = containerRef.current.parentElement
      if (!parent) return
      const pWidth = parent.clientWidth - 80
      const pHeight = parent.clientHeight - 80
      const sW = pWidth / 1440
      const sH = pHeight / 1080
      setScale(Math.min(sW, sH))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!draftTemplate) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-text-ghost italic text-sm">No template loaded.</div>
      </div>
    )
  }

  // ── Derived CSS values from template ───────────────────────────────────
  const bgStyle: React.CSSProperties = {}
  if (draftTemplate.bg_type === 'color') {
    bgStyle.backgroundColor = draftTemplate.bg_value
  }

  const textShadow = `${draftTemplate.offset_x}px ${draftTemplate.offset_y}px ${draftTemplate.shadow_blur}px ${draftTemplate.shadow_color}`

  const textStyle: React.CSSProperties = {
    fontFamily: draftTemplate.font_family,
    fontSize: `${draftTemplate.font_size}px`,
    color: draftTemplate.font_color,
    textAlign: draftTemplate.text_align as any,
    textShadow,
    padding: `${draftTemplate.padding}px`,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  }

  const isExternalBg = draftTemplate.bg_type === 'image' || draftTemplate.bg_type === 'video'
  const bgUrl = draftTemplate.bg_value
    ? (draftTemplate.bg_value.startsWith('http') || draftTemplate.bg_value.startsWith('data:')
        ? draftTemplate.bg_value
        : `crossenter://${draftTemplate.bg_value}`)
    : null

  return (
    <div className="flex-1 bg-bg-base relative overflow-hidden flex items-center justify-center p-10 select-none">
      <div
        ref={containerRef}
        className="relative shadow-2xl animate-in fade-in zoom-in-95 duration-500 ring-2 ring-white/5 overflow-hidden"
        style={{
          width: '1440px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
          ...bgStyle,
        }}
      >
        {/* Background Media */}
        {isExternalBg && bgUrl && (
          <>
            {draftTemplate.bg_type === 'image' && (
              <img
                src={bgUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            )}
            {draftTemplate.bg_type === 'video' && (
              <video
                src={bgUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay loop muted playsInline
              />
            )}
          </>
        )}

        {/* Backdrop Dimmer */}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${draftTemplate.backdrop_opacity})` }}
        />

        {/* Slide boundary visual */}
        <div className="absolute top-0 left-0 w-full h-[1080px] pointer-events-none border border-white/5" />

        {/* Dummy text block - centered vertically */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p style={textStyle} className="w-full leading-[1.2] transition-all duration-200">
            {DUMMY_TEXT}
          </p>
        </div>

        {/* Status chip */}
        <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 z-30">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Template Mode</span>
        </div>

        <div className="absolute bottom-8 right-8 z-30">
          <span className="text-[10px] font-mono text-white/20">
            {draftTemplate.font_family} • {draftTemplate.font_size}px • 1440×1080
          </span>
        </div>
      </div>
    </div>
  )
}
