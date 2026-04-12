import { useEditorStore } from "../../data/editorStore";
import { Plus, Trash2 } from "lucide-react";
import { SLIDE_TYPE_STYLES } from "../../data/placeholders";

export default function Filmstrip() {
  const {
    draftSlides,
    selectedSlideId,
    setSelectedSlideId,
    addSlide,
    removeSlide,
  } = useEditorStore();

  return (
    <div className="flex flex-col h-full bg-bg-raised border-r border-border-dim w-64 shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border-dim bg-bg-base/30 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hi">
          Slides
        </h3>
        <span className="text-[10px] font-bold text-text-ghost">
          {draftSlides.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {draftSlides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => setSelectedSlideId(slide.id)}
            className={`group relative aspect-video rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
              selectedSlideId === slide.id
                ? "border-accent ring-4 ring-accent/20 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-bg-active"
                : "border-border-dim hover:border-border-hi bg-bg-base/50"
            }`}
          >
            {/* Slide Index */}
            <div className="absolute top-1.5 left-1.5 z-10 w-4 h-4 rounded bg-black/60 backdrop-blur-md flex items-center justify-center text-[8px] font-black text-white/80">
              {index + 1}
            </div>

            {/* Slide Content Preview */}
            <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center">
              <p className="text-[8px] leading-tight text-white/60 line-clamp-3">
                {slide.text || (
                  <span className="italic opacity-30 whitespace-nowrap">
                    Empty Slide
                  </span>
                )}
              </p>
            </div>

            {/* Slide Category Badge */}
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <span
                className={`text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase ${SLIDE_TYPE_STYLES[slide?.type?.toLowerCase()] || ""}`}
              >
                {slide.type}
              </span>
            </div>

            {/* Selection Overlay */}
            {selectedSlideId === slide.id && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />
            )}

            {/* Delete button (hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeSlide(slide.id);
              }}
              className="absolute top-1.5 right-1.5 p-1 rounded bg-red-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-800"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}

        <button
          onClick={addSlide}
          className="w-full aspect-video rounded-lg border-2 border-dashed border-border-dim hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-full bg-border-dim group-hover:bg-accent/20 flex items-center justify-center text-text-ghost group-hover:text-accent transition-colors">
            <Plus size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-ghost group-hover:text-accent">
            New slide
          </span>
        </button>
      </div>
    </div>
  );
}
