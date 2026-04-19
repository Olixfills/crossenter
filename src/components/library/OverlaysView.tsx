import React, { useState, useEffect } from "react";
import {
  Square,
  Image as ImageIcon,
  Upload,
  Palette,
  Layers,
  Sparkles,
  Clock,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Trash2,
  Settings2,
  Bell,
} from "lucide-react";
import { usePresentationStore } from "../../data/presentationStore";
import { resolveMediaUrl } from "../../utils/url";

const PRESET_GRADIENTS = [
  "linear-gradient(to bottom, #1e1e24, #000000)",
  "linear-gradient(135deg, #1a0800, #0a0000)",
  "linear-gradient(160deg, #0f1c3d, #0a0a1a)",
  "radial-gradient(circle at center, #1e0a3c, #0a0012)",
  "linear-gradient(to right, #000000, #1a1a1a, #000000)",
];

const PRESET_COLORS = [
  "#000000",
  "#111111",
  "#1a1a24",
  "#0a0a12",
  "#ff0000",
  "#0000ff",
];

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

// Helper to resolve positioning for the preview canvas
function getPreviewPositionStyle(pos: string): string {
  switch (pos) {
    case "top-left":
      return "top-4 left-4 items-start text-left";
    case "top-center":
      return "top-4 left-1/2 -translate-x-1/2 items-center text-center";
    case "top-right":
      return "top-4 right-4 items-end text-right";
    case "center-left":
      return "top-1/2 -translate-y-1/2 left-4 items-start text-left";
    case "center":
      return "top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 items-center text-center";
    case "center-right":
      return "top-1/2 -translate-y-1/2 right-4 items-end text-right";
    case "bottom-left":
      return "bottom-4 left-4 items-start text-left";
    case "bottom-center":
      return "bottom-4 left-1/2 -translate-x-1/2 items-center text-center";
    case "bottom-right":
    default:
      return "bottom-4 right-4 items-end text-right";
  }
}

