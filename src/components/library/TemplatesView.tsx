import { useState } from "react";
import { useUIStore } from "../../data/store";
import { usePresentationStore } from "../../data/presentationStore";
import {
  useEditorStore,
  DEFAULT_TEMPLATE,
  type TemplateData,
} from "../../data/editorStore";
import {
  Plus,
  Music,
  BookOpen,
  Star,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Templates List View (Library Tab)
// Full-width grid + right-pane detail on click
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TemplateData;
  isSongDefault: boolean;
  isScriptureDefault: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({
  template,
  isSongDefault,
  isScriptureDefault,
  isSelected,
  onClick,
}: TemplateCardProps) {
  const bgStyle =
    template.bg_type === "gradient"
      ? template.bg_value
      : template.bg_type === "color"
        ? template.bg_value
        : "#111";

  const previewStyle: React.CSSProperties = {
    background: bgStyle,
    fontFamily: template.font_family,
    color: template.font_color,
    textAlign: template.text_align as any,
    textShadow: `${template.offset_x}px ${template.offset_y}px ${
      template.shadow_blur * 0.12
    }px ${template.shadow_color}`,
  };

  return (
    <div
      onClick={onClick}
      className={`group  relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? "border-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.3)] ring-1 ring-accent/50 scale-[0.98]"
          : "border-white/8 hover:border-white/20 hover:scale-[0.99]"
      }`}
    >
      {/* 16:9 Preview */}
      <div
        className="relative aspect-video  w-full flex items-center justify-center overflow-hidden"
        style={previewStyle}
      >
        {template.bg_type === "image" && template.bg_value && (
          <img
            src={
              template.bg_value.startsWith("http")
                ? template.bg_value
                : `crossenter://${template.bg_value}`
            }
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${template.backdrop_opacity})` }}
        />

        {/* Sample text */}
        <span
          className="relative z-10 font-bold leading-none px-2 text-center"
          style={{ fontSize: "clamp(8px, 2vw, 14px)" }}
        >
          Aa
        </span>

        {/* Default badges */}
        {isSongDefault && (
          <span
            className="absolute top-1 left-1 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide z-20 flex items-center gap-0.5 shadow-sm"
            style={{ background: "rgba(139,92,246,0.92)", color: "#fff" }}
          >
            <Music className="inline w-2 h-2" /> Song
          </span>
        )}
        {isScriptureDefault && (
          <span
            className="absolute top-1 right-1 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide z-20 flex items-center gap-0.5 shadow-sm"
            style={{ background: "rgba(59,130,246,0.92)", color: "#fff" }}
          >
            <BookOpen className="inline w-2 h-2" /> Scripture
          </span>
        )}

        {/* Selected shimmer */}
        {isSelected && (
          <div className="absolute inset-0 bg-accent/10 z-30 border-2 border-accent/40 rounded-xl" />
        )}
      </div>

      {/* Name strip */}
      <div className="px-2 py-1.5 flex items-center gap-1.5 bg-bg-raised/90">
        {(isSongDefault || isScriptureDefault) && (
          <Star size={8} className="text-amber-400 shrink-0 fill-amber-400" />
        )}
        <span className="text-[10px] font-semibold text-text-hi truncate flex-1 leading-tight">
          {template.name}
        </span>
        {/* Transition type dot */}
        <span className="text-[8px] text-text-ghost/50 shrink-0 font-mono capitalize">
          {(template as any).transition ?? "fade"}
        </span>
      </div>
    </div>
  );
}

// ─── Right Detail Pane ────────────────────────────────────────────────────────
interface DetailPaneProps {
  template: TemplateData;
  isSongDefault: boolean;
  isScriptureDefault: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSetSongDefault: () => void;
  onSetScriptureDefault: () => void;
  onDelete: () => void;
  deletingId: number | null;
}

function DetailPane({
  template,
  isSongDefault,
  isScriptureDefault,
  onClose,
  onEdit,
  onSetSongDefault,
  onSetScriptureDefault,
  onDelete,
  deletingId,
}: DetailPaneProps) {
  const bgVal =
    template.bg_type === "gradient" || template.bg_type === "color"
      ? template.bg_value
      : "#111";

  const previewStyle: React.CSSProperties = {
    background: bgVal,
    fontFamily: template.font_family,
    color: template.font_color,
    textAlign: template.text_align as any,
    textShadow: `${template.offset_x}px ${template.offset_y}px ${
      template.shadow_blur * 0.15
    }px ${template.shadow_color}`,
  };

  const isConfirmingDelete = deletingId === template.id;

  return (
    <div className="flex flex-col h-full w-[210px] shrink-0 border-l border-border-dim bg-bg-raised overflow-scroll animate-slide-in-right">
      {/* ── Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-dim/30 shrink-0 bg-bg-base/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers size={11} className="text-accent shrink-0" />
          <span className="text-[10px] font-black text-text-hi uppercase tracking-[0.12em] truncate">
            {template.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-text-ghost hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X size={11} />
        </button>
      </div>

      {/* ── Live Preview (16:9) */}
      <div className="p-3 shrink-0">
        <div
          className="relative aspect-video w-full rounded-lg overflow-hidden flex items-center justify-center shadow-inner"
          style={previewStyle}
        >
          {template.bg_type === "image" && template.bg_value && (
            <img
              src={
                template.bg_value.startsWith("http")
                  ? template.bg_value
                  : `crossenter://${template.bg_value}`
              }
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `rgba(0,0,0,${template.backdrop_opacity})` }}
          />
          <span
            className="relative z-10 font-bold leading-snug px-3 text-center"
            style={{ fontSize: "clamp(11px, 2.2vw, 18px)" }}
          >
            Glory to God
          </span>
        </div>
      </div>

      {/* ── Info pills */}
      <div className="px-3 pb-2 flex flex-wrap gap-1 shrink-0">
        {isSongDefault && (
          <span
            className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              background: "rgba(139,92,246,0.15)",
              color: "rgb(167,139,250)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <Music size={7} /> Song Default
          </span>
        )}
        {isScriptureDefault && (
          <span
            className="flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              background: "rgba(59,130,246,0.15)",
              color: "rgb(147,197,253)",
              border: "1px solid rgba(59,130,246,0.3)",
            }}
          >
            <BookOpen size={7} /> Scripture Default
          </span>
        )}
        <span
          className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-ghost border border-white/8"
          style={{ fontFamily: template.font_family }}
        >
          {template.font_family}
        </span>
      </div>

      {/* ── Divider */}
      <div className="mx-3 border-t border-border-dim/30 shrink-0" />

      {/* ── Action Buttons — single column, clean */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Edit */}
        <button
          onClick={onEdit}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all text-[11px] font-bold cursor-pointer active:scale-[0.98]"
        >
          <Pencil size={13} strokeWidth={2} />
          <span>Edit Template</span>
        </button>

        {/* Make Show Theme */}
        <button
          onClick={onSetSongDefault}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition-all text-[11px] font-bold cursor-pointer active:scale-[0.98] ${
            isSongDefault
              ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
              : "bg-white/3 border-white/8 text-text-lo hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/8"
          }`}
        >
          {isSongDefault ? (
            <CheckCircle2
              size={13}
              strokeWidth={2}
              className="text-violet-400 shrink-0"
            />
          ) : (
            <Music size={13} strokeWidth={2} className="shrink-0" />
          )}
          <span className="truncate">
            {isSongDefault ? "✓ Song Theme" : "Set as Song Theme"}
          </span>
        </button>

        {/* Make Scripture Theme */}
        <button
          onClick={onSetScriptureDefault}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition-all text-[11px] font-bold cursor-pointer active:scale-[0.98] ${
            isScriptureDefault
              ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
              : "bg-white/3 border-white/8 text-text-lo hover:border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/8"
          }`}
        >
          {isScriptureDefault ? (
            <CheckCircle2
              size={13}
              strokeWidth={2}
              className="text-blue-400 shrink-0"
            />
          ) : (
            <BookOpen size={13} strokeWidth={2} className="shrink-0" />
          )}
          <span className="truncate">
            {isScriptureDefault
              ? "✓ Scripture Theme"
              : "Set as Scripture Theme"}
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Delete */}
        <button
          onClick={onDelete}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition-all text-[11px] font-bold cursor-pointer active:scale-[0.98] ${
            isConfirmingDelete
              ? "bg-red-500/20 border-red-500/50 text-red-300 animate-pulse"
              : "bg-white/3 border-white/8 text-text-ghost hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/8"
          }`}
        >
          <Trash2 size={13} strokeWidth={2} className="shrink-0" />
          <span>{isConfirmingDelete ? "Confirm Delete?" : "Delete"}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TemplatesView() {
  const {
    templates,
    defaultSongTemplateId,
    defaultScriptureTemplateId,
    refreshTemplates,
    setDefaultTemplate,
  } = usePresentationStore();
  const { openTemplateEditor } = useEditorStore();
  const { setActiveMode } = useUIStore();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;

  const handleNewTemplate = () => {
    openTemplateEditor({ ...DEFAULT_TEMPLATE, name: "New Template" });
    setActiveMode("Edit");
  };

  const handleEditTemplate = (template: TemplateData) => {
    openTemplateEditor(template);
    setActiveMode("Edit");
  };

  const handleSetSongDefault = async (id: number) => {
    const newId = defaultSongTemplateId === id ? null : id;
    await setDefaultTemplate("song", newId);
    await refreshTemplates();
  };

  const handleSetScriptureDefault = async (id: number) => {
    const newId = defaultScriptureTemplateId === id ? null : id;
    await setDefaultTemplate("scripture", newId);
    await refreshTemplates();
  };

  const handleDeleteTemplate = async (id: number) => {
    if (deletingId === id) {
      await window.crossenter.deleteTemplate(id);
      await refreshTemplates();
      setDeletingId(null);
      setSelectedId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Main Grid Area ──────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-bg-base/30 shrink-0 border-b border-border-dim/30">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[10px] font-black text-text-hi uppercase tracking-[0.2em]">
              Templates
            </span>
            <span className="text-[9px] font-bold text-text-ghost bg-white/5 px-1.5 py-0.5 rounded-full border border-white/8">
              {templates.length}
            </span>
          </div>

          <button
            onClick={handleNewTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400/20 transition-all text-[9px] font-black uppercase tracking-widest active:scale-95 cursor-pointer"
          >
            <Plus size={10} strokeWidth={3} />
            New
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 opacity-40 select-none">
              <div className="w-14 h-14 rounded-2xl bg-bg-surface flex items-center justify-center mb-4">
                <Star size={26} className="text-amber-400" />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-ghost">
                No Templates Yet
              </div>
              <div className="text-[9px] text-text-ghost mt-1.5">
                Click "New" to create your first theme
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSongDefault={template.id === defaultSongTemplateId}
                  isScriptureDefault={
                    template.id === defaultScriptureTemplateId
                  }
                  isSelected={template.id === selectedId}
                  onClick={() =>
                    setSelectedId(
                      template.id === selectedId ? null : template.id!,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Legend Footer */}
        <div className="px-4 py-1.5 bg-bg-base/40 border-t border-border-dim/20 shrink-0">
          <div className="flex items-center gap-3 text-[8px] text-text-ghost/60">
            <div className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.9)" }}
              />
              Song
            </div>
            <div className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.9)" }}
              />
              Scripture
            </div>
            <div className="ml-auto">Click to inspect</div>
          </div>
        </div>
      </div>

      {/* ── Right Detail Pane (slide-in) ──────────────────── */}
      {selectedTemplate && (
        <DetailPane
          template={selectedTemplate}
          isSongDefault={selectedTemplate.id === defaultSongTemplateId}
          isScriptureDefault={
            selectedTemplate.id === defaultScriptureTemplateId
          }
          onClose={() => setSelectedId(null)}
          onEdit={() => handleEditTemplate(selectedTemplate)}
          onSetSongDefault={() => handleSetSongDefault(selectedTemplate.id!)}
          onSetScriptureDefault={() =>
            handleSetScriptureDefault(selectedTemplate.id!)
          }
          onDelete={() => handleDeleteTemplate(selectedTemplate.id!)}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
