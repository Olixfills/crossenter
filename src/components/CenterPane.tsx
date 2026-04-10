import { useState } from "react";
import { useUIStore } from "../data/store";
import { usePresentationStore } from "../data/presentationStore";
import { SLIDE_TYPE_STYLES, type Slide, type SlideType } from "../data/placeholders";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Center Workspace
// ─────────────────────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  index,
  isSelected,
  isLive,
  scale,
  onClick,
  onDoubleClick,
}: {
  slide: Slide;
  index: number;
  isSelected: boolean;
  isLive: boolean;
  scale: number;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const baseW = 192; 
  const baseH = 108; 

  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`
        relative flex-col overflow-hidden rounded-lg border-2 transition-all duration-150 cursor-pointer group
        focus:outline-none select-none
        ${
          isLive 
            ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
            : isSelected
              ? "border-accent shadow-accent animate-pulse-accent"
              : "border-border-dim hover:border-border-hi"
        }
      `}
      style={{
        width: baseW * scale,
        height: baseH * scale,
        background: "#1a1a24",
        flexShrink: 0,
      }}
    >
      {/* Background radial gradient (Only for non-media) */}
      {!slide.media_url && (
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at center, #7b2ff7 0%, transparent 70%)' }} />
      )}

      {/* Background Media */}
      {slide.media_url && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {slide.media_type === 'video' ? (
            <video src={slide.media_url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={slide.media_url} className="w-full h-full object-cover" alt="" />
          )}
          {/* Subtle vignette for info overlay readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center p-2 overflow-hidden">
        <p
          className={`text-center leading-snug font-medium transition-colors ${isLive ? "text-white" : "text-text-hi"}`}
          style={{
            fontSize: `${Math.max(7, 10 * scale)}px`,
            whiteSpace: "pre-line",
          }}
        >
          {slide.text}
        </p>
      </div>

      {/* TOP: Type Badge */}
      <div className="absolute top-1.5 left-1.5 opacity-80">
        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight ${SLIDE_TYPE_STYLES[slide.type as SlideType]}`}>
          {slide.label}
        </span>
      </div>

      {/* BOTTOM: Number */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[10px] text-text-ghost font-mono">{index + 1}</span>
        {isLive && (
          <div className="flex items-center gap-1 bg-red-500 px-1 py-0.5 rounded">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-bold text-white uppercase">Live</span>
          </div>
        )}
      </div>

      {/* Selection Glow */}
      {isSelected && !isLive && (
        <div className="absolute inset-0 border-2 border-accent pointer-events-none opacity-40" />
      )}
    </button>
  );
}

function SlideGridView() {
  const [scale, setScale] = useState(1);
  const { 
    activeShow, 
    slides, 
    selectedSlideId,
    liveSlideId, 
    goLive 
  } = usePresentationStore();

  if (!activeShow || slides.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-ghost italic opacity-40 select-none">
        <span className="text-4xl mb-3">🎞️</span>
        <p className="text-sm">Select a show from the Library to view slides</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-base/20 select-none">
      {/* Show Info Bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-bg-base/30 border-b border-border-dim">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-text-hi truncate">{activeShow.title}</h2>
          <p className="text-[10px] text-text-ghost truncate">{activeShow.artist || 'Show Explorer'}</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button className="text-[10px] text-text-ghost hover:text-accent px-2 py-1 rounded bg-bg-surface border border-border-dim transition-all">
            Edit Show
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto py-8 px-6 scrollbar-thin">
        <div className="flex flex-wrap gap-6 justify-center content-start">
          {slides.map((slide, i) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={i}
              isSelected={slide.id === selectedSlideId}
              isLive={slide.id === liveSlideId}
              scale={scale}
              onClick={() => goLive(slide.id)}
              onDoubleClick={() => {}} // No double click for live
            />
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-t border-border-dim bg-bg-base/30">
        <div className="flex gap-1">
           {[0.5, 0.75, 1, 1.25].map(v => (
             <button 
               key={v}
               onClick={() => setScale(v)}
               className={`text-[10px] px-2 py-0.5 rounded border ${scale === v ? "text-accent border-accent bg-accent/5" : "text-text-ghost border-border-dim hover:text-text-lo"}`}
             >
               {v * 100}%
             </button>
           ))}
        </div>
        <input
          type="range" min={0.4} max={1.6} step={0.1} value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="flex-1 accent-accent h-1 cursor-pointer"
        />
        <div className="w-px h-4 bg-border-dim" />
        <span className="text-2xs text-text-ghost font-bold uppercase tracking-tight">
          {slides.length} slides
        </span>
      </div>
    </div>
  );
}

function WorkspacePlaceholder({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-bg-base/10 select-none">
      <div className="text-6xl mb-4 grayscale opacity-20">{icon}</div>
      <h2 className="text-lg font-bold text-text-hi uppercase tracking-[0.2em] opacity-40">
        {title} Workspace
      </h2>
      <p className="text-sm text-text-ghost mt-2 max-w-sm opacity-30 italic">
        This workspace is coming soon in the next phase.
      </p>
    </div>
  );
}

export default function CenterPane() {
  const { activeMode } = useUIStore();

  return (
    <main className="flex flex-col flex-1 min-w-0 bg-bg-base overflow-hidden">
      {activeMode === "Show" && <SlideGridView />}
      {activeMode === "Edit" && <WorkspacePlaceholder title="Editor" icon="✏️" />}
      {activeMode === "Stage" && <WorkspacePlaceholder title="Stage" icon="🛠" />}
      {activeMode === "Draw" && <WorkspacePlaceholder title="Canvas" icon="🎨" />}
      {activeMode === "Calendar" && <WorkspacePlaceholder title="Calendar" icon="📅" />}
    </main>
  );
}
