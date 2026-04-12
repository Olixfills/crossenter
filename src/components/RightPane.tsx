import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../data/store'
import { usePresentationStore } from '../data/presentationStore'
import { useFontLoader } from '../hooks/useFontLoader'
import { CURRENT_TAGS, GLOBAL_TAGS } from '../data/placeholders'

// ... icons ...
import { 
  EyeOff, Settings, PenTool, Wrench, Palette, CalendarDays, Zap
} from 'lucide-react'

// Maps transition name → Tailwind animation classes (synchronized with MainOutput)
function getTransitionClasses(transition: string) {
  switch (transition) {
    case 'cut':        return ''
    case 'slide-up':   return 'animate-in slide-in-from-bottom-12 fade-in'
    case 'slide-left': return 'animate-in slide-in-from-right-12 fade-in'
    case 'zoom':       return 'animate-in zoom-in-75 fade-in'
    case 'flip':       return 'animate-in [perspective:1000px] [backface-visibility:hidden] flip-in'
    case 'blur':       return 'animate-in fade-in blur-[2px]'
    case 'fade':
    default:           return 'animate-in fade-in'
  }
}

function LivePreview({ liveSlide, activeBg, textStyles }: { liveSlide: any, activeBg: any, textStyles: any }) {
  const [slideKey, setSlideKey] = useState(0)
  const prevSlideId = useRef<string | null>(null)

  // Bump key when slide changes to trigger transition in inspector too
  useEffect(() => {
    if (liveSlide?.id !== prevSlideId.current) {
      setSlideKey(k => k + 1)
      prevSlideId.current = liveSlide?.id
    }
  }, [liveSlide?.id])

  if (!liveSlide) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-ghost opacity-40 italic select-none animate-in fade-in duration-700 bg-black/20 rounded-xl border border-dashed border-border-dim">
        <EyeOff size={32} className="mb-3 opacity-20" strokeWidth={1.5} />
        <p className="text-xs font-black uppercase tracking-widest">Feed Standby</p>
        <p className="text-[10px] mt-1">Ready to transition content</p>
      </div>
    )
  }

  const { 
    templateBgType, templateBgValue, fontFamily, color, 
    textShadowX, textShadowY, textShadowBlur, textShadowColor, 
    bgOpacity, padding, textAlign, transition, transitionDuration 
  } = textStyles
  
  const shadowStr = `${textShadowX ? textShadowX * 0.2 : 0}px ${textShadowY ? textShadowY * 0.2 : 0}px ${textShadowBlur ? textShadowBlur * 0.2 : 0}px ${textShadowColor}`

  const isMediaSlide = liveSlide.type === 'media'
  const hasTemplateCssBg = !isMediaSlide && (templateBgType === 'color' || templateBgType === 'gradient') && templateBgValue
  const showActiveBgLayer = activeBg && (isMediaSlide || !hasTemplateCssBg)

  const containerStyle: React.CSSProperties = {
    background: hasTemplateCssBg ? templateBgValue : '#000',
    padding: isMediaSlide ? '0px' : `${Math.min(padding, 24)}px`,
  }

  const transitionClass = getTransitionClasses(transition || 'fade')

  return (
    <div className="flex flex-col bg-bg-base/30 rounded-xl border border-border-dim overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="px-3 py-2 border-b border-border-dim bg-bg-base/50 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live: Output 1</span>
         </div>
         <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-black uppercase tracking-tighter">{liveSlide.label || 'V1'}</span>
      </div>
      
      {/* 16:9 Frame — mirrors exact MainOutput rendering logic */}
      <div
        className="relative w-full aspect-video flex items-center justify-center overflow-hidden"
        style={containerStyle}
      >
         {/* Media or background image/video layer */}
         {showActiveBgLayer && (
            <div className={`absolute inset-0 z-0 ${isMediaSlide ? 'opacity-100' : 'opacity-70'}`}>
               {activeBg.type === 'video' ? (
                  <video src={activeBg.url} autoPlay loop muted className="w-full h-full object-cover" />
               ) : (
                  <img src={activeBg.url} className="w-full h-full object-cover" alt="" />
               )}
            </div>
         )}

         {/* Readability overlay — only for text slides */}
         {!isMediaSlide && (
            <div className="absolute inset-0 z-[1]" style={{ background: `rgba(0,0,0,${bgOpacity})` }} />
         )}

         {/* Slide text — with transitions! */}
         {!isMediaSlide && liveSlide.type !== 'blank' && (
           <div 
             key={slideKey}
             className={`relative z-10 w-full px-4 ${transitionClass}`}
             style={{ 
               textAlign: textAlign as any,
               animationDuration: `${(transitionDuration || 700) * 0.8}ms`, // slightly faster for UI feel
               animationFillMode: 'forwards'
             }}
           >
             <p
               className="leading-[1.15] text-[10px] sm:text-[11px] font-black whitespace-pre-line max-h-full overflow-hidden"
               style={{
                 color: color || '#ffffff',
                 fontFamily: fontFamily || 'Inter, sans-serif',
                 textShadow: shadowStr,
               }}
             >
                {liveSlide.text}
             </p>
           </div>
         )}

         {/* Media label overlay (like MainOutput) */}
         {isMediaSlide && liveSlide.label && (
           <div className="absolute bottom-2 right-2 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black text-accent uppercase tracking-widest">
             {liveSlide.label}
           </div>
         )}

         {/* Safe Zone indicator */}
         <div className="absolute inset-1.5 border border-white/5 rounded-sm pointer-events-none z-20" />
      </div>

      <div className="p-2.5 bg-bg-base/50 border-t border-border-dim">
        <div className="flex items-center justify-between text-[9px] text-text-ghost font-bold uppercase tracking-tight">
           <span className="truncate max-w-[140px] text-accent">{liveSlide.showTitle || liveSlide.label || 'Media'}</span>
           <span className="font-mono opacity-40 shrink-0">{isMediaSlide ? liveSlide.media_type || 'media' : hasTemplateCssBg ? templateBgType : 'no bg'}</span>
        </div>
      </div>
    </div>
  )
}

