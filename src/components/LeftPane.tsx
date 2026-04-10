import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpen,
  Layout,
  Music,
  PlayCircle,
  Save,
  Theater,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { usePresentationStore } from "../data/presentationStore";
import { useUIStore } from "../data/store";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Left Pane (Playlist)
// ─────────────────────────────────────────────────────────────────────────────

const TypeIcons: Record<string, any> = {
  song: Music,
  scripture: BookOpen,
  media: PlayCircle,
  presentation: Layout,
  recital: Theater,
};

const TypeColors: Record<string, string> = {
  song: "bg-purple-900/50 text-purple-300",
  scripture: "bg-blue-900/50 text-blue-300",
  media: "bg-slate-700/70 text-slate-300",
  presentation: "bg-amber-900/50 text-amber-300",
};

function SortablePlaylistRow({ item, index }: { item: any; index: number }) {
  const { setActiveShow, activeShow, removePlaylistItem } =
    usePresentationStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const isActive =
    item.type === "song"
      ? activeShow?.id === item.reference_id
      : activeShow?.id === `virtual-${item.id}`;

  const handleClick = async () => {
    if (item.type === "song" && item.reference_id) {
      const fullShow = await window.crossenter.getShowWithSlides(item.reference_id);
      if (fullShow) {
        setActiveShow(fullShow);
      }
    } else if (item.type === "scripture" && item.metadata) {
      const { bookId, chapter, verseIds } = item.metadata;
      if (bookId && chapter && verseIds) {
        const allVerses = await window.crossenter.getVerses(bookId, chapter);
        const filtered = allVerses.filter((v: any) => verseIds.includes(v.id));

        const virtualShow: any = {
          id: `virtual-${item.id}`,
          title: item.title,
          type: "scripture",
          content: filtered.map((v: any) => ({
            id: `verse-${v.id}`,
            text: v.text,
            label: item.title,
          })),
        };
        setActiveShow(virtualShow);
      }
    } else if (item.type === "media" && item.metadata) {
      const virtualShow: any = {
        id: `virtual-${item.id}`,
        title: item.title,
        type: "media",
        content: [{
          id: `media-slide-${item.id}`,
          type: "media",
          text: "",
          label: item.title,
          media_url: item.metadata.url,
          media_type: item.metadata.mediaType
        }],
      };
      setActiveShow(virtualShow);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removePlaylistItem(item.id);
  };

  const Icon = TypeIcons[item.type] || Music;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2 rounded-md transition-all relative ${
        isActive
          ? "bg-bg-active border-l-2 border-accent text-accent"
          : "text-text-lo hover:bg-bg-hover"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer"
        onClick={handleClick}
      >
        <span className="text-text-ghost text-[9px] w-4 shrink-0 font-mono opacity-50">
          {index + 1}
        </span>
        <Icon
          size={13}
          strokeWidth={2.5}
          className={`shrink-0 ${isActive ? "text-accent" : "text-text-ghost"}`}
        />
        <span
          className={`flex-1 text-xs truncate ${isActive ? "font-bold" : ""}`}
        >
          {item.title || "Untitled"}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter opacity-80 ${TypeColors[item.type] || "bg-bg-base/50"}`}
        >
          {item.type}
        </span>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-text-ghost transition-all"
        >
          <Trash2 size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function PlaylistView() {
  const { playlistItems, activePlaylist, renameActivePlaylist } =
    usePresentationStore();
  const { setSavePlaylistModalOpen } = useUIStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleStartEdit = () => {
    if (activePlaylist) {
      setTempName(activePlaylist.name);
      setIsEditingName(true);
    }
  };

  const handleFinishEdit = async () => {
    if (tempName.trim() && tempName !== activePlaylist?.name) {
      await renameActivePlaylist(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-3 bg-bg-base/30 shrink-0 border-b border-border-dim/30">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-accent rounded-sm shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
            <span className="text-[10px] font-black text-text-hi uppercase tracking-[0.2em]">
              Playlist
            </span>
          </div>
        </div>

        <button
          onClick={() => setSavePlaylistModalOpen(true)}
          title="Save as Preparation (Cmd+S)"
          className="p-1 px-2 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
        >
          <PlayCircle size={12} strokeWidth={2.5} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Save
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5 custom-scrollbar">
        <SortableContext
          items={playlistItems.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {playlistItems.map((item, i) => (
            <SortablePlaylistRow key={item.id} item={item} index={i} />
          ))}
        </SortableContext>

        {playlistItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-10">
            <div className="text-4xl mb-3">📂</div>
            <div className="text-[10px] uppercase font-black tracking-[0.3em]">
              Session Empty
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-bg-base/40 border-t border-border-dim group cursor-pointer" onClick={handleStartEdit}>
        <div className="flex items-center justify-between text-[9px] text-text-ghost font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span>{playlistItems.length} Entries</span>
            {isEditingName ? (
               <input
                autoFocus
                className="bg-bg-surface border border-accent/50 rounded px-1.5 py-0.5 text-[8px] font-bold text-accent outline-none"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleFinishEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishEdit();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
              />
            ) : (
              playlistItems.length > 0 && activePlaylist?.name && (
                <span className="text-accent/60 group-hover:text-accent transition-colors flex items-center gap-1">
                   • {activePlaylist.name}
                   <span className="opacity-0 group-hover:opacity-100 text-[8px]"> (Rename)</span>
                </span>
              )
            )}
          </div>
          <span className="opacity-40">Live Feed</span>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-20 select-none grayscale">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.4em]">
        {title}
      </div>
    </div>
  );
}

export default function LeftPane() {
  const { activeMode, leftPaneWidth } = useUIStore();

  return (
    <aside
      className="flex flex-col h-full bg-bg-raised border-r border-border-dim shrink-0 overflow-hidden relative"
      style={{ width: leftPaneWidth }}
    >
      {activeMode === "Show" && <PlaylistView />}
      {activeMode !== "Show" && (
        <PlaceholderView
          title={activeMode}
          icon={
            activeMode === "Edit"
              ? "📡"
              : activeMode === "Stage"
                ? "🖥"
                : activeMode === "Draw"
                  ? "🥞"
                  : "📅"
          }
        />
      )}
    </aside>
  );
}
