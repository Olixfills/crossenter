import { useState, useEffect, useRef } from "react";
import { usePresentationStore } from "../../data/presentationStore";
import { useDraggable } from "@dnd-kit/core";
import { 
  LayoutGrid, 
  List, 
  Search, 
  ExternalLink
} from "lucide-react";

// ── Type definitions for IPC data ────────────────────
interface Bible {
  id: number;
  name: string;
  abbreviation: string;
}

interface BibleBook {
  id: number;
  name: string;
  book_number: number;
}

interface Verse {
  id: number;
  verse_number: number;
  text: string;
}

// ── Sub-component: Draggable Verse Row ────────────────────
function DraggableVerseRow({ 
  verse, 
  verses,
  viewMode, 
  previewVerse, 
  selectedVerseIds,
  selectedBookId,
  selectedChapter,
  books,
  bibles,
  selectedBibleId,
  onClick, 
  onDoubleClick 
}: { 
  verse: Verse; 
  verses: Verse[];
  viewMode: 'grid' | 'list';
  previewVerse: Verse | null;
  selectedVerseIds: number[];
  selectedBookId: number | null;
  selectedChapter: number;
  books: BibleBook[];
  bibles: Bible[];
  selectedBibleId: number | null;
  onClick: (e: React.MouseEvent) => void; 
  onDoubleClick: () => void;
}) {
  const bookName = books.find(b => b.id === selectedBookId)?.name || '...';
  const bible = bibles.find(b => b.id === selectedBibleId);
  const version = bible?.abbreviation || bible?.name || '';
  const isSelected = selectedVerseIds.includes(verse.id);
  const isPreview = previewVerse?.id === verse.id;

  // If part of a selection, bundle the full reference label
  let refBase = `${bookName} ${selectedChapter}:${verse.verse_number}`;
  if (selectedVerseIds.length > 1 && isSelected) {
    const sortedIds = [...selectedVerseIds].sort((a,b) => a-b);
    const startV = verses.find(v => v.id === sortedIds[0])?.verse_number;
    const endV = verses.find(v => v.id === sortedIds[sortedIds.length-1])?.verse_number;
    if (startV && endV) {
      refBase = `${bookName} ${selectedChapter}:${startV}-${endV}`;
    }
  }

  const referenceLabel = version ? `${refBase} (${version})` : refBase;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib-verse-${verse.id}`,
    data: {
      type: 'library',
      item: {
        id: verse.id,
        type: 'scripture',
        title: referenceLabel,
        metadata: {
          title: referenceLabel,
          bookId: selectedBookId,
          chapter: selectedChapter,
          verseIds: isSelected ? selectedVerseIds : [verse.id]
        }
      }
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <button 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      id={`verse-${verse.id}`}
      onClick={(e) => onClick(e)}
      onDoubleClick={onDoubleClick}
      className={`group flex transition-all text-left items-start ${
        viewMode === 'grid'
          ? `gap-3 p-3.5 rounded-xl border ${
              isSelected || isPreview
                ? 'bg-accent/10 border-accent' 
                : 'bg-bg-surface/40 border-border-dim hover:bg-white/5'
            }`
          : `gap-4 px-4 py-2 border-b border-border-dim/30 hover:bg-white/5 ${
              isSelected || isPreview ? 'bg-accent/5' : ''
            }`
      } ${isDragging ? "opacity-40 cursor-grabbing" : "cursor-grab"}`}
    >
      <span className={`font-black text-[10px] mt-0.5 ${
        isSelected || isPreview ? 'text-accent' : 'text-text-ghost'
      }`}>
        {verse.verse_number}
      </span>
      <p className={`text-xs leading-relaxed transition-colors ${
        isSelected || isPreview ? 'text-text-hi font-medium' : 'text-text-lo'
      } ${viewMode === 'grid' ? 'line-clamp-4' : ''}`}>
         {verse.text}
      </p>
    </button>
  );
}

export default function ScriptureView({ searchQuery: externalSearchQuery }: { searchQuery: string }) {
  // Database State
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  
  // Selection State
  const [selectedBibleId, setSelectedBibleId] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [chapterCount, setChapterCount] = useState<number>(0);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [previewVerse, setPreviewVerse] = useState<Verse | null>(null);
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  const [pivotVerseId, setPivotVerseId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input Refs for Fast Entry
  const bookInputRef = useRef<HTMLInputElement>(null);
  const chapterInputRef = useRef<HTMLInputElement>(null);
  const verseInputRef = useRef<HTMLInputElement>(null);

  // Fast Entry State
  const [bookSearch, setBookSearch] = useState("");
  const [bookSuggestion, setBookSuggestion] = useState("");
  const [chapterEntry, setChapterEntry] = useState("");
  const [verseEntry, setVerseEntry] = useState("");
  const [refSearch, setRefSearch] = useState("");

  // Logic for Book Suggestion (Autocomplete)
  useEffect(() => {
    if (!bookSearch) {
      setBookSuggestion("");
      return;
    }
    const match = books.find(b => b.name.toLowerCase().startsWith(bookSearch.toLowerCase()));
    setBookSuggestion(match ? match.name : "");
  }, [bookSearch, books]);

  const { goLiveExternal, liveSlideId } = usePresentationStore();

  // 1. Initial Load: Fetch Bibles
  useEffect(() => {
    loadBibles();
  }, []);

  const loadBibles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[ScriptureView] Calling getBibles...");
      const list = await (window as any).crossenter.getBibles();
      console.log("[ScriptureView] Bibles received:", list?.length || 0);
      setBibles(list || []);
      if (list && list.length > 0 && !selectedBibleId) {
        setSelectedBibleId(list[0].id);
      }
    } catch (err) {
      console.error("[ScriptureView] loadBibles failed:", err);
      setError("Failed to load Bible versions.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Books when Bible changes
  useEffect(() => {
    if (selectedBibleId) {
      loadBooks(selectedBibleId);
    }
  }, [selectedBibleId]);

  const loadBooks = async (bibleId: number) => {
    try {
      const list = await (window as any).crossenter.getBooks(bibleId);
      setBooks(list || []);
      if (list && list.length > 0 && !selectedBookId) {
        setSelectedBookId(list[0].id);
        setSelectedChapter(1);
      }
    } catch (err) {
      console.error("[ScriptureView] loadBooks failed:", err);
    }
  };

  // 3. Fetch Chapter Count and Verses when Book changes
  useEffect(() => {
    if (selectedBookId) {
      loadChapterCount(selectedBookId);
      loadVerses(selectedBookId, selectedChapter);
    }
  }, [selectedBookId, selectedChapter]);

  // 4. Scroll to Selection Sidebars
  useEffect(() => {
    if (selectedBookId) {
      const el = document.getElementById(`book-${selectedBookId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedBookId]);

  useEffect(() => {
    if (selectedChapter) {
      const el = document.getElementById(`chapter-${selectedChapter}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedChapter]);

  useEffect(() => {
    if (previewVerse) {
      const el = document.getElementById(`verse-${previewVerse.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [previewVerse?.id]);

  const loadChapterCount = async (bookId: number) => {
    try {
      const count = await (window as any).crossenter.getChapterCount(bookId);
      setChapterCount(count || 0);
    } catch (err) {
      console.error("[ScriptureView] loadChapterCount failed:", err);
    }
  };

  const loadVerses = async (bookId: number, chapter: number) => {
    try {
      const list = await (window as any).crossenter.getVerses(bookId, chapter);
      setVerses(list || []);
      setSelectedVerseIds([]);
      setPivotVerseId(null);
      // If we have a verse entry, try to find it
      if (verseEntry) {
         parseAndSelectVerses(verseEntry, list || []);
      }
    } catch (err) {
      console.error("[ScriptureView] loadVerses failed:", err);
    }
  };

  const parseAndSelectVerses = (input: string, verseList: Verse[]) => {
    if (input.includes('-')) {
       const [start, end] = input.split('-').map(s => parseInt(s.trim()));
       if (!isNaN(start) && !isNaN(end)) {
          const range = verseList.filter(v => v.verse_number >= start && v.verse_number <= end);
          if (range.length > 0) {
             setSelectedVerseIds(range.map(v => v.id));
             setPreviewVerse(range[0]);
          }
       }
    } else {
       const vNum = parseInt(input);
       const target = verseList.find(v => v.verse_number === vNum);
       if (target) {
          setPreviewVerse(target);
          setSelectedVerseIds([target.id]);
       }
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await (window as any).crossenter.importBible();
      if (result?.success) {
        await loadBibles();
        setSelectedBibleId(result.bibleId);
      }
    } catch (e) {
      console.error("Import failed", e);
    } finally {
      setIsImporting(false);
    }
  };

  const getSlidePayload = (verse: Verse) => {
    const bible = bibles.find(b => b.id === selectedBibleId);
    const book = books.find(b => b.id === selectedBookId);
    const ref = `${book?.name} ${selectedChapter}:${verse.verse_number}`;
    const version = bible?.abbreviation || bible?.name || '';
    
    return {
      id: `verse-${verse.id}`,
      text: verse.text,
      label: version ? `${ref} (${version})` : ref,
      type: 'scripture' as const,
      showTitle: bible?.name || 'Scripture'
    };
  };

  const handleVerseLive = (verse: Verse) => {
    goLiveExternal(getSlidePayload(verse));
  };

  const handleVerseClick = (verse: Verse, e: React.MouseEvent) => {
    setPreviewVerse(verse);
    
    // A. NON-CONTIGUOUS TOGGLE (Cmd/Ctrl)
    if (e.metaKey || e.ctrlKey) {
       setSelectedVerseIds(prev => 
          prev.includes(verse.id) 
            ? prev.filter(id => id !== verse.id) 
            : [...prev, verse.id]
       );
       setPivotVerseId(verse.id);
    } 
    // B. RANGE SELECT (Shift)
    else if (e.shiftKey && pivotVerseId !== null) {
       const pivotIdx = verses.findIndex(v => v.id === pivotVerseId);
       const currentIdx = verses.findIndex(v => v.id === verse.id);
       
       if (pivotIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(pivotIdx, currentIdx);
          const end = Math.max(pivotIdx, currentIdx);
          const range = verses.slice(start, end + 1).map(v => v.id);
          
          setSelectedVerseIds(range);
       }
    } 
    // C. SINGLE SELECT (Normal Click)
    else {
       setSelectedVerseIds([verse.id]);
       setPivotVerseId(verse.id);
    }

    // If a scripture is already live, single click updates the live output
    const { liveSlide } = usePresentationStore.getState();
    if (liveSlide?.type === 'scripture') {
      handleVerseLive(verse);
    }
  };

  const handleBookSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const match = books.find(b => b?.name?.toLowerCase().startsWith(bookSearch.toLowerCase()));
      if (match) {
        e.preventDefault();
        setSelectedBookId(match.id);
        setSelectedChapter(1);
        setBookSearch(match.name);
        setBookSuggestion("");
        chapterInputRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      const match = books.find(b => b?.name?.toLowerCase().startsWith(bookSearch.toLowerCase()));
      if (match) {
        setSelectedBookId(match.id);
        setSelectedChapter(1);
        setBookSearch(match.name);
        setBookSuggestion("");
        // If Enter is pressed, we try to go live with chapter 1 verse 1 or current preview
        loadVerses(match.id, 1).then(() => {
          // We'll handle going live in the next tick once verses are loaded or just project ch 1
          // For now, let's just focus chapter so user can confirm
          chapterInputRef.current?.focus();
        });
      }
    }
  };

  const handleChapterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const ch = parseInt(chapterEntry);
      if (ch > 0 && ch <= chapterCount) {
        e.preventDefault();
        setSelectedChapter(ch);
        verseInputRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      const ch = parseInt(chapterEntry);
      if (ch > 0 && ch <= chapterCount) {
        setSelectedChapter(ch);
        // Project first verse of this chapter
        loadVerses(selectedBookId!, ch).then((loadedVerses) => {
           if (loadedVerses && (loadedVerses as any).length > 0) {
              handleVerseLive((loadedVerses as any)[0]);
           }
        });
      }
    }
  };

  const handleVerseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
       e.preventDefault();
       parseAndSelectVerses(verseEntry, verses);
       // Scroll into view logic is already in useEffect for previewVerse
    } else if (e.key === 'Enter') {
       parseAndSelectVerses(verseEntry, verses);
       // Select and project
       const vNum = parseInt(verseEntry);
       const target = verses.find(v => v.verse_number === vNum);
       if (target) {
          handleVerseLive(target);
       }
    }
  };

  const handleReferenceSearch = async () => {
    if (!refSearch.trim()) return;

    // Regex to capture: Book (with optional number), Chapter, optional Verse range
    // Example: "1 John 3:16-18", "John 3", "Genesis 1:1"
    const regex = /^((?:\d\s+)?[a-zA-Z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i;
    const match = refSearch.trim().match(regex);

    if (match) {
      const bookName = match[1].toLowerCase();
      const chapter = parseInt(match[2]);
      const verseStart = match[3] ? parseInt(match[3]) : null;
      const verseEnd = match[4] ? parseInt(match[4]) : null;

      // Find book
      const book = books.find(b => b.name.toLowerCase().startsWith(bookName) || b.name.toLowerCase().includes(bookName));
      if (book) {
        setSelectedBookId(book.id);
        setSelectedChapter(chapter);
        
        // Clear inputs
        setRefSearch("");
        setBookSearch("");
        setChapterEntry("");
        setVerseEntry("");

        // Load verses and project
        const chapterVerses = await (window as any).crossenter.getVerses(book.id, chapter);
        setVerses(chapterVerses || []);

        if (verseStart) {
          const vStr = verseEnd ? `${verseStart}-${verseEnd}` : `${verseStart}`;
          parseAndSelectVerses(vStr, chapterVerses || []);
          
          // Wait a tick for state update or use the local data
          const targetVerse = chapterVerses.find((v: any) => v.verse_number === verseStart);
          if (targetVerse) {
            handleVerseLive(targetVerse);
          }
        } else {
          // If no verse specified, just go to chapter
          setSelectedVerseIds([]);
          setPreviewVerse(null);
        }
      }
    }
  };

  // Filter for sidebar
  const filteredBooks = books.filter(b => 
    b.name.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.name.toLowerCase().includes(externalSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-bg-base/20">
      
      {/* 1. Books Sidebar */}
      <aside className="w-48 border-r border-border-dim bg-bg-base/40 flex flex-col shrink-0">
        <div className="p-3 text-[10px] font-bold text-text-ghost uppercase tracking-widest border-b border-border-dim/50 bg-bg-base/30">
          Library / Books
        </div>
        <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          {filteredBooks.map(book => (
            <button 
              key={book.id} 
              id={`book-${book.id}`}
              onClick={() => {
                setSelectedBookId(book.id);
                setSelectedChapter(1);
                setPreviewVerse(null);
              }}
              className={`w-full text-left px-4 py-2 text-xs transition-all truncate border-l-2 ${
                selectedBookId === book.id 
                  ? 'text-accent font-bold bg-accent/10 border-accent' 
                  : 'text-text-lo hover:bg-white/5 border-transparent'
              }`}
            >
              {book.name}
            </button>
          ))}
        </div>
      </aside>

      {/* 2. Chapters Selection */}
      <aside className="w-20 border-r border-border-dim bg-bg-base/20 flex flex-col shrink-0">
        <div className="p-3 text-[10px] font-bold text-text-ghost uppercase tracking-widest border-b border-border-dim/50 text-center bg-bg-base/30">
          Ch
        </div>
        <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
          {Array.from({ length: chapterCount || 0 }, (_, i) => (
            <button 
              key={i} 
              id={`chapter-${i + 1}`}
              onClick={() => {
                setSelectedChapter(i + 1);
                setPreviewVerse(null);
              }}
              className={`w-full text-center py-2.5 text-xs transition-all ${selectedChapter === i + 1 ? 'text-accent font-bold bg-accent/10' : 'text-text-lo hover:bg-bg-hover'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </aside>

      {/* 3. Main Workspace (Verses) */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-base/10 relative">
        
        {/* Fast Entry Header */}
        <div className="p-3 bg-bg-surface/60 border-b border-border-dim flex flex-col gap-3 backdrop-blur-md">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="flex bg-bg-base/50 rounded-lg p-0.5 border border-border-dim shadow-inner">
                     <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-accent text-white shadow-lg' : 'text-text-ghost hover:text-text-lo'}`}
                    >
                       <LayoutGrid size={14} strokeWidth={2.5} />
                    </button>
                     <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow-lg' : 'text-text-ghost hover:text-text-lo'}`}
                    >
                       <List size={14} strokeWidth={2.5} />
                    </button>
                 </div>
                 <span className="text-xs font-bold text-text-hi ml-2">
                    {books.find(b => b.id === selectedBookId)?.name || '...'} {selectedChapter}
                 </span>
              </div>
              <select 
                value={selectedBibleId || ""} 
                onChange={(e) => setSelectedBibleId(Number(e.target.value))}
                className="bg-bg-surface border border-border-dim text-[10px] px-2 py-1.5 rounded-lg outline-none text-text-lo font-bold shadow-sm"
              >
                {bibles.map((v: Bible) => <option key={v.id} value={v.id}>{v.abbreviation || v.name}</option>)}
              </select>
           </div>
 
           {/* 3-Field Input + Reference Search */}
           <div className="flex items-center gap-2">
              {/* Complex Book Search with Ghost Autocomplete */}
              <div className="relative w-32 group shrink-0">
                 <Search size={12} className="absolute left-2.5 top-2.5 text-text-ghost group-focus-within:text-accent transition-colors z-30" strokeWidth={2.5} />
                 
                 {/* Ghost Suggestion Layer — Fixed: moved to z-20 above input but pointer-events-none */}
                 {bookSearch && bookSuggestion && (
                   <div className="absolute inset-0 pl-7 pr-3 py-2 text-xs text-text-ghost/40 pointer-events-none z-20 font-medium overflow-hidden whitespace-nowrap">
                     <span className="opacity-0">{bookSearch}</span>
                     <span>{bookSuggestion.slice(bookSearch.length)}</span>
                   </div>
                 )}

                 <input 
                    ref={bookInputRef}
                    type="text"
                    placeholder="Book"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    onKeyDown={handleBookSearchKeyDown}
                    className="w-full bg-bg-base/80 border border-border-dim rounded-lg pl-7 pr-2 py-1.5 text-xs text-text-hi placeholder:text-text-ghost/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all relative z-10"
                 />
              </div>

              {/* Chapter Input */}
              <div className="w-12 shrink-0 relative">
                <input 
                  ref={chapterInputRef}
                  type="text"
                  placeholder="Ch"
                  value={chapterEntry}
                  onChange={(e) => setChapterEntry(e.target.value)}
                  onKeyDown={handleChapterKeyDown}
                  className="w-full bg-bg-base/80 border border-border-dim rounded-lg px-2 py-1.5 text-xs text-center text-text-hi focus:border-accent outline-none transition-all"
                />
              </div>

              {/* Verse Input */}
              <div className="w-12 shrink-0 relative">
                <input 
                  ref={verseInputRef}
                  type="text"
                  placeholder="Vs"
                  value={verseEntry}
                  onChange={(e) => setVerseEntry(e.target.value)}
                  onKeyDown={handleVerseKeyDown}
                  className="w-full bg-bg-base/80 border border-border-dim rounded-lg px-2 py-1.5 text-xs text-center text-text-hi focus:border-accent outline-none transition-all"
                />
              </div>

              {/* Separator */}
              <div className="h-4 w-[1px] bg-border-dim/50 mx-1 shrink-0" />

              {/* Omnibox Style Reference Search */}
              <div className="relative flex-1 group">
                 <Search size={12} className="absolute left-2.5 top-2.5 text-text-ghost group-focus-within:text-accent transition-colors z-20" strokeWidth={2.5} />
                 <input 
                    type="text"
                    placeholder="Reference Search (e.g. John 3:16)"
                    value={refSearch}
                    onChange={(e) => setRefSearch(e.target.value)}
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          handleReferenceSearch();
                       }
                    }}
                    className="w-full bg-bg-base/80 border border-border-dim rounded-lg pl-7 pr-3 py-1.5 text-xs text-text-hi placeholder:text-text-ghost/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                 />
                 <div className="absolute right-2 top-2 text-[7px] font-black text-white bg-accent px-1 py-0.5 rounded border border-accent/20 shadow-sm leading-none">REF</div>
              </div>
           </div>
        </div>
        
        {/* Verses Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-base/40 backdrop-blur-sm z-50">
               <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
               <div className="text-[10px] font-bold text-text-ghost uppercase tracking-widest animate-pulse">Connecting to Bibles...</div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg-base/40 p-12 text-center">
               <div className="text-accent bg-accent/10 p-4 rounded-full mb-2">
                 <Search size={32} />
               </div>
               <h3 className="text-sm font-bold text-text-hi">{error}</h3>
               <p className="text-xs text-text-ghost">Please check if your Bible database is correctly initialized or try restarting the app.</p>
               <button 
                onClick={loadBibles}
                className="mt-4 px-6 py-2 bg-accent/20 hover:bg-accent/40 text-accent rounded-lg text-[10px] font-bold uppercase transition-all"
               >
                 Retry Connection
               </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3" 
              : "flex flex-col gap-1"
            }>
              {verses.map((verse) => (
                <DraggableVerseRow
                  key={verse.id}
                  verse={verse}
                  verses={verses}
                  viewMode={viewMode}
                  previewVerse={previewVerse}
                  selectedVerseIds={selectedVerseIds}
                  selectedBookId={selectedBookId}
                  selectedChapter={selectedChapter}
                  books={books}
                  bibles={bibles}
                  selectedBibleId={selectedBibleId}
                  onClick={(e) => handleVerseClick(verse, e)}
                  onDoubleClick={() => handleVerseLive(verse)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer info for Scripture */}
        <div className="px-4 py-2 flex items-center justify-between bg-bg-base/30 text-[10px] text-text-ghost border-t border-border-dim shrink-0">
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${bibles.length > 0 ? 'bg-accent shadow-[0_0_8px_var(--accent)]' : 'bg-red-500'}`} />
             <span>{bibles.length} Versions installed</span>
             <span className="opacity-30">|</span>
             <span>Double-click to go live</span>
          </div>
          <button 
            disabled={isImporting}
            onClick={handleImport}
            className="text-accent font-bold hover:underline disabled:opacity-50 transition-all"
          >
            {isImporting ? 'Parsing XML...' : 'Import Bible...'}
          </button>
        </div>
      </div>

      {/* 4. Mini Preview Sidebar */}
      <aside className="w-64 border-l border-border-dim bg-bg-base/50 flex flex-col shrink-0 overflow-hidden backdrop-blur-sm">
        <div className="p-3 text-[10px] font-bold text-text-ghost uppercase tracking-widest border-b border-border-dim/50 bg-bg-base/30">
          Verse Preview
        </div>
        
        {/* Scrollable Preview Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar min-h-0">
           {/* Visual Mock of Output */}
           <div className="aspect-video bg-black rounded-lg border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-4 relative group shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
              {previewVerse ? (
                <>
                  <p className="text-[10px] leading-relaxed text-center font-medium line-clamp-6">
                    {previewVerse.text}
                  </p>
                  <div className="mt-2 text-[8px] opacity-40 font-bold uppercase tracking-tighter">
                   {books.find(b => b.id === selectedBookId)?.name} {selectedChapter}:{previewVerse.verse_number}
                  </div>
                </>
              ) : (
                <div className="text-[10px] text-text-ghost italic text-center">
                   Select a verse to preview
                </div>
              )}
           </div>

           {previewVerse && (
             <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
                <div className="p-3 rounded-lg bg-bg-surface/40 border border-border-dim">
                   <h4 className="text-[10px] font-bold text-accent mb-1 uppercase">Reference</h4>
                   <p className="text-xs text-text-hi">
                    {books.find(b => b.id === selectedBookId)?.name} {selectedChapter}:{previewVerse.verse_number}
                   </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-surface/40 border border-border-dim">
                   <h4 className="text-[10px] font-bold text-accent mb-1 uppercase">Bible Version</h4>
                   <p className="text-xs text-text-hi">
                    {bibles.find(b => b.id === selectedBibleId)?.name}
                   </p>
                </div>
             </div>
           )}
        </div>

        {/* Fixed Action Footer */}
        <footer className="p-4 bg-bg-base/40 border-t border-border-dim/50 flex flex-col gap-2 shrink-0">
           {previewVerse && (
             <button 
                onClick={() => handleVerseLive(previewVerse)}
                className="w-full py-2.5 rounded-lg bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={12} strokeWidth={3} />
                Project to Main
              </button>
           )}

           {liveSlideId && String(liveSlideId).startsWith('verse') && (
            <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center gap-2 animate-pulse">
               <div className="w-1.5 h-1.5 rounded-full bg-accent" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Live on Output</span>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}
