import { useEditorStore } from '../../data/editorStore'
import { useRef, useEffect, useState } from 'react'

export default function Canvas() {
  const { draftSlides, selectedSlideId, updateSlideText, localStyles, splitSlide } = useEditorStore()
  const currentSlide = draftSlides.find(s => s.id === selectedSlideId)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [scale, setScale] = useState(1)

  // 1. Scaling Logic
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      const parent = containerRef.current.parentElement
      if (!parent) return
      
      const pWidth = parent.clientWidth - 80 // padding
      const pHeight = parent.clientHeight - 80
      
      const targetWidth = 1440 
      const targetHeight = 1080
      
      const sW = pWidth / targetWidth
      const sH = pHeight / targetHeight
      
      setScale(Math.min(sW, sH))
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 2. Auto-resize Logic (Sync height to scrollHeight)
  useEffect(() => {
    if (textareaRef.current && currentSlide) {
      const target = textareaRef.current
      target.style.height = 'auto'
      target.style.height = target.scrollHeight + 'px'
    }
  }, [selectedSlideId, currentSlide?.text, localStyles.fontSize])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      if (!currentSlide || !textareaRef.current) return
      
      const pos = textareaRef.current.selectionStart
      const text = currentSlide.text
      const firstPart = text.slice(0, pos)
      const secondPart = text.slice(pos)
      
      splitSlide(currentSlide.id, firstPart, secondPart)
    }
  }

  if (!currentSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="text-text-ghost italic text-sm">Select a slide to edit</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-bg-base relative overflow-hidden flex items-center justify-center p-10 select-none">
      <div 
        ref={containerRef}
        className="relative bg-black shadow-2xl animate-in fade-in zoom-in-95 duration-500 ring-2 ring-white/5 group-focus-within:ring-accent/50 transition-all overflow-y-auto custom-scrollbar"
        style={{
          width: '1440px',
          height: '1080px',
          transform: `scale(${scale})`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Slide Boundary Visual Aid */}
        <div className="absolute top-0 left-0 w-full h-[1080px] pointer-events-none border border-white/5" />
        
        {/* Soft Boundary Indicator (Dashed line at 1080px) */}
        <div className="absolute top-[1079px] left-0 w-full border-b border-dashed border-red-500/20 z-20 pointer-events-none" />

        <div className="relative min-h-full flex flex-col items-center px-12 group">
          {/* Spacers for safe vertical centering */}
          <div className="flex-1 min-h-[120px]" /> 
          <textarea
            ref={textareaRef}
            autoFocus
            className="w-full bg-transparent border-none outline-none resize-none overflow-hidden leading-[1.1] transition-all duration-300 focus:ring-1 focus:ring-accent/20 rounded-lg p-4"
            style={{
              fontSize: `${localStyles.fontSize}px`,
              textAlign: localStyles.textAlign as any,
              fontWeight: localStyles.fontWeight,
              fontStyle: localStyles.isItalic ? 'italic' : 'normal',
              color: '#ffffff',
            }}
            value={currentSlide.text}
            onChange={(e) => updateSlideText(currentSlide.id, e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
            placeholder="Type your lyrics here..."
            spellCheck={false}
          />
          <div className="flex-1 min-h-[120px]" />
        </div>

        {/* Status indicator */}
        <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 z-30">
           <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Editing Mode</span>
        </div>

        <div className="absolute bottom-8 right-8 z-30">
           <span className="text-[10px] font-mono text-white/20">Draft Layer v1.2 • 1440x1080 (Scroll Ready)</span>
        </div>
      </div>
    </div>
  )
}
