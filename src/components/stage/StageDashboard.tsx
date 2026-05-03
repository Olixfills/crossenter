import React, { useState } from 'react'
import { 
  Send, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'
import { usePresentationStore } from '../../data/presentationStore'
import StageDisplay from '../../windows/StageDisplay'
import { useFontLoader } from '../../hooks/useFontLoader'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Stage Dashboard (Control Panel Component)
// ─────────────────────────────────────────────────────────────────────────────

export default function StageDashboard() {
  const { 
    stageMessage, 
    setStageMessage,
    stageTimerRemaining,
    stageTimerRunning,
    stageTimerFontFamily,
    sendStageCommand,
    setOverlaySetting
  } = usePresentationStore()

  useFontLoader(stageTimerFontFamily || "JetBrains Mono");

  const [messageInput, setMessageInput] = useState('')
  const [timerMinutes, setTimerMinutes] = useState('5')

  const handleSendTimer = () => {
    const totalSeconds = parseInt(timerMinutes) * 60
    if (!isNaN(totalSeconds)) {
      sendStageCommand('TIMER_RESET', totalSeconds)
    }
  }

  const presets = ["Wrap up", "Time's up", "Come to Stage", "Volume Up", "Mics On"]

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-base p-6 gap-6 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <div className="p-2 bg-accent/20 rounded-lg shadow-inner">
          <Clock className="text-accent" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-text-hi uppercase tracking-widest">Stage Command Center</h1>
          <p className="text-xs text-text-ghost">Monitor and command the stage display telemetry</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left Column: Mission-Critical Preview */}
        <div className="flex flex-col gap-3 min-h-[420px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-text-ghost tracking-[0.2em] flex items-center gap-2">
              <span className="w-1 h-3 bg-accent rounded-full" />
              Live Stage Preview
            </span>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
               <span className="text-[9px] font-black text-red-400 uppercase tracking-widest font-mono">Feedback: Online</span>
            </div>
          </div>
          <div className="flex-1 bg-black rounded-3xl overflow-hidden border border-border-dim shadow-2xl relative shadow-black/80 ring-4 ring-black">
            {/* The preview is actually a scaled-down instance of the real component */}
            <div className="absolute inset-0 origin-top-left" style={{ width: '200%', height: '200%', transform: 'scale(0.5)' }}>
              <StageDisplay />
            </div>
          </div>
          <div className="flex items-center justify-center p-2 bg-bg-raised/30 rounded-xl border border-border-dim/50">
             <p className="text-[9px] text-text-ghost font-bold italic tracking-wider">Direct low-latency rendering — matched to 3rd monitor output</p>
          </div>
        </div>

        {/* Right Column: Interaction Cards */}
        <div className="flex flex-col gap-8">
          
          {/* 1. Stage Message Card */}
          <div className="bg-bg-raised/40 border border-border-dim p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-hi">
                <MessageSquare size={16} className="text-accent" />
                <span className="text-xs font-black uppercase tracking-widest">Private Message</span>
              </div>
              {stageMessage && (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded uppercase animate-pulse">On Stage Now</span>
              )}
            </div>
            
            <div className="relative group">
              <textarea 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a private message for the speaker..."
                className="w-full bg-bg-base border border-border-dim rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all resize-none h-28 pr-12 shadow-inner"
              />
              <div className="absolute top-3 right-3">
                <button 
                  onClick={() => { setStageMessage(null); setMessageInput(''); }}
                  className="p-2.5 text-text-ghost hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Clear Stage"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-3 right-3">
                <button 
                  onClick={() => { setStageMessage(messageInput); }}
                  disabled={!messageInput.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover active:scale-95 transition-all shadow-[0_10px_20px_rgba(var(--accent-rgb),0.3)] disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={14} />
                  Push to Display
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {presets.map(p => (
                <button 
                  key={p}
                  onClick={() => setMessageInput(p)}
                  className="px-4 py-2 bg-bg-base border border-border-dim hover:border-accent/40 text-[10px] font-bold text-text-ghost hover:text-accent rounded-xl transition-all active:bg-accent/5"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Stage Timer Card */}
          <div className="bg-bg-raised/40 border border-border-dim p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2 text-text-hi">
              <AlertTriangle size={16} className="text-orange-400" />
              <span className="text-xs font-black uppercase tracking-widest">Production Timing</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-[9px] font-black text-text-ghost uppercase tracking-widest ml-1 opacity-70">Minutes Allocation</span>
                <input 
                  type="number" 
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(e.target.value)}
                  className="bg-bg-base border border-border-dim rounded-2xl px-5 py-4 text-3xl font-black text-text-hi outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all w-full shadow-inner tabular-nums"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-5 shrink-0">
                <button 
                  onClick={() => sendStageCommand(stageTimerRunning ? 'TIMER_STOP' : 'TIMER_START')}
                  className={`p-5 rounded-2xl transition-all active:scale-90 shadow-xl ${stageTimerRunning ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-green-600 text-white shadow-green-900/40'}`}
                >
                  {stageTimerRunning ? <Pause size={28} strokeWidth={3} /> : <Play size={28} strokeWidth={3} fill="currentColor" />}
                </button>
                <button 
                  onClick={handleSendTimer}
                  className="p-5 bg-bg-base border border-border-dim hover:text-text-hi text-text-ghost rounded-2xl transition-all hover:bg-bg-raised active:scale-95 shadow-md"
                  title="Apply / Reset"
                >
                  <RotateCcw size={28} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className="mt-3 p-5 bg-black/40 rounded-2xl border border-white/[0.03] flex items-center justify-between shadow-inner">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-text-ghost uppercase tracking-widest">Live Sync Status</span>
                 <span className="text-[9px] text-green-500/60 font-mono italic">Broadcasting heartbeat...</span>
              </div>
              <span className={`text-4xl font-black tabular-nums transition-colors ${stageTimerRemaining < 60 && stageTimerRemaining > 0 ? 'text-red-500' : 'text-orange-400'}`} style={{ fontFamily: `"${stageTimerFontFamily || 'JetBrains Mono'}", monospace` }}>
                {Math.floor(stageTimerRemaining / 60).toString().padStart(2, '0')}:{(stageTimerRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            {/* Stage Font Config */}
            <div className="flex items-center justify-between p-4 bg-bg-base/30 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-text-ghost uppercase tracking-widest leading-tight">
                  Display<br/>Typography
                </span>
                <select 
                  value={stageTimerFontFamily}
                  onChange={(e) => setOverlaySetting("stageTimerFontFamily", e.target.value)}
                  className="bg-black/50 border border-border-dim rounded-lg px-4 py-2 text-xs font-bold text-text-hi outline-none focus:border-orange-500/50 w-48"
                >
                  <option value="JetBrains Mono">JetBrains (Code)</option>
                  <option value="Inter">Inter (Clean)</option>
                  <option value="Outfit">Outfit (Modern)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="Roboto Mono">Roboto Mono (Classic)</option>
                  <option value="Oswald">Oswald (Cinematic)</option>
                  <option value="Bebas Neue">Bebas Neue (Bold)</option>
                </select>
            </div>
          </div>

          <div className="mt-auto px-6 py-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
             <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-orange-500 shrink-0" />
                <p className="text-[10px] text-orange-200/60 font-medium leading-relaxed">
                  Stage messages are <span className="text-orange-400 font-bold uppercase tracking-wider">private</span>. 
                  They will never appear on the Main Output window visible to the audience.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  )
}
