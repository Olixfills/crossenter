import { useState, useEffect, useCallback, useRef } from "react";
import {
  Image as ImageIcon,
  Video,
  RefreshCw,
  Plus,
  Layers,
  Music,
  FileText,
  Link as LinkIcon,
  Upload,
  Globe,
  Trash2,
  CheckCircle2,
  FolderPlus,
  PlayCircle,
  X,
  Info,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { usePresentationStore } from "../../data/presentationStore";
import { useUIStore } from "../../data/store";
import AddLinkModal from "./AddLinkModal";

// --- Sub-component: Media Card ---
function MediaCard({
  item,
  isSelected,
  onClick,
  onDoubleClick,
}: {
  item: any;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `lib-media-${item.id}`,
      data: {
        type: "library",
        item: {
          id: `media-${item.id}`,
          title: item.name,
          type: "media",
          metadata: {
            url: item.url,
            mediaType: item.type,
            path: item.file_path_or_url,
          },
        },
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`group flex flex-col gap-2 relative transition-all active:scale-[0.98] cursor-grab ${isDragging ? "opacity-40" : ""}`}
    >
      <div
        className={`aspect-video rounded-xl bg-bg-surface border flex items-center justify-center overflow-hidden transition-all duration-300 relative shadow-sm ${
          isSelected
            ? "border-accent ring-2 ring-accent/20 shadow-lg shadow-accent/10"
            : "border-border-dim/50 hover:border-accent/50"
        }`}
      >
        <div className="absolute inset-0 bg-bg-base/5" />

        {item.type === "image" ? (
          <img
            src={item.url}
            className="w-full h-full object-cover"
            alt={item.name}
          />
        ) : item.type === "video" ? (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => {
              const v = e.target as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
        ) : (
          <div
            className={`flex flex-col items-center gap-3 opacity-40 transition-all duration-500 ${isSelected ? "text-accent opacity-100" : ""}`}
          >
            {item.type === "audio" ? (
              <Music size={24} />
            ) : item.type === "pdf" ? (
              <FileText size={24} />
            ) : (
              <LinkIcon size={24} />
            )}
          </div>
        )}

        {/* Small Type Badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[8px] font-black uppercase text-white/80 border border-white/5">
          {item.type}
        </div>

        {isSelected && (
          <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
        )}
      </div>
      <div
        className={`text-[10px] font-bold truncate px-1 transition-colors uppercase tracking-wider text-center ${isSelected ? "text-accent font-black" : "text-text-lo"}`}
      >
        {item.name}
      </div>
    </div>
  );
}

// --- Sub-component: Preview Panel ---
function PreviewPanel({
  item,
  onClose,
  onPresentNow,
  onSetBackground,
  onDelete,
}: {
  item: any | null;
  onClose: () => void;
  onPresentNow: (it: any) => void;
  onSetBackground: (it: any, ctx: "scripture" | "show") => void;
  onDelete: (it: any) => void;
}) {
  if (!item) return null;

  return (
    <aside className="w-72 border-l border-border-dim/50 bg-bg-base/30 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 shadow-2xl z-20 overflow-hidden">
      {/* 1. Header (Fixed) */}
      <div className="px-3 border-b border-border-dim/30 flex items-center justify-between bg-bg-base/80 shrink-0 absolute z-10 right-0 ">
        <button
          onClick={onClose}
          className="p-1 hover:bg-bg-hover rounded-md text-text-ghost hover:text-text-hi transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Fixed Preview Area */}
      <div className="p-3 shrink-0 bg-black/20 border-b border-border-dim/10">
        <div className="aspect-video rounded-lg bg-black overflow-hidden shadow-inner border border-white/5 relative group">
          {item.type === "image" ? (
            <img
              src={item.url}
              className="w-full h-full object-contain"
              alt={item.name}
            />
          ) : item.type === "video" ? (
            <video
              src={item.url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-accent/20 bg-bg-surface">
              {item.type === "audio" ? (
                <Music size={32} />
              ) : item.type === "pdf" ? (
                <FileText size={32} />
              ) : (
                <LinkIcon size={32} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Scrollable Metadata Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {/* 3. Actions Section (Fixed - Prioritized) */}
        <div className="p-3 shrink-0 space-y-3 bg-accent/5 border-b border-border-dim/10">
          <div className="space-y-2">
            <h4 className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">
              Quick Actions
            </h4>
            <button
              onClick={() => onPresentNow(item)}
              className="w-full py-1.5 bg-accent hover:bg-accent-hi text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 active:scale-95"
            >
              <PlayCircle size={12} strokeWidth={3} />
              Present Now
            </button>

            {/* <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => onSetBackground(item, "scripture")}
                className="py-1.5 bg-blue-600/10 border border-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
              >
                <ImageIcon size={10} />
                <span>Scripture bg</span>
              </button>
              <button
                onClick={() => onSetBackground(item, "show")}
                className="py-1.5 bg-purple-600/10 border border-purple-600/30 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={10} />
                <span>Show bg</span>
              </button>
            </div> */}
            {/* 5. Danger Zone (Fixed) */}
            <button
              onClick={() => onDelete(item)}
              className="w-full py-1.5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 size={10} />
              Delete Resource
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-[8px] font-black text-text-ghost uppercase tracking-[0.2em] border-b border-border-dim/10 pb-1">
            Media Info
          </h4>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-text-ghost">Name</span>
              <span className="text-text-hi truncate max-w-[140px]">
                {item.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-text-ghost">Type</span>
              <span className="text-accent uppercase">{item.type}</span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold">
              <span className="text-text-ghost">Added</span>
              <span className="text-text-lo">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function MediaView({ searchQuery }: { searchQuery: string }) {
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const { setAddLinkModalOpen } = useUIStore();
  const { setBackgroundMedia, setActiveShow, setLiveSlideId } =
    usePresentationStore();

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await window.crossenter.getAllMedia(activeCategory);
      setMedia(records);
    } catch (e) {
      console.error("Failed to load media:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // --- Handlers ---
  const handleManualUpload = async () => {
    setIsDropdownOpen(false); // close first so the menu unmounts cleanly
    try {
      const filePaths = await window.crossenter.openMediaDialog();
      if (filePaths && filePaths.length > 0) {
        setIsLoading(true);
        await window.crossenter.importMediaFiles(filePaths);
        loadMedia();
      }
    } catch (err) {
      console.error("Failed to upload media:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      confirm(
        `Delete "${item.name}"? This will also remove the file from managed storage.`,
      )
    ) {
      await window.crossenter.deleteMedia(
        item.id,
        item.file_path_or_url,
        item.type === "link",
      );
      if (selectedItem?.id === item.id) setSelectedItem(null);
      loadMedia();
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).map((f) => f.path);
    if (files.length > 0) {
      setIsLoading(true);
      await window.crossenter.importMediaFiles(files);
      loadMedia();
    }
  };

  const presentNow = useCallback(
    (item: any) => {
      // Create virtual show for immediate presentation
      const virtualShow: any = {
        id: `media-${item.id}`,
        title: item.name,
        type: "media",
        content: [
          {
            id: `media-slide-${item.id}`,
            type: "media",
            text: "",
            label: item.name,
            media_url: item.url,
            media_type: item.type,
          },
        ],
      };
      setActiveShow(virtualShow);
      setLiveSlideId(`media-slide-${item.id}`);
    },
    [setActiveShow, setLiveSlideId],
  );

  const formattedMedia = media.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filterCategories = [
    { id: "all", label: "All Media", icon: <Layers size={14} /> },
    { id: "image", label: "Images", icon: <ImageIcon size={14} /> },
    { id: "video", label: "Videos", icon: <Video size={14} /> },
    { id: "link", label: "Links", icon: <LinkIcon size={14} /> },
    { id: "audio", label: "Audio", icon: <Music size={14} /> },
    { id: "pdf", label: "PDFs", icon: <FileText size={14} /> },
  ];

  return (
    <div className="flex flex-1 min-h-0 bg-bg-base/20 border-t border-border-dim/50 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-48 border-r border-border-dim/50 bg-bg-base/40 flex flex-col shrink-0">
        <div className="p-3 border-b border-border-dim/20 flex items-center justify-between">
          <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-ghost">
            Collections
          </h2>
          <button
            onClick={loadMedia}
            className={`p-1 text-text-ghost hover:text-accent transition-all ${isLoading ? "animate-spin" : "hover:rotate-180"}`}
          >
            <RefreshCw size={10} />
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-0.5 px-2">
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all group relative ${
                  activeCategory === cat.id
                    ? "bg-accent/10 text-accent font-black"
                    : "text-text-lo hover:bg-bg-hover hover:text-text-hi"
                }`}
              >
                <div
                  className={`transition-colors ${activeCategory === cat.id ? "text-accent" : "text-text-ghost group-hover:text-text-lo"}`}
                >
                  {cat.icon}
                </div>
                <span>{cat.label}</span>
                {activeCategory === cat.id && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-accent animate-in fade-in slide-in-from-left-1 duration-300" />
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-border-dim/20">
          <button className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border-dim/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-text-ghost hover:border-accent hover:text-accent hover:bg-accent/5 transition-all group">
            <FolderPlus
              size={12}
              className="group-hover:scale-110 transition-transform"
            />
            Add Folder
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-base/5">
        {/* Compact Header bar */}
        <header className="flex items-center justify-between px-6 py-1 border-b border-border-dim/30 bg-bg-base/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-hi">
              {filterCategories.find((c) => c.id === activeCategory)?.label}
            </h1>
            <div className="w-px h-4 bg-border-dim/30" />
            <span className="text-[9px] font-bold text-text-ghost uppercase tracking-wider">
              {media.length} Items
            </span>
            {isLoading && (
              <RefreshCw size={12} className="animate-spin text-accent" />
            )}
          </div>

          <div className="flex items-center gap-2" ref={dropdownRef}>
            <button
              onClick={() => handleManualUpload()}
              className="w-[150px] flex items-center gap-3 px-4 py-1 text-[11px] text-text-lo hover:bg-bg-hover hover:text-text-hi transition-colors text-left font-bold cursor-pointer active:bg-accent/10"
            >
              <Upload size={14} className="text-accent" />
              Import locally
            </button>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setAddLinkModalOpen(true);
              }}
              className="w-[150px] flex items-center gap-3 px-4 py-1 text-[11px] text-text-lo hover:bg-bg-hover hover:text-text-hi transition-colors text-left font-bold cursor-pointer active:bg-accent/10"
            >
              <Globe size={14} className="text-blue-500" />
              Internet Link
            </button>
          </div>
        </header>

        {/* Layout split: Grid + Preview */}
        <div className="flex-1 flex min-h-0 relative">
          <div
            className={`flex-1 overflow-hidden relative transition-colors duration-300 ${isDragging ? "bg-accent/5" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-8 pointer-events-none animate-in fade-in duration-200">
                <div className="w-full h-full border-2 border-dashed border-accent/30 rounded-[2rem] bg-accent/5 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <Upload size={32} className="text-accent animate-bounce" />
                  <h3 className="text-lg font-black text-accent uppercase tracking-widest">
                    Import Resources
                  </h3>
                </div>
              </div>
            )}

            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
              {formattedMedia.length === 0 && !isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-text-ghost/20">
                  <Layers size={48} strokeWidth={1} className="mb-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Library Empty
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                  {formattedMedia.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => presentNow(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Inspector */}
          {selectedItem && (
            <PreviewPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onPresentNow={presentNow}
              onSetBackground={(it, ctx) =>
                setBackgroundMedia(
                  {
                    name: it.name,
                    path: it.file_path_or_url,
                    url: it.url,
                    type: it.type,
                  },
                  ctx,
                )
              }
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <AddLinkModal onAdded={loadMedia} />
    </div>
  );
}
