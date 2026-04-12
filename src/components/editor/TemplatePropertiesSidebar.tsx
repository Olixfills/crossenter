import { useState } from 'react'
import { useEditorStore, type TemplateData } from '../../data/editorStore'
import { useUIStore } from '../../data/store'
import { usePresentationStore } from '../../data/presentationStore'
import {
  Type, AlignCenter, AlignLeft, AlignRight,
  Save, Undo2, Music, BookOpen, Image,
  Layers, SlidersHorizontal, ChevronDown, Check, Loader2,
  Zap, Plus, Trash2
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Template Properties Sidebar
// Full right-pane controls for editing a template in template mode.
// ─────────────────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  'Inter', 'Plus Jakarta Sans', 'Outfit', 'Roboto', 'Poppins', 'Lato', 
  'Open Sans', 'Montserrat', 'Source Sans Pro', 'Nunito', 'Raleway',
  'Playfair Display', 'Merriweather', 'Lora', 'Oswald', 'Fira Sans',
  'Georgia', 'Arial', 'Helvetica', 'Times New Roman'
]

function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2 mb-3">
      <Icon size={12} />
      {label}
    </label>
  )
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-text-ghost shrink-0">{label}</span>
      {children}
    </div>
  )
}

// ── Gradient Builder ─────────────────────────────────────────────────────────
function parseGradient(css: string) {
  // Try to extract type and stops from a CSS gradient string
  const typeMatch = css.match(/^(linear|radial|conic)-gradient/)
  const gradType = typeMatch ? typeMatch[1] : 'linear'
  // Extract colors (very simple: grab all #hex and rgba? values)
  const colorRx = /#[0-9a-fA-F]{3,8}/g
  const colors = css.match(colorRx) || ['#000000', '#333366']
  const angleMatch = css.match(/(\d+)deg/)
  const angle = angleMatch ? angleMatch[1] : '135'
  return { gradType, colors, angle }
}

function buildGradient(gradType: string, colors: string[], angle: string) {
  const stops = colors.join(', ')
  if (gradType === 'radial') return `radial-gradient(ellipse at center, ${stops})`
  if (gradType === 'conic') return `conic-gradient(from ${angle}deg, ${stops})`
  return `linear-gradient(${angle}deg, ${stops})`
}

function GradientBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseGradient(value || 'linear-gradient(135deg, #0a0a12, #1a0b2e)')
  const [gradType, setGradType] = useState(parsed.gradType)
  const [colors, setColors] = useState<string[]>(parsed.colors.slice(0, 4).length >= 2 ? parsed.colors.slice(0, 4) : ['#0a0a12', '#1a0b2e'])
  const [angle, setAngle] = useState(parsed.angle)

  const update = (newType = gradType, newColors = colors, newAngle = angle) => {
    setGradType(newType)
    setColors(newColors)
    setAngle(newAngle)
    onChange(buildGradient(newType, newColors, newAngle))
  }

  return (
    <div className="space-y-2">
      {/* Type */}
      <div className="flex gap-1 bg-bg-base p-1 rounded-lg border border-border-dim">
        {(['linear', 'radial', 'conic'] as const).map(t => (
          <button key={t} onClick={() => update(t)}
            className={`flex-1 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
              gradType === t ? 'bg-accent text-white' : 'text-text-ghost hover:text-text-hi'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Preview strip */}
      <div
        className="w-full h-8 rounded-lg border border-border-dim"
        style={{ background: buildGradient(gradType, colors, angle) }}
      />

      {/* Color stops */}
      <div className="space-y-1.5">
        <span className="text-[9px] text-text-ghost uppercase tracking-wider">Color Stops</span>
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="color" value={c}
              onChange={e => {
                const nc = [...colors]; nc[i] = e.target.value; update(gradType, nc)
              }}
              className="w-7 h-7 rounded cursor-pointer border border-border-dim bg-transparent" />
            <input type="text" value={c}
              onChange={e => {
                const nc = [...colors]; nc[i] = e.target.value; update(gradType, nc)
              }}
              className="flex-1 bg-bg-base border border-border-dim rounded px-2 py-1 text-[10px] font-mono text-text-hi focus:outline-none focus:border-accent" />
            {colors.length > 2 && (
              <button onClick={() => { const nc = colors.filter((_, j) => j !== i); update(gradType, nc) }}
                className="text-text-ghost hover:text-red-400 transition-colors cursor-pointer">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
        {colors.length < 5 && (
          <button
            onClick={() => { const nc = [...colors, '#ffffff']; update(gradType, nc) }}
            className="w-full py-1 rounded border border-dashed border-border-dim text-text-ghost hover:border-accent hover:text-accent transition-all text-[9px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={10} /> Add Stop
          </button>
        )}
      </div>

      {/* Angle (only for linear/conic) */}
      {gradType !== 'radial' && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-text-ghost shrink-0">Angle</span>
          <input type="range" min={0} max={360} step={5} value={angle}
            onChange={e => update(gradType, colors, e.target.value)}
            className="flex-1 accent-[var(--accent)]" />
          <span className="text-[9px] font-mono text-text-lo w-10 text-right">{angle}°</span>
        </div>
      )}
    </div>
  )
}

export default function TemplatePropertiesSidebar() {
  const { draftTemplate, updateDraftTemplate, clearEditor } = useEditorStore()
  const { setActiveMode } = useUIStore()
  const { refreshTemplates, setDefaultTemplate, defaultSongTemplateId, defaultScriptureTemplateId } = usePresentationStore()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [nameInput, setNameInput] = useState(draftTemplate?.name || '')

  if (!draftTemplate) return null

  const upd = (key: keyof TemplateData, value: any) => updateDraftTemplate(key, value)

  const handleSave = async () => {
    if (!draftTemplate) return
    setSaving(true)
    try {
      const payload = { ...draftTemplate, name: nameInput || draftTemplate.name }
      await window.crossenter.saveTemplate(payload)
      await refreshTemplates()
      // Update the id in draft if it was a new save
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('[TemplateEditor] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleExit = () => {
    clearEditor()
    setActiveMode('Show')
  }

  const isSongDefault = draftTemplate.id === defaultSongTemplateId
  const isScriptureDefault = draftTemplate.id === defaultScriptureTemplateId

  const handleSetDefault = async (type: 'song' | 'scripture') => {
    if (!draftTemplate.id) {
      alert('Please save the template first before setting it as a default.')
      return
    }
    const currentId = type === 'song' ? defaultSongTemplateId : defaultScriptureTemplateId
    await setDefaultTemplate(type, currentId === draftTemplate.id ? null : draftTemplate.id)
  }

  return (
    <div className="flex flex-col h-full bg-bg-raised border-l border-border-dim w-72 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border-dim bg-bg-base/30">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hi">Template Designer</h3>
        <p className="text-[9px] text-text-ghost mt-0.5">Changes update the preview instantly.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-7 custom-scrollbar">

        {/* ── Template Name ─────────────────────────── */}
        <div>
          <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest block mb-2">Template Name</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => upd('name', nameInput)}
            placeholder="e.g. Sunday Morning"
            className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs text-text-hi focus:outline-none focus:border-accent transition-all"
          />
        </div>

        {/* ── Typography ─────────────────────────────── */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <SectionLabel icon={Type} label="Typography" />

          {/* Font Family */}
          <div>
            <span className="text-[10px] text-text-ghost block mb-1.5">Font Family</span>
            <div className="relative">
              <select
                value={draftTemplate.font_family}
                onChange={(e) => upd('font_family', e.target.value)}
                className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs text-text-hi appearance-none focus:outline-none focus:border-accent transition-all"
              >
                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-ghost pointer-events-none" />
            </div>
          </div>

          {/* Font Size */}
          <ControlRow label="Font Size">
            <div className="flex items-center gap-2">
              <input
                type="range" min={16} max={144} step={2}
                value={draftTemplate.font_size}
                onChange={(e) => upd('font_size', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]"
              />
              <input
                type="number" min={16} max={144}
                value={draftTemplate.font_size}
                onChange={(e) => upd('font_size', Number(e.target.value))}
                className="w-14 bg-bg-base border border-border-dim rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-accent"
              />
            </div>
          </ControlRow>

          {/* Font Color */}
          <ControlRow label="Font Color">
            <div className="flex items-center gap-2">
              <input type="color" value={draftTemplate.font_color}
                onChange={(e) => upd('font_color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border-dim bg-transparent" />
              <span className="text-[10px] font-mono text-text-lo">{draftTemplate.font_color}</span>
            </div>
          </ControlRow>

          {/* Text Align */}
          <div>
            <span className="text-[10px] text-text-ghost block mb-1.5">Alignment</span>
            <div className="flex items-center gap-2 bg-bg-base p-1 rounded-lg border border-border-dim">
              {[
                { id: 'left', icon: AlignLeft },
                { id: 'center', icon: AlignCenter },
                { id: 'right', icon: AlignRight },
              ].map(btn => (
                <button key={btn.id} onClick={() => upd('text_align', btn.id)}
                  className={`flex-1 flex items-center justify-center p-2 rounded transition-all ${
                    draftTemplate.text_align === btn.id ? 'bg-accent text-white' : 'text-text-ghost hover:text-text-hi'
                  }`}>
                  <btn.icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Visual Depth (Shadows) ─────────────────── */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <SectionLabel icon={Layers} label="Visual Depth" />

          <ControlRow label="Shadow Blur">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={120} step={2}
                value={draftTemplate.shadow_blur}
                onChange={(e) => upd('shadow_blur', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]" />
              <span className="text-[10px] font-mono text-text-lo w-8 text-right">{draftTemplate.shadow_blur}</span>
            </div>
          </ControlRow>

          <ControlRow label="Shadow Color">
            <input type="color"
              value={draftTemplate.shadow_color.startsWith('rgba') ? '#000000' : draftTemplate.shadow_color}
              onChange={(e) => upd('shadow_color', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border-dim bg-transparent" />
          </ControlRow>

          <ControlRow label="Offset X">
            <div className="flex items-center gap-2">
              <input type="range" min={-60} max={60} step={1}
                value={draftTemplate.offset_x}
                onChange={(e) => upd('offset_x', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]" />
              <span className="text-[10px] font-mono text-text-lo w-8 text-right">{draftTemplate.offset_x}</span>
            </div>
          </ControlRow>

          <ControlRow label="Offset Y">
            <div className="flex items-center gap-2">
              <input type="range" min={-60} max={60} step={1}
                value={draftTemplate.offset_y}
                onChange={(e) => upd('offset_y', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]" />
              <span className="text-[10px] font-mono text-text-lo w-8 text-right">{draftTemplate.offset_y}</span>
            </div>
          </ControlRow>
        </div>

        {/* ── Atmosphere ─────────────────────────────── */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <SectionLabel icon={SlidersHorizontal} label="Atmosphere" />

          <ControlRow label="Backdrop Opacity">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={1} step={0.05}
                value={draftTemplate.backdrop_opacity}
                onChange={(e) => upd('backdrop_opacity', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]" />
              <span className="text-[10px] font-mono text-text-lo w-8 text-right">{Math.round(draftTemplate.backdrop_opacity * 100)}%</span>
            </div>
          </ControlRow>

          <ControlRow label="Text Padding">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={120} step={4}
                value={draftTemplate.padding}
                onChange={(e) => upd('padding', Number(e.target.value))}
                className="w-20 accent-[var(--accent)]" />
              <span className="text-[10px] font-mono text-text-lo w-8 text-right">{draftTemplate.padding}</span>
            </div>
          </ControlRow>

          {/* Background type selector */}
          <div>
            <span className="text-[10px] text-text-ghost block mb-1.5">Background</span>
            <div className="flex items-center gap-1 bg-bg-base p-1 rounded-lg border border-border-dim mb-2">
              {(['color', 'gradient', 'image', 'video'] as const).map(type => (
                <button key={type} onClick={() => upd('bg_type', type)}
                  className={`flex-1 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                    draftTemplate.bg_type === type ? 'bg-accent text-white' : 'text-text-ghost hover:text-text-hi'
                  }`}>
                  {type}
                </button>
              ))}
            </div>

            {draftTemplate.bg_type === 'color' ? (
              <div className="flex items-center gap-2">
                <input type="color" value={draftTemplate.bg_value.startsWith('#') ? draftTemplate.bg_value : '#000000'}
                  onChange={(e) => upd('bg_value', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border-dim bg-transparent" />
                <input type="text" value={draftTemplate.bg_value}
                  onChange={(e) => upd('bg_value', e.target.value)}
                  className="flex-1 bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs font-mono text-text-hi focus:outline-none focus:border-accent transition-all" />
              </div>

            ) : draftTemplate.bg_type === 'gradient' ? (
              <GradientBuilder
                value={draftTemplate.bg_value}
                onChange={(v) => upd('bg_value', v)}
              />

            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={draftTemplate.bg_value}
                  onChange={(e) => upd('bg_value', e.target.value)}
                  placeholder="Enter URL or file path..."
                  className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs text-text-hi focus:outline-none focus:border-accent transition-all"
                />
                <button
                  onClick={async () => {
                    const paths = await window.crossenter.openMediaDialog()
                    if (paths && paths.length > 0) upd('bg_value', paths[0])
                  }}
                  className="w-full py-2 rounded-lg border border-dashed border-border-dim text-text-ghost hover:border-accent hover:text-accent transition-all text-[10px] font-bold flex items-center justify-center gap-1.5"
                >
                  <Image size={12} /> Browse Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Slide Transitions ─────────────────────────── */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <SectionLabel icon={Zap} label="Slide Transitions" />

          <div>
            <span className="text-[10px] text-text-ghost block mb-1.5">Transition Style</span>
            <div className="grid grid-cols-3 gap-1">
              {([
                { id: 'cut',        label: 'Cut' },
                { id: 'fade',       label: 'Fade' },
                { id: 'slide-up',   label: 'Slide ↑' },
                { id: 'slide-left', label: 'Slide ←' },
                { id: 'zoom',       label: 'Zoom' },
                { id: 'flip',       label: 'Flip' },
                { id: 'blur',       label: 'Blur' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => upd('transition', t.id)}
                  className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    draftTemplate.transition === t.id
                      ? 'bg-accent text-white border-accent shadow-sm'
                      : 'text-text-ghost border-border-dim hover:text-text-hi hover:border-border-hi'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {draftTemplate.transition !== 'cut' && (
            <ControlRow label="Duration">
              <div className="flex items-center gap-2">
                <input type="range" min={100} max={2000} step={50}
                  value={draftTemplate.transition_duration}
                  onChange={(e) => upd('transition_duration', Number(e.target.value))}
                  className="w-20 accent-[var(--accent)]" />
                <span className="text-[10px] font-mono text-text-lo w-12 text-right">
                  {draftTemplate.transition_duration}ms
                </span>
              </div>
            </ControlRow>
          )}
        </div>

        {/* ── Default Assignment ─────────────────────── */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest block mb-3">Set As Default</label>
          <p className="text-[9px] text-text-ghost mb-3">
            {draftTemplate.id ? 'Assign this template as the global default.' : 'Save the template first to assign defaults.'}
          </p>

          <button
            onClick={() => handleSetDefault('song')}
            disabled={!draftTemplate.id}
            className={`w-full py-2.5 rounded-xl border font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
              isSongDefault
                ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                : 'border-border-dim text-text-ghost hover:border-purple-500/50 hover:text-purple-300'
            }`}
          >
            {isSongDefault ? <Check size={13} /> : <Music size={13} />}
            {isSongDefault ? 'Current Song Default' : 'Set as Song Default'}
          </button>

          <button
            onClick={() => handleSetDefault('scripture')}
            disabled={!draftTemplate.id}
            className={`w-full py-2.5 rounded-xl border font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
              isScriptureDefault
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'border-border-dim text-text-ghost hover:border-blue-500/50 hover:text-blue-300'
            }`}
          >
            {isScriptureDefault ? <Check size={13} /> : <BookOpen size={13} />}
            {isScriptureDefault ? 'Current Scripture Default' : 'Set as Scripture Default'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-bg-base/50 border-t border-border-dim space-y-2.5">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            saved
              ? 'bg-green-600 text-white shadow-green-600/20'
              : 'bg-accent text-white hover:bg-accent-hi shadow-accent/20'
          }`}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Template'}
        </button>

        <button
          onClick={handleExit}
          className="w-full py-2.5 rounded-xl border border-border-dim text-text-ghost font-black text-xs uppercase tracking-widest hover:border-border-hi hover:text-text-lo flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Undo2 size={13} /> Exit Editor
        </button>
      </div>
    </div>
  )
}
