import { useState, useEffect } from 'react'
import { useUIStore } from '../../data/store'
import { usePresentationStore } from '../../data/presentationStore'
import { Save, X } from 'lucide-react'

export default function SavePlaylistModal() {
  const { isSavePlaylistModalOpen, setSavePlaylistModalOpen } = useUIStore()
  const { activePlaylist, saveActivePlaylistAs } = usePresentationStore()
  const [name, setName] = useState('')

  useEffect(() => {
    if (isSavePlaylistModalOpen && activePlaylist) {
      setName(`${activePlaylist.name} (Copy)`)
    }
  }, [isSavePlaylistModalOpen, activePlaylist])

  if (!isSavePlaylistModalOpen) return null

  const handleSave = async () => {
    if (name.trim()) {
      await saveActivePlaylistAs(name.trim())
      setSavePlaylistModalOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-bg-raised border border-border-dim rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setSavePlaylistModalOpen(false)
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dim bg-bg-base/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
              <Save size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-text-hi">Save Preparation As</h2>
          </div>
          <button 
            onClick={() => setSavePlaylistModalOpen(false)}
            className="p-2 rounded-full hover:bg-bg-hover text-text-ghost transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          <label className="block text-[10px] font-black text-text-ghost uppercase tracking-[0.2em] mb-3 px-1">
            New Name
          </label>
          <input 
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Evening Service, Youth Meeting..."
            className="w-full bg-bg-base border border-border-dim rounded-xl px-4 py-3 text-sm text-text-hi focus:outline-none focus:border-accent font-medium shadow-inner"
          />
          <p className="mt-4 text-[10px] text-text-ghost italic leading-relaxed px-1">
            This will create a dedicated copy of your current session in the Library, containing all songs, scriptures, and styles.
          </p>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 bg-bg-base/30 border-t border-border-dim">
          <button 
            onClick={() => setSavePlaylistModalOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border-dim text-xs font-bold uppercase tracking-widest text-text-lo hover:bg-bg-hover transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-[2] px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-black uppercase tracking-widest hover:bg-accent-hi transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(var(--accent-rgb),0.3)]"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  )
}
