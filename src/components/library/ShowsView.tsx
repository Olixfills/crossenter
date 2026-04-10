import { useState, useEffect } from "react";
import {
  type Show,
  type Category,
} from "../../data/placeholders";
import { usePresentationStore } from "../../data/presentationStore";
import { useUIStore } from "../../data/store";
import { useEditorStore } from "../../data/editorStore";
import { useDraggable } from "@dnd-kit/core";

import { 
  Music, 
  BookOpen, 
  PlaySquare, 
  Layout, 
  BarChart, 
  Theater 
} from "lucide-react";

// Icon map
const TypeIcons: Record<string, any> = {
  song: Music,
  scripture: BookOpen,
  media: PlaySquare,
  template: Layout,
  presentation: BarChart,
  recital: Theater,
};

interface ShowsViewProps {
  searchQuery: string;
}

// ── Sub-component: Draggable Row ────────────────────
function DraggableShowRow({ 
  item, 
  isActive, 
  onClick, 
  onDoubleClick 
}: { 
  item: Show; 
  isActive: boolean; 
  onClick: () => void; 
  onDoubleClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-show-${item.id}`,
    data: {
      type: 'library',
      item: {
        ...item,
        type: item.type || 'song'
      }
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`flex items-center justify-between px-4 py-2.5 border-b border-border-dim/30 transition-colors text-left group ${
        isActive ? "bg-accent/10" : "hover:bg-bg-hover"
      } ${isDragging ? "opacity-40 cursor-grabbing" : "cursor-grab"}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-text-ghost text-sm">
          {(() => {
            const Icon = TypeIcons[item.type] || Music;
            return <Icon size={14} strokeWidth={2.5} className="shrink-0" />;
          })()}
        </span>
        <div className="truncate">
          <div
            className={`text-xs truncate ${isActive ? "text-accent font-semibold" : "text-text-lo"}`}
          >
            {item.title}
          </div>
        </div>
      </div>
      <span className="text-2xs text-text-ghost italic shrink-0 font-mono">
         {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
      </span>
    </button>
  );
}

// ── Sub-component: Metadata Panel ────────────────────
function MetadataPanel({ item, onEdit, onDelete }: { item: Show | null; onEdit: (s: Show) => void; onDelete: (id: number) => void }) {
  if (!item) {
    return (
      <div className="w-72 border-l border-border-dim bg-bg-base/20 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-border-dim/30 flex items-center justify-center text-text-ghost mb-2 animate-pulse">
           <Music size={20} strokeWidth={1.5} />
        </div>
        <p className="text-2xs text-text-ghost font-bold uppercase tracking-widest opacity-40">
          Inspector Standby
        </p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border-dim bg-bg-base/20 flex flex-col overflow-y-auto custom-scrollbar shadow-2xl z-10">
      <div className="p-6 flex flex-col items-center text-center border-b border-border-dim/50 bg-bg-base/40">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-lg shadow-accent/10">
           {(() => {
             const Icon = TypeIcons[item.type] || Music;
             return <Icon size={24} strokeWidth={2} />;
           })()}
        </div>
        <h3 className="text-sm font-black text-text-hi mb-1 tracking-tight">{item.title}</h3>
        <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] opacity-80">{item.artist || 'Independent Artist'}</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-text-ghost uppercase tracking-widest border-b border-border-dim/30 pb-1">Primary Info</h4>
          <div className="grid grid-cols-2 gap-y-3 text-[10px] font-bold">
            <span className="text-text-ghost">Type</span>
            <span className="text-text-lo text-right capitalize">{item.type}</span>

            <span className="text-text-ghost">Author</span>
            <span className="text-text-lo text-right truncate">{(item as any).author || '—'}</span>

            <span className="text-text-ghost">CCLI #</span>
            <span className="text-text-lo text-right">{(item as any).ccli || '—'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-text-ghost uppercase tracking-widest border-b border-border-dim/30 pb-1">Musicality</h4>
          <div className="grid grid-cols-2 gap-y-3 text-[10px] font-bold">
            <span className="text-text-ghost">Scale/Key</span>
            <span className="text-accent text-right">{(item as any).key || '—'}</span>

            <span className="text-text-ghost">Tempo</span>
            <span className="text-accent text-right">{(item as any).tempo ? `${(item as any).tempo} BPM` : '—'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-text-ghost uppercase tracking-widest border-b border-border-dim/30 pb-1">Structure</h4>
          <div className="grid grid-cols-2 gap-y-3 text-[10px] font-bold">
            <span className="text-text-ghost">Slides</span>
            <span className="text-text-lo text-right">{item.content?.length || 0}</span>
            <span className="text-text-ghost">Added</span>
            <span className="text-text-lo text-right truncate">
               {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 flex flex-col gap-3 bg-bg-base/40 border-t border-border-dim/50">
        <button 
          onClick={() => onEdit(item)}
          className="w-full py-2.5 rounded-xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent-hi transition-all shadow-lg shadow-accent/20 active:scale-95 flex items-center justify-center gap-2"
        >
          Edit Slides
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          Delete Permanently
        </button>
      </div>
    </div>
  );
}

export default function ShowsView({ searchQuery }: ShowsViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  
  const { 
    activeShow, 
    setActiveShow, 
    setLiveSlideId 
  } = usePresentationStore();

  const {
    setNewShowModalOpen,
    setNewShowStep
  } = useUIStore();

  useEffect(() => {
    loadContent();
  }, [activeCategoryId]);

  useEffect(() => {
    // Listen for background updates (e.g. from NewShowModal)
    const unbind = window.crossenter.onShowsUpdated(() => {
      loadContent();
    });
    return () => unbind();
  }, []);

  const loadContent = async () => {
    try {
      const cats = await window.crossenter.getCategories('show');
      const filteredShows: any[] = await window.crossenter.getShows(activeCategoryId || undefined);
      
      setCategories(cats);
      setShows(filteredShows);
    } catch (err) {
      console.error("Failed to load shows:", err);
    }
  };

  const filtered = shows.filter((i) => {
    return i.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleShowClick = async (item: Show) => {
    // Fetch full show with slides for active state
    const fullShow = await window.crossenter.getShowWithSlides(item.id);
    setActiveShow(fullShow);
  };

  const handleShowDoubleClick = async (item: Show) => {
    const fullShow = await window.crossenter.getShowWithSlides(item.id);
    setActiveShow(fullShow);
    if (fullShow.content?.length > 0) {
      setLiveSlideId(fullShow.content[0].id);
    }
  };

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleOpenNewShowModal = () => {
    setNewShowStep('setup');
    setNewShowModalOpen(true);
  };

  const { setActiveMode } = useUIStore();
  const { setDraftShow } = useEditorStore();

  const handleEditShow = async (item: Show) => {
    const fullShow = await window.crossenter.getShowWithSlides(item.id);
    setDraftShow(fullShow, fullShow.content || []);
    setActiveMode('Edit');
  };

  const handleDeleteShow = async (id: number) => {
    if (confirm("Are you sure you want to delete this show permanently? This action cannot be undone.")) {
      try {
        await window.crossenter.deleteShow(id);
        if (activeShow?.id === id) setActiveShow(null);
        loadContent();
      } catch (err) {
        console.error("Failed to delete show:", err);
      }
    }
  };

  const handleAddCategorySubmit = async () => {
    if (!newCategoryName.trim()) {
      setIsAddingCategory(false);
      return;
    }
    await window.crossenter.addCategory({ name: newCategoryName.trim(), type: 'show' });
    setNewCategoryName("");
    setIsAddingCategory(false);
    loadContent();
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCategorySubmit();
    if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName("");
    }
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-52 border-r border-border-dim bg-bg-base/30 flex flex-col shrink-0">
        <div className="p-3 text-[10px] font-black text-text-ghost uppercase tracking-widest border-b border-border-dim/50 flex justify-between items-center">
          Categories
        </div>
        <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs transition-all hover:bg-bg-hover ${
              activeCategoryId === null ? "text-accent font-bold bg-accent/5" : "text-text-lo"
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${activeCategoryId === null ? 'bg-accent' : 'bg-text-ghost/20'}`} />
            All Shows
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-xs transition-all hover:bg-bg-hover ${
                activeCategoryId === cat.id
                  ? "text-accent font-bold bg-accent/5"
                  : "text-text-lo"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeCategoryId === cat.id ? 'bg-accent' : 'bg-text-ghost/20'}`} />
              {cat.name}
            </button>
          ))}

          {/* Inline Add Input */}
          {isAddingCategory && (
            <div className="px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
               <input 
                autoFocus
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                onBlur={handleAddCategorySubmit}
                placeholder="Category name..."
                className="w-full bg-bg-surface border border-accent/50 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]"
               />
            </div>
          )}
        </div>
        <div className="p-2 border-t border-border-dim/50">
          {!isAddingCategory ? (
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="w-full py-1.5 text-[10px] font-bold text-text-ghost hover:text-accent uppercase tracking-tighter transition-colors flex items-center justify-center gap-2 bg-bg-surface/50 rounded border border-border-dim/30"
            >
              <span>+ New Category</span>
            </button>
          ) : (
            <div className="text-[9px] text-center text-text-ghost italic uppercase tracking-widest py-1.5">
              Press Enter to Save
            </div>
          )}
        </div>
      </aside>

      {/* LIST */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-base/10">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col">
            {filtered.map((item) => (
              <DraggableShowRow
                key={item.id}
                item={item}
                isActive={activeShow?.id === item.id}
                onClick={() => handleShowClick(item)}
                onDoubleClick={() => handleShowDoubleClick(item)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-text-ghost gap-2">
                <Music size={24} className="opacity-20" />
                <span className="text-xs italic">No shows found in this category</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer info for Shows */}
        <div className="px-4 py-2 flex items-center justify-between bg-bg-surface/40 text-[10px] font-bold text-text-ghost border-t border-border-dim shrink-0">
          <span className="uppercase tracking-widest">{filtered.length} items</span>
          <button 
            onClick={handleOpenNewShowModal} 
            className="bg-accent px-4 py-1 rounded-sm text-white hover:bg-accent-hi transition-all shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]"
          >
            + New Show
          </button>
        </div>
      </div>

      {/* METADATA */}
      <MetadataPanel 
        item={activeShow} 
        onEdit={handleEditShow}
        onDelete={handleDeleteShow}
      />
    </div>
  );
}
