import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../data/store'
import { usePresentationStore } from '../data/presentationStore'
import { useFontLoader } from '../hooks/useFontLoader'
import { resolveMediaUrl } from '../utils/url'
import { resolvePosition, getPreviewPositionStyle } from '../utils/layout'
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

function LivePreview({ 
  liveSlide, 
  activeBg, 
  textStyles,
  isBlanked,
  globalBlankType,
  globalBlankValue,
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
  activeAlertText,
  alertBgColor,
  alertTextColor,
  alertScrollSpeed
}: { 
  liveSlide: any, 
  activeBg: any, 
  textStyles: any,
  isBlanked: boolean,
  globalBlankType: string,
  globalBlankValue: string,
  isLogoEnabled: boolean,
  logoUrl: string,
  logoPosition: string,
  logoScale: number,
  logoOpacity: number,
  logoIsFullScreen: boolean,
  isTimerEnabled: boolean,
  timerMode: string,
  timerTarget: string,
  timerPosition: string,
  timerColor: string,
  timerFontSize: number,
  isSafetyEnabled: boolean,
  safetyUrl: string,
  activeAlertText: string | null,
  alertBgColor: string,
  alertTextColor: string,
  alertScrollSpeed: string
}) {
  const [slideKey, setSlideKey] = useState(0)
  const prevSlideId = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Sync logic for Inspector Preview
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'MEDIA_COMMAND' && videoRef.current) {
          const video = videoRef.current
          switch (msg.command) {
            case 'PLAY': video.play().catch(() => {}); break
            case 'PAUSE': video.pause(); break
            case 'STOP': video.pause(); video.currentTime = 0; break
            case 'SEEK': video.currentTime = msg.payload; break
          }
        }
      } catch (e) { console.error(e) }
    }
    return () => ws.close()
  }, [])

  useEffect(() => {
    if (liveSlide?.id !== prevSlideId.current) {
      setSlideKey(k => k + 1)
      prevSlideId.current = liveSlide?.id
    }
  }, [liveSlide?.id])

  if (!liveSlide) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-ghost opacity-40 italic select-none animate-in fade-in duration-700 bg-black/20 rounded-xl border border-dashed border-border-dim aspect-video overflow-hidden">
        <EyeOff size={24} className="mb-2 opacity-20" strokeWidth={1.5} />
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">Feed Standby</p>
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
    <div className="flex flex-col bg-bg-base/30 rounded-xl border border-border-dim overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 ring-1 ring-white/5">
      <div className="px-3 py-1.5 border-b border-border-dim bg-white/5 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${liveSlide ? 'bg-red-500 animate-pulse' : 'bg-white/10'} shadow-[0_0_8px_rgba(239,68,68,0.5)]`} />
            <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Broadcast Feed • 01</span>
         </div>
         <div className="flex items-center gap-2">
            <Settings size={10} className="text-white/20 hover:text-white transition-colors cursor-pointer" />
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono tracking-tighter">1080p60</span>
         </div>
      </div>
      
      <div
        className="relative w-full aspect-video flex items-center justify-center overflow-hidden bg-black group"
        style={containerStyle}
      >
         {/* 1. Global Blank Layer */}
         {isBlanked && (
            <div 
               className="absolute inset-0 z-[100] animate-in fade-in duration-300" 
               style={{ 
                 background: globalBlankType === 'image' ? `url(${resolveMediaUrl(globalBlankValue)}) center/cover` : globalBlankValue 
               }} 
            />
         )}

         {/* 2. Media / Background Layer */}
         {showActiveBgLayer && (
            <div className={`absolute inset-0 z-0 ${isMediaSlide ? 'opacity-100' : 'opacity-70'}`}>
                {activeBg.type === 'video' ? (
                   <video 
                      ref={videoRef}
                      key={activeBg.url}
                      src={resolveMediaUrl(activeBg.url)} 
                      autoPlay 
                      loop={true} 
                      muted={true} 
                      className="w-full h-full object-cover" 
                   />
                ) : (
                   <img src={resolveMediaUrl(activeBg.url)} className="w-full h-full object-cover" alt="" />
                )}
            </div>
         )}

         {/* 3. Readability Layer */}
         {!isMediaSlide && (
            <div className="absolute inset-0 z-[1]" style={{ background: `rgba(0,0,0,${bgOpacity})` }} />
         )}

         {/* 4. Safety Layer */}
         {isSafetyEnabled && safetyUrl && (
            <div className="absolute inset-0 z-[5]">
               <img src={resolveMediaUrl(safetyUrl)} className="w-full h-full object-cover opacity-80" alt="" />
            </div>
         )}

         {/* 5. Slide Text Content */}
         {!isMediaSlide && liveSlide && liveSlide.type !== 'blank' && (
            <div 
              key={slideKey}
              className={`relative z-10 w-full px-4 ${transitionClass}`}
              style={{ 
                textAlign: textAlign as any,
                animationDuration: `${(transitionDuration || 700) * 0.8}ms`,
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

         {/* 6. Logo Overlay Layer */}
         {isLogoEnabled && logoUrl && (
            <div 
               className={`absolute z-[110] transition-all duration-700 flex flex-col pointer-events-none ${logoIsFullScreen ? 'inset-0 items-center justify-center p-0' : `p-2 ${getPreviewPositionStyle(logoPosition)}`}`}
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
                    width: `${logoScale * 0.8}px`,
                    opacity: logoOpacity 
                 }} 
                 alt="Logo" 
               />
            </div>
         )}

         {/* 7. Timer Overlay (Mimicked simple) */}
         {isTimerEnabled && (
            <div className={`absolute z-[120] p-4 ${getPreviewPositionStyle('top-right')}`}>
               <div className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/20 font-mono text-[10px] text-accent font-black tracking-widest leading-none">
                 {timerTarget}
               </div>
            </div>
         )}

         {/* 8. Alert Layer (Preview) */}
         {activeAlertText && (
            <div 
               className="absolute bottom-0 left-0 right-0 py-1.5 px-3 z-[150] overflow-hidden flex items-center"
               style={{ backgroundColor: alertBgColor }}
            >
               <div className="whitespace-nowrap animate-marquee flex items-center gap-4" style={{ animationDuration: alertScrollSpeed }}>
                  <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: alertTextColor }}>
                     {activeAlertText} • {activeAlertText}
                  </p>
               </div>
            </div>
         )}

         {/* Broadcast Helpers */}
         <div className="absolute inset-2 border border-white/5 rounded-sm pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/60 backdrop-blur-sm px-1 rounded flex items-center gap-1 border border-white/10">
               <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
               <span className="text-[7px] font-bold text-white/60 tracking-tighter uppercase whitespace-nowrap">Enc: 5.2Mbps</span>
            </div>
         </div>
      </div>

      <div className="px-3 py-2 bg-black/40 border-t border-border-dim flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="flex flex-col">
               <span className="text-white/30 text-[7px] font-black uppercase tracking-widest leading-none mb-0.5">Source</span>
               <span className="text-accent text-[9px] font-black truncate max-w-[120px] tracking-tight">{liveSlide?.showTitle || liveSlide?.label || 'READY'}</span>
            </div>
            <div className="w-[1px] h-4 bg-white/5" />
            <div className="flex flex-col">
               <span className="text-white/30 text-[7px] font-black uppercase tracking-widest leading-none mb-0.5">Format</span>
               <span className="text-white/60 text-[9px] font-mono tracking-tighter uppercase leading-none">{isMediaSlide ? (liveSlide as any).media_type || 'MEDIA' : hasTemplateCssBg ? templateBgType : 'TEXT-ONLY'}</span>
            </div>
         </div>
         <div className="flex gap-1">
            <div className="w-6 h-1 rounded-full bg-accent/20 overflow-hidden">
               <div className="w-2/3 h-full bg-accent" />
            </div>
         </div>
      </div>
    </div>
   )
}

