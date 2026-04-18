import { useUIStore, AppMode } from "../data/store";
import { usePresentationStore } from "../data/presentationStore";
import { useEditorStore } from "../data/editorStore";
import { useState } from "react";
import logo from "../assets/logo.png";
import {
  Play,
  PenTool,
  Monitor,
  Palette,
  Calendar,
  Settings,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Top Navigation Bar
// Spans full width above the 3-pane layout.
// ─────────────────────────────────────────────────────────────────────────────

const MODES: AppMode[] = ["Show", "Edit", "Stage", "Draw", "Calendar"];
const MENUS = ["File", "Edit", "View", "Tools", "Help"];

const ModeIcons: Record<string, any> = {
  Show: Play,
  Edit: PenTool,
  Stage: Monitor,
  Draw: Palette,
  Calendar: Calendar,
};

export default function TopNav() {
  const { activeMode, setActiveMode } = useUIStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <header
      className="drag-region flex items-center h-11 px-4 gap-2 shrink-0"
      style={{ background: "#16161b", borderBottom: "1px solid #2a2a34" }}
    >
      {/* ── Traffic-light spacer (macOS) ─────── */}
      <div className="w-16 shrink-0" />

      {/* ── App Logo + Title ─────────────────── */}
      <div className="no-drag flex items-center gap-2 mr-3 group cursor-default">
        <img
          src={logo}
          alt="Crossenter Logo"
          className="w-7 h-7 object-contain drop-shadow-md brightness-110 group-hover:scale-110 transition-transform duration-200"
        />
        <span className="text-sm font-bold text-text-hi tracking-tight">
          Crossenter
        </span>
      </div>

      {/* ── App menus ────────────────────────── */}
      {/* <nav className="no-drag flex items-center gap-0.5">
        {MENUS.map(menu => (
          <button
            key={menu}
            onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
            className={`px-2.5 py-1 rounded text-xs transition-all duration-100 cursor-pointer ${
              activeMenu === menu
                ? 'bg-bg-surface text-text-hi'
                : 'text-text-lo hover:text-text-hi hover:bg-bg-hover'
            }`}
          >
            {menu}
          </button>
        ))}
      </nav> */}

      {/* ── Spacer ───────────────────────────── */}
      <div className="flex-1" />

      {/* ── Mode toggles (centered) ──────────── */}
      <div className="no-drag flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {MODES.map((mode) => {
          const Icon = ModeIcons[mode];
          return (
            <button
              key={mode}
              onClick={() => {
                if (mode === "Edit") {
                  const activeShow = usePresentationStore.getState().activeShow;
                  const slides = usePresentationStore.getState().slides;
                  if (activeShow) {
                    useEditorStore.getState().setDraftShow(activeShow, slides);
                  }
                }
                setActiveMode(mode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                activeMode === mode
                  ? "bg-bg-surface text-accent border border-border-accent shadow-accent-sm"
                  : "text-text-lo hover:text-text-hi hover:bg-bg-hover"
              }`}
            >
              <Icon size={13} strokeWidth={activeMode === mode ? 3 : 2} />
              {mode}
            </button>
          );
        })}
      </div>

      {/* ── Spacer ───────────────────────────── */}
      <div className="flex-1" />

      {/* ── Status indicators ────────────────── */}
      <div className="no-drag flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-2xs text-text-lo">LIVE</span>
        </div>

        {/* Output status */}
        <div className="text-2xs text-text-ghost font-mono">1920 × 1080</div>

        {/* Settings button */}
        <button className="no-drag w-7 h-7 flex items-center justify-center rounded-md text-text-ghost hover:text-text-lo hover:bg-bg-hover transition-all duration-100 cursor-pointer">
          <Settings size={14} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
