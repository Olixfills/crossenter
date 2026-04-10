import { usePresentationStore } from "../../data/presentationStore";
import { 
  Type, 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Move, 
  Layers, 
  RotateCcw
} from "lucide-react";

export default function StyleEditor() {
  const { textStyles, setStyles, resetStyles } = usePresentationStore();

  const updateStyle = (key: string, value: any) => {
    setStyles({ [key]: value });
  };

  const ControlGroup = ({ title, icon: Icon, children }: any) => (
    <div className="flex flex-col gap-3 p-4 border-r border-border-dim/50 min-w-[200px]">
       <div className="flex items-center gap-2 text-[10px] font-black text-text-ghost uppercase tracking-widest border-b border-border-dim/30 pb-2">
          <Icon size={12} strokeWidth={2.5} />
          {title}
       </div>
       <div className="flex flex-col gap-4">
          {children}
       </div>
    </div>
  );

  const Slider = ({ label, value, min, max, onChange, unit = "" }: any) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[10px] font-bold text-text-lo uppercase tracking-tighter">
        <span>{label}</span>
        <span className="text-accent">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
      />
    </div>
  );

  const ColorInput = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between gap-4">
       <span className="text-[10px] font-bold text-text-lo uppercase tracking-tighter">{label}</span>
       <div className="flex items-center gap-2 bg-bg-surface p-1 rounded border border-border-dim px-2">
          <input 
            type="color" 
            value={value && value.startsWith('#') ? value : "#ffffff"} 
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 bg-transparent border-none cursor-pointer"
          />
          <span className="text-[9px] font-mono text-text-ghost uppercase">{value}</span>
       </div>
    </div>
  );

  return (
    <div className="flex h-full bg-bg-base/30 overflow-x-auto no-scrollbar">
      
      {/* ── Typography ── */}
      <ControlGroup title="Typography" icon={Type}>
        <Slider 
          label="Font Size" 
          value={textStyles.fontSize} 
          min={24} max={160} 
          unit="px"
          onChange={(v: number) => updateStyle('fontSize', v)} 
        />
        <div className="flex flex-col gap-2">
           <span className="text-[10px] font-bold text-text-lo uppercase tracking-tighter">Alignment</span>
           <div className="flex gap-1">
              {[
                { id: 'left', icon: AlignLeft },
                { id: 'center', icon: AlignCenter },
                { id: 'right', icon: AlignRight }
              ].map(align => (
                <button
                  key={align.id}
                  onClick={() => updateStyle('textAlign', align.id)}
                  className={`flex-1 flex justify-center py-1.5 rounded border transition-all ${
                    textStyles.textAlign === align.id 
                    ? 'bg-accent border-accent text-white shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]' 
                    : 'bg-bg-surface border-border-dim text-text-ghost hover:text-text-lo'
                  }`}
                >
                  <align.icon size={14} />
                </button>
              ))}
           </div>
        </div>
        <ColorInput 
          label="Text Color" 
          value={textStyles.color} 
          onChange={(v: string) => updateStyle('color', v)} 
        />
      </ControlGroup>

      {/* ── Shadow ── */}
      <ControlGroup title="Visual Depth" icon={Move}>
        <Slider 
          label="Shadow Blur" 
          value={textStyles.textShadowBlur} 
          min={0} max={100} 
          onChange={(v: number) => updateStyle('textShadowBlur', v)} 
        />
        <div className="grid grid-cols-2 gap-4">
          <Slider 
            label="Offset X" 
            value={textStyles.textShadowX} 
            min={-20} max={20} 
            onChange={(v: number) => updateStyle('textShadowX', v)} 
          />
          <Slider 
            label="Offset Y" 
            value={textStyles.textShadowY} 
            min={-20} max={20} 
            onChange={(v: number) => updateStyle('textShadowY', v)} 
          />
        </div>
        <ColorInput 
          label="Shadow Color" 
          value={textStyles.textShadowColor} 
          onChange={(v: string) => updateStyle('textShadowColor', v)} 
        />
      </ControlGroup>

      {/* ── Background & Layout ── */}
      <ControlGroup title="Atmosphere" icon={Layers}>
        <Slider 
          label="Backdrop Opacity" 
          value={Math.round(textStyles.bgOpacity * 100)} 
          min={0} max={100} 
          unit="%"
          onChange={(v: number) => updateStyle('bgOpacity', v / 100)} 
        />
        <Slider 
          label="Padding" 
          value={textStyles.padding} 
          min={0} max={120} 
          unit="px"
          onChange={(v: number) => updateStyle('padding', v)} 
        />
        <div className="flex flex-col gap-2 mt-auto">
           <button 
             onClick={() => resetStyles()}
             className="w-full py-2.5 rounded-xl border border-accent/20 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all active:scale-95 flex items-center justify-center gap-2 mb-2"
           >
              <RotateCcw size={10} strokeWidth={3} /> Reset Typography
           </button>
           <div className="p-3 bg-bg-surface/50 rounded-lg border border-border-dim/50 flex flex-col gap-2">
              <span className="text-[10px] font-black text-text-ghost uppercase tracking-widest flex items-center gap-2">
                 Settings Broadcast
              </span>
              <p className="text-[9px] text-text-ghost leading-relaxed">
                 Syncing styles to all live output windows.
              </p>
           </div>
        </div>
      </ControlGroup>

    </div>
  );
}