function ShowTools() {
  const { 
    liveSlideId, 
    liveSlide, 
    activeShow, 
    activeMedia,
    textStyles,
    isBlanked,
    toggleBlank,
    isLogoEnabled,
    isTimerEnabled,
    toggleOverlay,
    clearOutput,
    activeAlertText,
    alertBgColor,
    alertTextColor,
    alertScrollSpeed,
    globalBlankType,
    globalBlankValue,
    logoUrl,
    logoPosition,
    logoScale,
    logoOpacity,
    logoIsFullScreen,
    timerMode,
    timerTarget,
    timerPosition,
    timerColor,
    timerFontSize,
    isSafetyEnabled,
    safetyUrl
  } = usePresentationStore()
  const [isAutoProgress, setIsAutoProgress] = useState(false)

  // Load live font
  useFontLoader(textStyles.fontFamily)

  // Use the store's resolved activeMedia for the background
  const activeBg = activeMedia

  return (
    <div className="flex flex-col h-full bg-bg-raised p-4 gap-6 overflow-y-auto custom-scrollbar">
      {/* 1. Live Preview Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-2xs font-black text-text-hi uppercase tracking-widest">Main Engine</h3>
        </div>
        
        {liveSlide ? (
          <LivePreview 
            liveSlide={liveSlide} 
            activeBg={activeBg}
            textStyles={textStyles}
            isBlanked={isBlanked}
            globalBlankType={globalBlankType}
            globalBlankValue={globalBlankValue}
            isLogoEnabled={isLogoEnabled}
            logoUrl={logoUrl}
            logoPosition={logoPosition}
            logoScale={logoScale}
            logoOpacity={logoOpacity}
            logoIsFullScreen={logoIsFullScreen}
            isTimerEnabled={isTimerEnabled}
            timerMode={timerMode}
            timerTarget={timerTarget}
            timerPosition={timerPosition}
            timerColor={timerColor}
            timerFontSize={timerFontSize}
            isSafetyEnabled={isSafetyEnabled}
            safetyUrl={safetyUrl}
            activeAlertText={activeAlertText}
            alertBgColor={alertBgColor}
            alertTextColor={alertTextColor}
            alertScrollSpeed={alertScrollSpeed}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-ghost opacity-40 italic select-none animate-in fade-in duration-700 bg-black/20 rounded-xl border border-dashed border-border-dim aspect-video overflow-hidden">
            <EyeOff size={24} className="mb-2 opacity-20" strokeWidth={1.5} />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">Feed Standby</p>
          </div>
        )}
        
        <div 
          className={`
            w-full py-2.5 rounded-lg border-2 font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300
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
          {GLOBAL_TAGS.map(tag => {
            const isBlankBtn = tag === 'Blank'
            const isLogoBtn = tag === 'Logo'
            const isTimerBtn = tag === 'Timer'
            const isClearBtn = tag === 'Clear'
            
            const isActive = (isBlankBtn && isBlanked) || 
                             (isLogoBtn && isLogoEnabled) || 
                             (isTimerBtn && isTimerEnabled)
            
            const handleClick = () => {
              if (isBlankBtn) toggleBlank()
              if (isLogoBtn) toggleOverlay('logo')
              if (isTimerBtn) toggleOverlay('timer')
              if (isClearBtn) clearOutput()
            }

            return (
              <button 
                key={tag} 
                onClick={handleClick}
                className={`
                  py-2 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all
                  ${isActive 
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95' 
                    : isBlankBtn || isLogoBtn || isTimerBtn || isClearBtn
                      ? 'bg-bg-surface border-border-dim text-text-lo hover:border-accent hover:bg-bg-hover active:scale-95' 
                      : 'bg-bg-surface border-border-dim text-text-lo hover:border-accent hover:bg-bg-hover'
                  }
                `}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. Show Inspector (Refined Version) */}
      <section className="flex flex-col bg-bg-base/40 p-1 rounded-2xl border border-border-dim/50 shadow-inner overflow-hidden">
        <div className="flex items-center justify-between p-3 pb-2">
           <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-accent rounded-full" />
              <h3 className="text-2xs font-black text-white uppercase tracking-widest">Show Inspector</h3>
           </div>
           <Settings size={12} className="text-text-ghost hover:text-white cursor-pointer transition-colors" />
        </div>
        
        {activeShow ? (
           <div className="p-3 pt-1 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative group cursor-default">
                <p className="text-sm font-black text-white truncate group-hover:text-accent transition-colors">{activeShow.title}</p>
                <p className="text-[10px] font-bold text-text-ghost opacity-60 mt-0.5 flex items-center gap-1.5">
                   {activeShow.artist || 'Independent'}
                   <span className="w-1 h-1 rounded-full bg-white/10" />
                   {activeShow.content?.length || 0} Slides
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-px bg-border-dim/30 rounded-lg overflow-hidden border border-border-dim/30">
                 <div className="bg-bg-raised/40 p-2.5 flex flex-col gap-1 hover:bg-bg-raised/60 transition-colors">
                    <p className="text-[8px] font-black text-text-ghost uppercase tracking-widest">Scale/Key</p>
                    <div className="flex items-center gap-1.5">
                       <Palette size={10} className="text-accent/40" />
                       <p className="text-[12px] font-mono font-black text-white">{(activeShow as any).key || 'C MIN'}</p>
                    </div>
                 </div>
                 <div className="bg-bg-raised/40 p-2.5 flex flex-col gap-1 hover:bg-bg-raised/60 transition-colors">
                    <p className="text-[8px] font-black text-text-ghost uppercase tracking-widest">Tempo</p>
                    <div className="flex items-center gap-1.5">
                       <Zap size={10} className="text-accent/40" />
                       <p className="text-[12px] font-mono font-black text-white">{(activeShow as any).tempo ? `${(activeShow as any).tempo}` : '120'} <span className="text-[8px] opacity-40">BPM</span></p>
                    </div>
                 </div>
                 <div className="bg-bg-raised/40 p-2.5 flex flex-col gap-1 hover:bg-bg-raised/60 transition-colors">
                    <p className="text-[8px] font-black text-text-ghost uppercase tracking-widest">CCLI Number</p>
                    <p className="text-[11px] font-mono font-black text-text-lo">{(activeShow as any).ccli || '7042512'}</p>
                 </div>
                 <div className="bg-bg-raised/40 p-2.5 flex flex-col gap-1 hover:bg-bg-raised/60 transition-colors">
                    <p className="text-[8px] font-black text-text-ghost uppercase tracking-widest">Lead Author</p>
                    <p className="text-[11px] font-black text-text-lo truncate">{(activeShow as any).author || 'Phil Wickham'}</p>
                 </div>
              </div>
              
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-text-ghost uppercase tracking-widest">Arrangement</p>
                    <span className="text-[8px] text-accent/40 font-mono font-bold">FLOW v2.1</span>
                 </div>
                 <div className="flex flex-wrap gap-1">
                    {CURRENT_TAGS.map(tag => (
                      <button 
                        key={tag} 
                        className={`
                          px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all
                          ${tag === liveSlide?.label 
                            ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-105 z-10' 
                            : 'bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                          }
                        `}
                      >
                        {tag}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        ) : (
           <div className="py-10 flex flex-col items-center justify-center text-center opacity-20 select-none grayscale animate-pulse">
              <div className="p-4 rounded-full bg-white/5 mb-3">
                 <EyeOff size={24} strokeWidth={1.5} />
              </div>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase">Engines Standby</p>
              <p className="text-[8px] mt-2 opacity-50 tracking-wider">Awaiting active show context</p>
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
