import { useState, useEffect } from 'react'
import { useUIStore } from '../../data/store'
import { Link, X, Globe, Video, Image, Music, FileText, ArrowRight } from 'lucide-react'

function getMediaTypeFromUrl(url: string): string {
    const cleanUrl = url.split('?')[0].toLowerCase();
    const ext = cleanUrl.split('.').pop() || '';
    if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return 'video';
    return 'link';
}

function TypeIcon({ type }: { type: string }) {
    switch (type) {
        case 'video': return <Video size={16} />;
        case 'image': return <Image size={16} />;
        case 'audio': return <Music size={16} />;
        case 'pdf': return <FileText size={16} />;
        default: return <Globe size={16} />;
    }
}

export default function AddLinkModal({ onAdded }: { onAdded?: () => void }) {
  const { isAddLinkModalOpen, setAddLinkModalOpen } = useUIStore()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('link')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-detect type when URL changes
  useEffect(() => {
    if (url) {
      setType(getMediaTypeFromUrl(url));
      
      // Auto-fill name from URL filename if name is empty
      if (!name) {
          try {
              const fileName = url.split('/').pop()?.split('?')[0] || '';
              if (fileName && fileName.includes('.')) {
                  setName(decodeURIComponent(fileName));
              }
          } catch (e) { /* ignore */ }
      }
    }
  }, [url]);

  if (!isAddLinkModalOpen) return null

  const handleSave = async () => {
    let finalUrl = url.trim();
    if (!finalUrl) return;

    // Auto-prepend https:// if protocol is missing
    if (!finalUrl.includes('://') && !finalUrl.startsWith('data:')) {
        if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
            finalUrl = 'https://' + finalUrl;
        }
    }

    const finalName = name.trim() || finalUrl.split('/').pop()?.split('?')[0] || "Remote Resource";
    
    setIsSubmitting(true)
    try {
      await window.crossenter.addMediaLink({ name: finalName, type, url: finalUrl })
      setName('')
      setUrl('')
      setType('link')
      setAddLinkModalOpen(false)
      if (onAdded) onAdded()
    } catch (err) {
      console.error("Failed to add link:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setAddLinkModalOpen(false)}
    >
      <div 
        className="w-full max-sm bg-bg-raised border border-border-dim rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') setAddLinkModalOpen(false)
        }}
      >
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <Link size={12} strokeWidth={3} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-text-hi">Magic Link</h2>
            </div>
            <button 
                onClick={() => setAddLinkModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-bg-hover text-text-ghost transition-colors"
            >
                <X size={16} />
            </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${url ? 'text-accent' : 'text-text-ghost'}`}>
                <TypeIcon type={type} />
              </div>
              <input 
                autoFocus
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste URL (Video, Image, Audio...)"
                className="w-full bg-bg-base border border-border-dim rounded-2xl pl-12 pr-4 py-4 text-sm text-text-hi focus:outline-none focus:border-accent font-medium shadow-inner transition-all placeholder:text-text-ghost/30"
              />
            </div>

            {url && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Display Name (Optional)"
                        className="w-full bg-transparent border-b border-border-dim/50 px-4 py-2 text-xs text-text-lo focus:outline-none focus:border-accent font-medium transition-all"
                    />
                </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            disabled={!url.trim() || isSubmitting}
            className="w-full h-12 rounded-2xl bg-accent hover:bg-accent-hi text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2 shadow-lg shadow-accent/25 active:scale-[0.98]"
          >
            {isSubmitting ? 'Importing...' : 'Add to Library'}
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>

        <div className="px-6 py-3 bg-bg-base/30 border-t border-border-dim/20 flex justify-center">
             <p className="text-[8px] font-bold text-text-ghost uppercase tracking-wider">Supports YouTube, Vimeo, and Direct Assets</p>
        </div>
      </div>
    </div>
  )
}
