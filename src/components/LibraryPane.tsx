import { useState } from "react";
import { 
  Music, 
  BookOpen, 
  Film, 
  Layers, 
  Volume2, 
  Layout, 
  PlaySquare, 
  Radio,
  Search,
  Palette,
  Calendar
} from "lucide-react";
import ShowsView from "./library/ShowsView";
import ScriptureView from "./library/ScriptureView";
import MediaView from "./library/MediaView";
import PlaylistsView from "./library/PlaylistsView";
import StyleEditor from "./library/StyleEditor";
import PlaceholderView from "./library/PlaceholderView";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Library Pane
// Spans full width of Left and Center sections.
// ─────────────────────────────────────────────────────────────────────────────

type LibraryTab =
  | "Shows"
  | "Scripture"
  | "Playlists"
  | "Media"
  | "Style"
  | "Overlays"
  | "Audio"
  | "Templates"
  | "Player"
  | "Live";

const LIBRARY_TABS: LibraryTab[] = [
  "Shows",
  "Scripture",
  "Playlists",
  "Media",
  "Style",
  "Overlays",
  "Audio",
  "Templates",
  "Player",
  "Live",
];

const TAB_ICONS: Record<LibraryTab, any> = {
  Shows: Music,
  Scripture: BookOpen,
  Playlists: Calendar,
  Media: Film,
  Style: Palette,
  Overlays: Layers,
  Audio: Volume2,
  Templates: Layout,
  Player: PlaySquare,
  Live: Radio,
};

export default function LibraryPane() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("Shows");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full bg-bg-raised border-t border-border-dim overflow-hidden">
      {/* ── Tab Bar ─────────────────────────── */}
      <div className="flex items-center gap-4 px-4 border-b border-border-dim bg-bg-base/50 shrink-0 h-11">
        {/* Scrollable Tabs */}
        <div className="flex-1 flex items-center gap-1 no-drag overflow-x-auto custom-scrollbar-purple h-full">
          {LIBRARY_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 h-full text-[13px] font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "text-accent border-accent bg-accent/5"
                    : "text-text-ghost border-transparent hover:text-text-lo hover:bg-bg-hover"
                }`}
              >
                <Icon size={14} strokeWidth={2.5} className={activeTab === tab ? "text-accent" : "text-text-ghost"} />
                {tab}
              </button>
            );
          })}
        </div>

        {/* Pinned Search */}
        <div className="w-64 pl-4 py-1.5 shrink-0 border-l border-border-dim/30">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-dim focus-within:border-accent transition-all shadow-inner">
            <Search size={14} className="text-text-ghost" strokeWidth={2.5} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-text-lo placeholder-text-ghost outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Contextual View Dispatcher ────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {activeTab === "Shows" && <ShowsView searchQuery={searchQuery} />}
        {activeTab === "Scripture" && <ScriptureView searchQuery={searchQuery} />}
        {activeTab === "Playlists" && <PlaylistsView searchQuery={searchQuery} />}
        {activeTab === "Media" && <MediaView searchQuery={searchQuery} />}
        {activeTab === "Style" && <StyleEditor />}
        
        {/* Placeholder for other tabs */}
        {activeTab === "Overlays" && <PlaceholderView title="Overlays" icon={Layers} />}
        {activeTab === "Audio" && <PlaceholderView title="Audio" icon={Volume2} />}
        {activeTab === "Templates" && <PlaceholderView title="Templates" icon={Layout} />}
        {activeTab === "Player" && <PlaceholderView title="Music Player" icon={PlaySquare} />}
        {activeTab === "Live" && <PlaceholderView title="Live Streams" icon={Radio} />}
      </div>
    </div>
  );
}
