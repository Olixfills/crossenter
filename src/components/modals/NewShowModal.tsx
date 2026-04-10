import { useState, useEffect } from "react";
import { useUIStore } from "../../data/store";
import { useEditorStore } from "../../data/editorStore";
import { usePresentationStore } from "../../data/presentationStore";
import { 
  X, 
  ChevronLeft, 
  Type, 
  Search, 
  Plus, 
  Music, 
  User, 
  Tag
} from "lucide-react";
import { parseLyrics } from "../../utils/lyricsParser";

export default function NewShowModal() {
  const { 
    isNewShowModalOpen, 
    setNewShowModalOpen, 
    newShowStep, 
    setNewShowStep,
    setActiveMode
  } = useUIStore();
  const { setDraftShow } = useEditorStore();

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [rawText, setRawText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  useEffect(() => {
    if (isNewShowModalOpen) {
      loadCategories();
      // Reset state on open
      setTitle("");
      setArtist("");
      setRawText("");
      setSearchResults([]);
      setSearchQuery("");
      setNewShowStep('setup');
    }
  }, [isNewShowModalOpen]);

  // PROACTIVE SEARCH: Trigger search when entering search step
  useEffect(() => {
    if (newShowStep === 'search' && title) {
      setSearchQuery(title);
      handleSearch(title);
    }
  }, [newShowStep]);

  const loadCategories = async () => {
    const cats = await window.crossenter.getCategories('show');
    setCategories(cats);
    if (cats.length > 0) setCategoryId(cats[0].id);
  };

  const handleCreateEmpty = async () => {
    if (!title) return;
    try {
      console.log(`[Modal] Creating empty show: ${title}`);
      const res = await window.crossenter.saveShow({
        title,
        artist,
        categoryId,
        slides: []
      });
      console.log(`[Modal] Show saved with ID: ${res}`);
      
      const newShow = await window.crossenter.getShowWithSlides(Number(res));
      if (newShow) {
        setDraftShow(newShow, [{ id: `slide-${Date.now()}`, type: 'verse', label: 'Verse 1', text: '' }]);
        setActiveMode('Edit');
      }

      closeModal();
    } catch (err) {
      console.error("[Modal] Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFromLyrics = async () => {
    if (!title || !rawText) return;
    setIsSaving(true);
    try {
      console.log(`[Modal] Creating show from lyrics: ${title}`);
      const parsed = parseLyrics(rawText);
      const res = await window.crossenter.saveShow({
        title: parsed.title || title,
        artist: parsed.artist || artist,
        categoryId,
        slides: parsed.slides
      });
      console.log(`[Modal] Show saved with ID: ${res}`);
      
      const newShow = await window.crossenter.getShowWithSlides(Number(res));
      if (newShow) {
        setDraftShow(newShow, parsed.slides);
        setActiveMode('Edit');
      }

      closeModal();
    } catch (err) {
      console.error("[Modal] Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async (queryOverride?: string) => {
    const query = queryOverride || searchQuery;
    if (!query) return;
    setIsSearching(true);
    try {
      const results = await window.crossenter.searchWebLyrics(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = async (result: any) => {
     // 1. Check if source already provided lyrics (LRCLIB, Letras)
     if (result.instantLyrics) {
        const headerTitle = `Title=${result.title || title}\n`;
        const headerArtist = `Artist=${result.artist || artist}\n\n`;
        setRawText(headerTitle + headerArtist + result.instantLyrics);
        if (result.title) setTitle(result.title);
        if (result.artist) setArtist(result.artist);
        setNewShowStep('quick');
        return;
     }

     // 2. Otherwise Deep-Fetch (Genius, Hymnary)
     setIsFetchingLyrics(true);
     try {
       const lyrics = await window.crossenter.fetchWebLyrics({ id: result.id, source: result.source });
       
       const headerTitle = `Title=${result.title || title}\n`;
       const headerArtist = `Artist=${result.artist || artist}\n\n`;
       
       setRawText(headerTitle + headerArtist + lyrics);
       if (result.title) setTitle(result.title);
       if (result.artist) setArtist(result.artist);
       
       setNewShowStep('quick');
     } catch (err) {
       console.error(`Failed to fetch ${result.source} lyrics:`, err);
     } finally {
       setIsFetchingLyrics(false);
     }
  };

  const closeModal = () => {
    setNewShowModalOpen(false);
  };

  if (!isNewShowModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e24] border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
          <div className="flex items-center gap-3">
             {newShowStep !== 'setup' && (
               <button 
                onClick={() => setNewShowStep('setup')}
                className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-text-ghost"
               >
                 <ChevronLeft size={18} />
               </button>
             )}
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
               New show
             </h2>
          </div>
          <button onClick={closeModal} className="text-text-ghost hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {/* FETCHING OVERLAY */}
          {isFetchingLyrics && (
            <div className="absolute inset-0 z-[100] bg-[#1e1e24]/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
               <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
               <div className="text-sm font-bold text-white animate-pulse">Deep-fetching lyrics...</div>
               <div className="text-[10px] text-text-ghost uppercase tracking-widest">Parsing metadata & structural layers</div>
            </div>
          )}

          {/* STEP 1: SETUP + METHODS */}
          {newShowStep === 'setup' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                    <Music size={12} /> Show Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-text-ghost focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-medium"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest flex items-center gap-2">
                      <User size={12} /> Artist (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hillsong"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-text-ghost focus:outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-ghost uppercase tracking-widest flex items-center gap-2">
                      <Tag size={12} /> Category
                    </label>
                    <select 
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent/50 transition-all appearance-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-[#1e1e24]">{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* DIRECT METHODS */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {[
                  { id: 'quick', title: 'Quick lyrics', icon: Type, color: 'text-accent' },
                  { id: 'search', title: 'Web search', icon: Search, color: 'text-blue-400' },
                  { id: 'empty', title: 'Empty show', icon: Plus, color: 'text-emerald-400' }
                ].map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => {
                      if (!title.trim()) {
                        const input = document.querySelector('input[placeholder="Enter title..."]') as HTMLInputElement;
                        if (input) input.focus();
                        return;
                      }
                      m.id === 'empty' ? handleCreateEmpty() : setNewShowStep(m.id as any);
                    }}
                    className={`flex flex-col items-center justify-center gap-2 p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent/30 transition-all group relative overflow-hidden ${!title.trim() ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <m.icon size={32} className={`${m.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white">{m.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: QUICK LYRICS */}
          {newShowStep === 'quick' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                    <Type size={12} /> Paste Lyrics
                  </label>
                  <span className="text-[10px] text-text-ghost font-mono">
                    Splits on double newlines
                  </span>
                </div>
                <textarea 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Title=Awesome God&#10;Artist=Hillsong&#10;&#10;Our God is an awesome god...&#10;&#10;He reigns from heaven above..."
                  className="w-full h-80 bg-white/5 border border-white/10 rounded-lg p-6 text-white text-sm font-mono placeholder:text-text-ghost focus:outline-none focus:border-accent/50 transition-all resize-none custom-scrollbar"
                  autoFocus
                />
              </div>

              <button 
                disabled={!rawText || isSaving}
                onClick={handleCreateFromLyrics}
                className="w-full py-4 bg-accent disabled:opacity-50 text-white rounded-lg font-bold hover:bg-accent-hi transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                {isSaving ? "Creating..." : `+ Create ${title || 'Show'}`}
              </button>
            </div>
          )}

          {/* STEP 3: WEB SEARCH */}
          {newShowStep === 'search' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative">
                   <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-ghost" />
                   <input 
                    type="text" 
                    placeholder="Search song titles, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-text-ghost focus:outline-none focus:border-accent/50 transition-all"
                    autoFocus
                  />
                </div>

                <div className="border border-white/10 rounded-lg overflow-hidden bg-bg-surface/30">
                   <table className="w-full text-left text-xs">
                     <thead className="bg-white/5 text-text-ghost">
                        <tr>
                          <th className="px-4 py-2 font-bold uppercase tracking-tighter">Song</th>
                          <th className="px-4 py-2 font-bold uppercase tracking-tighter">Artist</th>
                          <th className="px-4 py-2 font-bold uppercase tracking-tighter shrink-0">Source</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {isSearching ? (
                          <tr><td colSpan={3} className="px-4 py-12 text-center text-text-ghost italic">Searching cloud library...</td></tr>
                        ) : searchResults.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-12 text-center text-text-ghost italic">No results found</td></tr>
                        ) : (
                          searchResults.map((r, i) => (
                            <tr 
                              key={i} 
                              onClick={() => selectSearchResult(r)}
                              className="hover:bg-accent/10 cursor-pointer transition-colors group"
                            >
                               <td className="px-4 py-3 font-bold text-accent group-hover:text-accent-hi">{r.title}</td>
                               <td className="px-4 py-3 text-white/70">{r.artist}</td>
                                <td className="px-4 py-3 text-text-ghost font-mono text-[10px]">
                                 <span className={
                                   r.source === 'Genius' ? 'text-purple-400' :
                                   r.source === 'LRCLIB' ? 'text-emerald-400' :
                                   r.source === 'Hymnary' ? 'text-blue-400' :
                                   r.source === 'Letras' ? 'text-orange-400' :
                                   'text-text-ghost'
                                 }>
                                   {r.source}
                                 </span>
                               </td>
                            </tr>
                          ))
                        )}
                     </tbody>
                   </table>
                </div>
             </div>
          )}

        </div>

      </div>
    </div>
  );
}