export default function OverlaysView() {
  const [activeSubTab, setActiveSubTab] = useState<
    "blank" | "logo" | "timer" | "safety" | "alerts"
  >("blank");
  const state = usePresentationStore();
  const { setBlankSetting, setOverlaySetting, toggleOverlay } = state;

  const handleImageSelect = async (settingKey: string) => {
    const paths = await window.crossenter.openMediaDialog();
    if (paths && paths.length > 0) {
      const imported = await window.crossenter.importMediaFiles(paths);
      if (imported && imported.length > 0) {
        await setOverlaySetting(settingKey, imported[0].file_path_or_url);
      }
    }
  };

  return (
    <div className="flex h-full bg-bg-raised overflow-hidden">
      {/* Sidebar Section (Compacted) */}
      <aside className="w-52 border-r border-border-dim bg-bg-base/30 flex flex-col shrink-0">
        <div className="p-3 text-[9px] font-bold text-text-ghost uppercase tracking-[0.2em] border-b border-border-dim/50 flex justify-between items-center bg-bg-base/20">
          Overlay Types
        </div>
        <nav className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          {[
            {
              id: "blank",
              label: "Blank Screen",
              icon: Square,
              active: state.isBlanked,
            },
            {
              id: "logo",
              label: "Logo Overlay",
              icon: ImageIcon,
              active: state.isLogoEnabled,
            },
            {
              id: "timer",
              label: "Quick Timer",
              icon: Clock,
              active: state.isTimerEnabled,
            },
            {
              id: "safety",
              label: "Safety Layer",
              icon: ShieldCheck,
              active: state.isSafetyEnabled,
            },
            {
              id: "alerts",
              label: "Alerts / Messages",
              icon: Bell,
              active: !!state.activeAlertText,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`
                w-full flex items-center justify-between px-4 py-2 text-[11px] transition-all hover:bg-bg-hover group
                ${activeSubTab === tab.id ? "text-accent font-bold bg-accent/5" : "text-text-lo"}
              `}
            >
              <div className="flex items-center gap-3">
                <tab.icon
                  size={13}
                  className={
                    activeSubTab === tab.id
                      ? "text-accent"
                      : "text-text-ghost opacity-40"
                  }
                />
                <span className="truncate">{tab.label}</span>
              </div>
              {tab.active && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area (Dual Pane) */}
      <main className="flex-1 bg-bg-base/10 px-6 py-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-8 h-full max-w-[1500px] overflow-hidden">
          {/* Config Column (Left) - Scrollable */}
          <div className="col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar-purple pr-4 pb-12 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Header Section (Compacted) */}
            <div className="flex items-center justify-between pb-4 border-b border-border-dim/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shadow-lg shadow-accent/5">
                  {activeSubTab === "blank" && (
                    <Square size={18} strokeWidth={2.5} />
                  )}
                  {activeSubTab === "logo" && (
                    <ImageIcon size={18} strokeWidth={2.5} />
                  )}
                  {activeSubTab === "timer" && (
                    <Clock size={18} strokeWidth={2.5} />
                  )}
                  {activeSubTab === "safety" && (
                    <ShieldCheck size={18} strokeWidth={2.5} />
                  )}
                  {activeSubTab === "alerts" && (
                    <Bell size={18} strokeWidth={2.5} />
                  )}
                </div>
                <div>
                  <h2 className="text-xs font-black text-text-hi uppercase tracking-widest capitalize">
                    {activeSubTab} Settings
                  </h2>
                  <p className="text-[10px] text-text-ghost font-bold opacity-50">
                    Configure global {activeSubTab} layer
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle Row (Compact) */}
            {activeSubTab !== "alerts" && (
              <div className="flex items-center gap-4 p-3 bg-bg-surface/30 rounded-2xl border border-border-dim/30">
                <button
                  onClick={() =>
                    activeSubTab === "blank"
                      ? state.toggleBlank()
                      : toggleOverlay(activeSubTab as any)
                  }
                  className={`
                    px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-md flex-1
                    ${
                      (
                        activeSubTab === "blank"
                          ? state.isBlanked
                          : (state as any)[
                              `is${activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)}Enabled`
                            ]
                      )
                        ? "bg-red-500 text-white shadow-red-500/20 active:scale-95"
                        : "bg-bg-base border border-border-dim text-text-ghost hover:border-accent hover:text-accent"
                    }
                  `}
                >
                  {(
                    activeSubTab === "blank"
                      ? state.isBlanked
                      : (state as any)[
                          `is${activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)}Enabled`
                        ]
                  )
                    ? "Active"
                    : "Enable Layer"}
                </button>
                <div className="text-[9px] text-text-ghost italic opacity-40 uppercase tracking-widest px-2 shrink-0">
                  Global State
                </div>
              </div>
            )}

            {/* Dynamic Content */}
            <div className="flex-1 space-y-6">
              {activeSubTab === "blank" && renderBlankConfig()}
              {activeSubTab === "logo" && renderLogoConfig()}
              {activeSubTab === "timer" && renderTimerConfig()}
              {activeSubTab === "safety" && renderSafetyConfig()}
              {activeSubTab === "alerts" && renderAlertsConfig()}
            </div>
          </div>

          {/* Preview Column (Right) - Fixed/Sticky */}
          <div className="col-span-4 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 sticky top-0 h-fit">
            <div className="flex items-center gap-2 mb-2">
              <Maximize2 size={12} className="text-accent" />
              <h3 className="text-[10px] font-black text-text-ghost uppercase tracking-widest">
                Live Integration Preview
              </h3>
            </div>

            {/* 16:9 Canvas Frame */}
            <div className="relative w-full aspect-video rounded-3xl border border-border-dim bg-black overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              {/* Simulated Content Background */}
              <div className="absolute inset-0 z-0 opacity-40">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center grayscale blur-md" />
              </div>

              {/* Safety Layer (Preview) */}
              {state.isSafetyEnabled &&
                state.safetyUrl &&
                activeSubTab !== "blank" && (
                  <div className="absolute inset-0 z-[5]">
                    <img
                      src={resolveMediaUrl(state.safetyUrl)}
                      className="w-full h-full object-cover"
                      alt="Safety"
                    />
                  </div>
                )}

              {/* Logo Layer (Preview) */}
              {state.isLogoEnabled &&
                state.logoUrl &&
                activeSubTab !== "blank" && (
                  <div
                    className={`absolute z-[110] transition-all duration-500 flex flex-col pointer-events-none ${state.logoIsFullScreen ? "inset-0 items-center justify-center p-0" : `p-4 ${getPreviewPositionStyle(state.logoPosition)}`}`}
                    style={
                      state.logoIsFullScreen ? { backgroundColor: "#000" } : {}
                    }
                  >
                    <img
                      src={resolveMediaUrl(state.logoUrl)}
                      style={
                        state.logoIsFullScreen
                          ? {
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              opacity: state.logoOpacity,
                            }
                          : {
                              width: `${state.logoScale * 0.8}px`, // Scaled for preview size
                              opacity: state.logoOpacity,
                            }
                      }
                      className="transition-all duration-500"
                      alt="Logo"
                    />
                  </div>
                )}

              {/* Timer Layer (Preview) */}
              {state.isTimerEnabled && activeSubTab !== "blank" && (
                <div
                  className={`absolute z-[105] p-6 flex flex-col pointer-events-none ${getPreviewPositionStyle(state.timerPosition)}`}
                >
                  <p
                    className="font-black tracking-tighter"
                    style={{
                      color: state.timerColor,
                      fontSize: `${state.timerFontSize / 2}px`,
                    }}
                  >
                    {state.timerMode === "clock" ? "10:45:00" : "00:04:32"}
                  </p>
                </div>
              )}

              {/* Alert Layer (Preview) */}
              {state.activeAlertText && (
                <div
                  className="absolute bottom-0 left-0 right-0 py-2 px-4 z-[150] overflow-hidden flex items-center"
                  style={{ backgroundColor: state.alertBgColor }}
                >
                  <div className="whitespace-nowrap animate-marquee flex items-center gap-4">
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: state.alertTextColor }}
                    >
                      {state.activeAlertText} • {state.activeAlertText} •{" "}
                      {state.activeAlertText}
                    </p>
                  </div>
                </div>
              )}

              {/* Blank Layer (Preview) */}
              <div
                className={`absolute inset-0 z-[200] transition-all duration-500 overflow-hidden ${state.isBlanked ? "opacity-100" : "opacity-0"}`}
                style={{
                  ...(state.globalBlankType === "color" && {
                    backgroundColor: state.globalBlankValue,
                  }),
                  ...(state.globalBlankType === "gradient" && {
                    backgroundImage: state.globalBlankValue,
                  }),
                }}
              >
                {state.globalBlankType === "image" && state.isBlanked && (
                  <img
                    src={resolveMediaUrl(state.globalBlankValue)}
                    className="w-full h-full object-cover"
                    alt="Blank"
                  />
                )}
              </div>

              {/* Placeholder Center Text (When not blanked) */}
              {!state.isBlanked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-20 pointer-events-none px-12">
                  <p className="text-white text-3xl font-black text-center leading-tight">
                    ACTIVE OUTPUT FEED STANDBY
                  </p>
                  <div className="w-16 h-1 mt-4 bg-accent/50 rounded-full" />
                </div>
              )}
            </div>

            {/* Feedback Context - Integrated into narrow column */}
            <div className="mt-2 p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4 shadow-sm ring-1 ring-white/5">
              <Settings2 size={16} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] leading-relaxed text-text-lo font-medium opacity-80">
                  Live view of active layers. Adjust positioning, scale, and
                  visuals to match your broadcast. Top toggles activate layers
                  globally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  function renderBlankConfig() {
    return (
      <div className="space-y-6 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "color", label: "Color", icon: Palette },
            { id: "gradient", label: "Gradient", icon: Sparkles },
            { id: "image", label: "Image", icon: ImageIcon },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() =>
                setBlankSetting("global_blank_type", type.id as any)
              }
              className={`
                flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all
                ${
                  state.globalBlankType === type.id
                    ? "bg-accent/10 border-accent shadow-accent-sm text-accent"
                    : "bg-bg-base/40 border-border-dim text-text-ghost font-medium hover:border-accent/40"
                }
              `}
            >
              <type.icon
                size={14}
                strokeWidth={state.globalBlankType === type.id ? 3 : 2}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {type.label}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {state.globalBlankType === "color" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    state.globalBlankValue.startsWith("#")
                      ? state.globalBlankValue
                      : "#000000"
                  }
                  onChange={(e) =>
                    setBlankSetting("global_blank_value", e.target.value)
                  }
                  className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={state.globalBlankValue}
                  onChange={(e) =>
                    setBlankSetting("global_blank_value", e.target.value)
                  }
                  className="flex-1 bg-bg-base border border-border-dim rounded-lg px-3 py-1.5 text-xs font-mono text-text-lo focus:border-accent outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBlankSetting("global_blank_value", c)}
                    className="w-6 h-6 rounded-full border border-white/5 shadow hover:scale-110 active:scale-90 transition-all"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {state.globalBlankType === "gradient" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <textarea
                value={state.globalBlankValue}
                onChange={(e) =>
                  setBlankSetting("global_blank_value", e.target.value)
                }
                rows={2}
                className="w-full bg-bg-base border border-border-dim rounded-xl px-4 py-3 text-[10px] font-mono text-text-lo focus:border-accent outline-none resize-none leading-relaxed"
              />
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setBlankSetting("global_blank_value", g)}
                    className={`
                      w-full h-8 rounded-lg border border-white/5 flex items-center px-3 hover:scale-[1.01] transition-all
                      ${state.globalBlankValue === g ? "border-accent ring-1 ring-accent/20" : ""}
                    `}
                    style={{ background: g }}
                  >
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                      Style {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.globalBlankType === "image" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => handleImageSelect("globalBlankValue")}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border-dim hover:border-accent/50 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 text-text-ghost group bg-bg-base/40"
              >
                <Upload
                  size={18}
                  className="group-hover:text-accent group-hover:translate-y-[-1px] transition-all"
                />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Import Asset
                </span>
              </button>
              {state.globalBlankValue &&
                state.globalBlankValue.includes("/") && (
                  <div className="flex items-center gap-2 p-2 bg-bg-base/50 rounded-lg border border-border-dim/50">
                    <ImageIcon size={10} className="text-text-ghost" />
                    <p className="text-[9px] font-bold text-text-lo truncate flex-1 uppercase tracking-tight">
                      {state.globalBlankValue.split("/").pop()}
                    </p>
                    <button
                      onClick={() =>
                        setBlankSetting("global_blank_value", "#000000")
                      }
                      className="text-text-ghost hover:text-red-500"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderLogoConfig() {
    return (
      <div className="space-y-6">
        <section className="space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Brand Identity
          </h3>
          <div className="flex gap-4">
            <div className="w-32 aspect-[4/3] rounded-xl border border-border-dim bg-bg-base overflow-hidden relative group shrink-0">
              {state.logoUrl ? (
                <>
                  <img
                    src={`crossenter://${state.logoUrl}`}
                    className="w-full h-full object-contain p-2"
                    alt="Logo"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={() => handleImageSelect("logoUrl")}
                      className="p-1.5 bg-accent text-white rounded-lg"
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleImageSelect("logoUrl")}
                  className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-text-ghost hover:bg-accent/5 transition-colors"
                >
                  <Upload size={16} />
                  <span className="text-[8px] font-bold uppercase">
                    PNG / SVG
                  </span>
                </button>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center gap-2">
              {/* Full Screen Toggle */}
              <div className="flex items-center justify-between p-2 bg-bg-base/40 rounded-lg border border-border-dim/50 mb-1">
                <span className="text-[9px] font-black text-text-ghost uppercase tracking-widest">
                  Full Screen Mode
                </span>
                <button
                  onClick={() =>
                    setOverlaySetting(
                      "logoIsFullScreen",
                      !state.logoIsFullScreen,
                    )
                  }
                  className={`w-8 h-4 rounded-full transition-all relative border ${state.logoIsFullScreen ? "bg-accent border-accent" : "bg-bg-base border-border-dim"}`}
                >
                  <div
                    className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-all duration-300 ${state.logoIsFullScreen ? "translate-x-[18px]" : "translate-x-[2px]"}`}
                  />
                </button>
              </div>

              <div
                className={`space-y-1.5 transition-opacity ${state.logoIsFullScreen ? "opacity-20 pointer-events-none" : ""}`}
              >
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest">
                    Scale Factor
                  </label>
                  <span className="text-[9px] font-mono text-accent">
                    {state.logoScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  value={state.logoScale}
                  onChange={(e) =>
                    setOverlaySetting("logoScale", Number(e.target.value))
                  }
                  className="w-full accent-accent h-1.5"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest">
                    Layer Alpha
                  </label>
                  <span className="text-[9px] font-mono text-accent">
                    {Math.round(state.logoOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={state.logoOpacity}
                  onChange={(e) =>
                    setOverlaySetting("logoOpacity", Number(e.target.value))
                  }
                  className="w-full accent-accent h-1.5"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className={`space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30 transition-opacity ${state.logoIsFullScreen ? "opacity-20 pointer-events-none" : ""}`}
        >
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Layout Anchoring
          </h3>
          <div className="grid grid-cols-3 gap-1.5 w-40 bg-bg-base/40 p-1.5 rounded-xl border border-border-dim/50 shadow-inner">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setOverlaySetting("logoPosition", pos)}
                className={`
                        aspect-square rounded-lg border transition-all flex items-center justify-center
                        ${
                          state.logoPosition === pos
                            ? "bg-accent border-accent shadow-lg text-white"
                            : "bg-bg-base/40 border-border-dim/50 text-text-ghost hover:border-accent/40"
                        }
                     `}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${state.logoPosition === pos ? "bg-white" : "bg-current opacity-10"}`}
                />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderTimerConfig() {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4">
          <div className="space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
            <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
              Timer Mode
            </h3>
            <div className="flex bg-bg-base border border-border-dim rounded-lg overflow-hidden p-1">
              <button
                onClick={() => setOverlaySetting("timerMode", "clock")}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${state.timerMode === "clock" ? "bg-accent text-white shadow-sm" : "text-text-ghost hover:bg-bg-hover"}`}
              >
                Clock
              </button>
              <button
                onClick={() => setOverlaySetting("timerMode", "countdown")}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${state.timerMode === "countdown" ? "bg-accent text-white shadow-sm" : "text-text-ghost hover:bg-bg-hover"}`}
              >
                Down
              </button>
            </div>
          </div>

          <div className="space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
            <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
              Configuration
            </h3>
            <input
              disabled={state.timerMode === "clock"}
              type="text"
              value={state.timerTarget}
              onChange={(e) => setOverlaySetting("timerTarget", e.target.value)}
              placeholder="00:10:00"
              className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-1.5 text-xs font-mono text-accent focus:border-accent outline-none disabled:opacity-20"
            />
          </div>
        </section>

        <section className="space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Atmosphere & Depth
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest">
                Chrome Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={state.timerColor}
                  onChange={(e) =>
                    setOverlaySetting("timerColor", e.target.value)
                  }
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={state.timerColor}
                  onChange={(e) =>
                    setOverlaySetting("timerColor", e.target.value)
                  }
                  className="flex-1 bg-bg-base border border-border-dim rounded-lg px-2 text-[10px] font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest">
                  Visual Scale
                </label>
                <span className="text-[9px] font-mono text-accent">
                  {state.timerFontSize}px
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="200"
                value={state.timerFontSize}
                onChange={(e) =>
                  setOverlaySetting("timerFontSize", Number(e.target.value))
                }
                className="w-full accent-accent h-1.5"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Anchoring
          </h3>
          <div className="grid grid-cols-3 gap-1.5 w-40 bg-bg-base/40 p-1.5 rounded-xl border border-border-dim/50 shadow-inner">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setOverlaySetting("timerPosition", pos)}
                className={`
                      aspect-square rounded-lg border transition-all flex items-center justify-center
                      ${
                        state.timerPosition === pos
                          ? "bg-accent border-accent shadow-lg text-white"
                          : "bg-bg-base/40 border-border-dim/50 text-text-ghost hover:border-accent/40"
                      }
                    `}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${state.timerPosition === pos ? "bg-white" : "bg-current opacity-10"}`}
                />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderSafetyConfig() {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <section className="space-y-4 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Standby Visualization
          </h3>
          {state.safetyUrl ? (
            <div className="relative aspect-video rounded-2xl border border-border-dim overflow-hidden bg-black group shadow-lg ring-1 ring-white/5 mx-auto w-full">
              <img
                src={`crossenter://${state.safetyUrl}`}
                className="w-full h-full object-cover"
                alt="Safety standby"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                <button
                  onClick={() => handleImageSelect("safetyUrl")}
                  className="p-3 bg-accent text-white rounded-xl"
                >
                  <Upload size={20} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleImageSelect("safetyUrl")}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-border-dim/50 hover:border-accent/50 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 text-text-ghost group bg-bg-base/10"
            >
              <div className="p-4 bg-bg-base rounded-full shadow-inner opacity-40 group-hover:opacity-100 transition-opacity">
                <Upload
                  size={24}
                  className="group-hover:text-accent transition-colors"
                />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">
                Upload Protective Layer Asset
              </span>
            </button>
          )}
        </section>

        <div className="p-5 bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-sm">
          <ShieldCheck size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-text-lo/70 font-medium">
            The <strong>Safety Layer</strong> is your last line of defense. It
            renders behind overlays but in front of content. Use high-contrast
            standby graphics to maintain visual integrity during technical
            transitions.
          </p>
        </div>
      </div>
    );
  }

  function renderAlertsConfig() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-[-24px]">
        {/* Quick Alert Card */}
        <section className="space-y-2 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest">
              Custom Quick Message
            </h3>
            {state.activeAlertText && (
              <button
                onClick={() => state.pushAlert(null)}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors"
              >
                Stop Alert
              </button>
            )}
          </div>

          <div className="space-y-3">
            <textarea
              placeholder="Enter message to scroll live..."
              className="w-full bg-bg-base border border-border-dim rounded-xl px-4 py-3 text-xs font-medium text-text-lo focus:border-accent outline-none resize-none h-24 shadow-inner"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  state.pushAlert((e.target as HTMLTextAreaElement).value);
                }
              }}
            />
            <button
              onClick={(e) => {
                const textarea = e.currentTarget
                  .previousElementSibling as HTMLTextAreaElement;
                state.pushAlert(textarea.value);
              }}
              className="w-full py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Push Live Alert
            </button>
          </div>
        </section>
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
          <Bell size={16} className="text-accent" />
          <p className="text-[10px] text-text-lo font-medium">
            Alerts scroll continuously at the bottom of the screen. They are
            higher priority than slides but below the blanking layer.
          </p>
        </div>

        {/* Saved Templates */}
        <section className="space-y-4">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Message Templates
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {state.alertTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-bg-base/40 rounded-2xl border border-border-dim/40 hover:border-accent/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-text-hi uppercase tracking-widest">
                    {template.title}
                  </span>
                  <button
                    onClick={() => state.deleteAlertTemplate(template.id)}
                    className="text-text-ghost opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-text-ghost mb-4 italic leading-relaxed">
                  "{template.template_text}"
                </p>

                {template.template_text.includes("[ID]") && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Child ID / Plate"
                      className="flex-1 bg-bg-base border border-border-dim rounded-lg px-3 py-1.5 text-[10px] font-mono text-accent outline-none focus:border-accent"
                      onChange={(e) => {
                        const val = e.target.value;
                        const btn = e.target
                          .nextElementSibling as HTMLButtonElement;
                        btn.onclick = () =>
                          state.pushAlert(
                            template.template_text.replace(
                              "[ID]",
                              val.toUpperCase(),
                            ),
                          );
                      }}
                    />
                    <button className="px-4 py-1.5 bg-bg-surface border border-border-dim rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                      Call
                    </button>
                  </div>
                )}

                {!template.template_text.includes("[ID]") && (
                  <button
                    onClick={() => state.pushAlert(template.template_text)}
                    className="w-full py-1.5 bg-bg-surface border border-border-dim rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                  >
                    Push Message
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Style Settings */}
        <section className="space-y-4 p-5 bg-bg-base/20 rounded-2xl border border-border-dim/30">
          <h3 className="text-[9px] font-black text-text-ghost uppercase tracking-widest px-1">
            Visual Branding
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest px-1">
                Banner Color
              </label>
              <input
                type="color"
                value={state.alertBgColor}
                onChange={(e) =>
                  state.setOverlaySetting("alertBgColor", e.target.value)
                }
                className="w-full h-8 rounded-lg bg-transparent border-none cursor-pointer p-0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest px-1">
                Text Color
              </label>
              <input
                type="color"
                value={state.alertTextColor}
                onChange={(e) =>
                  state.setOverlaySetting("alertTextColor", e.target.value)
                }
                className="w-full h-8 rounded-lg bg-transparent border-none cursor-pointer p-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[8px] font-bold text-text-ghost uppercase tracking-widest">
                Scroll Duration
              </label>
              <span className="text-[9px] font-mono text-accent">
                {state.alertScrollSpeed}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={parseInt(state.alertScrollSpeed)}
              onChange={(e) =>
                state.setOverlaySetting(
                  "alertScrollSpeed",
                  `${e.target.value}s`,
                )
              }
              className="w-full accent-accent h-1.5"
            />
          </div>
        </section>
      </div>
    );
  }
}