function ShowTools() {
  const { liveSlideId, liveSlide, activeShow, scriptureBackground, showBackground, textStyles } = usePresentationStore()
  const [isAutoProgress, setIsAutoProgress] = useState(false)

  // Load live font
  useFontLoader(textStyles.fontFamily)

  const activeBg = liveSlide?.type === 'scripture' 
    ? scriptureBackground 
    : (liveSlide?.type === 'media' && liveSlide.media_url 
      ? { url: liveSlide.media_url, type: liveSlide.media_type || 'image' } 
      : showBackground)

  return (
    <div className="flex flex-col h-full bg-bg-raised p-4 gap-6 overflow-y-auto custom-scrollbar">
      {/* 1. Live Preview Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-2xs font-black text-text-hi uppercase tracking-widest">Main Engine</h3>
        </div>
        
        <LivePreview 
          liveSlide={liveSlide} 
          activeBg={activeBg}
          textStyles={textStyles}
        />
        
        <div 
          className={`
            w-full py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300
            ${liveSlideId ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 active:scale-[0.98] cursor-pointer' : 'bg-bg-surface border-border-dim text-text-ghost cursor-not-allowed opacity-50'}
          `}
        >
          {liveSlideId ? (
            <>
              <Zap size={10} fill="white" />
              Broadcasting Live
            </>
          ) : (
             <>Engines Standby</>
          )}
        </div>
      </section>

      {/* 2. Transition & Timing */}
      <section className="flex flex-col gap-3">
        <h3 className="text-2xs font-black text-text-hi uppercase tracking-widest px-1 opacity-50">Master Transitions</h3>
        <div className="grid grid-cols-2 gap-2">
            <button className="py-2.5 rounded-xl bg-bg-surface border border-border-dim text-[10px] text-text-lo hover:border-accent hover:bg-bg-hover transition-all font-black uppercase tracking-tighter">Cut</button>
            <button className="py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-[10px] text-accent font-black tracking-tighter hover:bg-accent/20 transition-all shadow-sm">Fade (400ms)</button>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={isAutoProgress} 
              onChange={e => setIsAutoProgress(e.target.checked)} 
              className="accent-accent w-3.5 h-3.5"
            />
            <span className="text-[10px] text-text-ghost group-hover:text-text-lo transition-colors font-black uppercase tracking-wider">Auto Advance</span>
          </label>
        </div>
      </section>

      {/* 3. Quick Actions */}
      <section className="flex flex-col gap-3">
        <h3 className="text-2xs font-black text-text-hi uppercase tracking-widest px-1 opacity-50">Quick Overlays</h3>
        <div className="grid grid-cols-2 gap-2">
          {GLOBAL_TAGS.map(tag => (
            <button 
              key={tag} 
              className="py-2.5 rounded-xl bg-bg-surface border border-border-dim text-[10px] text-text-lo hover:border-accent hover:bg-bg-hover transition-all font-black uppercase tracking-tighter"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Show Inspector (Refined Version) */}
      <section className="flex flex-col gap-4 bg-bg-base/40 p-4 rounded-2xl border border-border-dim/50">
        <div className="flex items-center justify-between">
           <h3 className="text-2xs font-black text-text-hi uppercase tracking-widest">Show Inspector</h3>
           <Settings size={12} className="text-text-ghost hover:text-white cursor-pointer transition-colors" />
        </div>
        
        {activeShow ? (
           <div className="space-y-4 animate-in fade-in duration-500">
              <div className="pb-3 border-b border-border-dim/50">
                <p className="text-xs font-black text-accent truncate">{activeShow.title}</p>
                <p className="text-[10px] font-bold text-text-ghost opacity-80 mt-1">{activeShow.artist || 'Independent'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest">Scale/Key</p>
                    <p className="text-[11px] font-black text-white">{(activeShow as any).key || '--'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest">Tempo</p>
                    <p className="text-[11px] font-black text-white">{(activeShow as any).tempo ? `${(activeShow as any).tempo} BPM` : '--'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest">CCLI #</p>
                    <p className="text-[11px] font-black text-text-lo">{(activeShow as any).ccli || 'None'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest">Author</p>
                    <p className="text-[11px] font-black text-text-lo truncate">{(activeShow as any).author || 'Unknown'}</p>
                 </div>
              </div>
              
              <div className="pt-2">
                 <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest mb-2">Show Structure</p>
                 <div className="flex flex-wrap gap-1.5">
                    {CURRENT_TAGS.map(tag => (
                      <button key={tag} className="px-2 py-1 rounded bg-accent/10 border border-accent/20 text-[8px] text-accent font-black uppercase tracking-tighter">
                        {tag}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        ) : (
           <div className="py-6 flex flex-col items-center justify-center text-center opacity-30 select-none">
              <EyeOff size={24} className="mb-2" strokeWidth={1.5} />
              <p className="text-[10px] font-black tracking-widest uppercase">No Active Show</p>
           </div>
        )}
      </section>
    </div>
  )
}

function ToolPlaceholder({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-20 select-none grayscale">
       <Icon size={48} className="mb-4 opacity-40" strokeWidth={1} />
       <p className="text-xs font-bold uppercase tracking-[0.2em]">{title} Inspector</p>
       <p className="text-[10px] mt-3 italic tracking-wide">Interface optimization in progress</p>
    </div>
  )
}

export default function RightPane() {
  const { activeMode, rightPaneWidth } = useUIStore()

  return (
    <aside 
      className="flex flex-col h-full bg-bg-raised border-l border-border-dim shrink-0 overflow-hidden relative shadow-2xl"
      style={{ width: rightPaneWidth }}
    >
      <div className="h-10 px-4 border-b border-border-dim flex items-center justify-between bg-bg-base/50 shrink-0">
        <span className="text-[10px] font-black text-text-ghost uppercase tracking-[0.3em]">{activeMode} Inspector</span>
        <button className="text-text-ghost hover:text-accent transition-colors">
          <Settings size={14} strokeWidth={2.5} />
        </button>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeMode === 'Show' && <ShowTools />}
        {activeMode === 'Edit' && <ToolPlaceholder title="Editor" icon={PenTool} />}
        {activeMode === 'Stage' && <ToolPlaceholder title="Stage" icon={Wrench} />}
        {activeMode === 'Draw' && <ToolPlaceholder title="Draw" icon={Palette} />}
        {activeMode === 'Calendar' && <ToolPlaceholder title="Calendar" icon={CalendarDays} />}
      </div>
    </aside>
  )
}
