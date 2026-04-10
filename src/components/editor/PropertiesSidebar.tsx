import { useEditorStore } from '../../data/editorStore'
import { useUIStore } from '../../data/store'
import { 
  Type, 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Bold, 
  Italic, 
  Save, 
  ChevronDown,
  Trash2,
  Undo2
} from 'lucide-react'
import { type SlideType } from '../../data/placeholders'

const SLIDE_TYPES: SlideType[] = ['verse', 'chorus', 'bridge', 'tag', 'media', 'blank', 'title', 'scripture']

export default function PropertiesSidebar() {
  const { 
    draftShow, 
    draftSlides, 
    selectedSlideId, 
    updateSlideType, 
    localStyles, 
    updateLocalStyles,
    clearEditor 
  } = useEditorStore()
  
  const { setActiveMode } = useUIStore()
  const currentSlide = draftSlides.find(s => s.id === selectedSlideId)

  const handleExit = () => {
    clearEditor()
    setActiveMode('Show')
  }

  return (
    <div className="flex flex-col h-full bg-bg-raised border-l border-border-dim w-72 shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border-dim bg-bg-base/30">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hi">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {/* Active Slide Info */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest flex items-center gap-2">
            Slide Category
          </label>
          <div className="relative">
            <select
              value={currentSlide?.type || 'verse'}
              onChange={(e) => currentSlide && updateSlideType(currentSlide.id, e.target.value as SlideType)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-4 py-2.5 text-xs text-text-hi appearance-none focus:outline-none focus:border-accent transition-all"
              disabled={!currentSlide}
            >
              {SLIDE_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ghost pointer-events-none" />
          </div>
        </div>

        {/* Global Show Styles (Local to this Draft) */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
            Typography Overrides
          </label>
          
          {/* Font Size */}
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-text-lo">
                <Type size={16} />
                <span className="text-xs">Font Size</span>
             </div>
             <input 
               type="number"
               value={localStyles.fontSize}
               onChange={(e) => updateLocalStyles({ fontSize: Number(e.target.value) })}
               className="w-16 bg-bg-base border border-border-dim rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-accent"
             />
          </div>

          {/* Alignment */}
          <div className="flex items-center justify-between gap-2 bg-bg-base p-1 rounded-lg border border-border-dim">
             {[
               { id: 'left', icon: AlignLeft },
               { id: 'center', icon: AlignCenter },
               { id: 'right', icon: AlignRight },
             ].map(btn => (
               <button 
                 key={btn.id}
                 onClick={() => updateLocalStyles({ textAlign: btn.id as any })}
                 className={`flex-1 flex items-center justify-center p-2 rounded transition-all ${
                   localStyles.textAlign === btn.id ? 'bg-accent text-white' : 'text-text-ghost hover:text-text-hi'
                 }`}
               >
                 <btn.icon size={16} />
               </button>
             ))}
          </div>

          {/* Formatting Toggles */}
          <div className="grid grid-cols-2 gap-2">
             <button 
               onClick={() => updateLocalStyles({ fontWeight: localStyles.fontWeight === '900' ? '400' : '900' })}
               className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${
                 localStyles.fontWeight === '900' ? 'border-accent bg-accent/10 text-accent' : 'border-border-dim text-text-ghost hover:border-border-hi'
               }`}
             >
               <Bold size={16} />
               <span className="text-[10px] font-bold">Bold</span>
             </button>
             <button 
               onClick={() => updateLocalStyles({ isItalic: !localStyles.isItalic })}
               className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all ${
                 localStyles.isItalic ? 'border-accent bg-accent/10 text-accent' : 'border-border-dim text-text-ghost hover:border-border-hi'
               }`}
             >
               <Italic size={16} />
               <span className="text-[10px] font-bold">Italic</span>
             </button>
          </div>
        </div>

        {/* Global Show Info */}
        <div className="space-y-4 pt-4 border-t border-white/5 opacity-50 grayscale select-none pointer-events-none">
          <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest flex items-center gap-2">
            Show Metadata
          </label>
          <div className="space-y-2">
             <div className="text-[10px] font-bold text-text-ghost">TITLE</div>
             <div className="text-xs text-text-hi truncate">{draftShow?.title}</div>
          </div>
          <div className="space-y-2">
             <div className="text-[10px] font-bold text-text-ghost">ARTIST</div>
             <div className="text-xs text-text-hi truncate">{draftShow?.artist || 'Unknown'}</div>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="p-4 bg-bg-base/50 border-t border-border-dim space-y-3">
        <button 
          onClick={handleExit}
          className="w-full py-3 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-hi transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-[0.98]"
        >
          <Undo2 size={14} /> Exit Editor
        </button>
      </div>
    </div>
  )
}
