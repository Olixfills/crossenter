import { useState, useEffect } from "react";
import { usePresentationStore } from "../../data/presentationStore";
import { 
  Calendar, 
  List, 
  Download, 
  Trash2, 
  PlayCircle,
  Import
} from "lucide-react";

export default function PlaylistsView({ searchQuery }: { searchQuery: string }) {
  const [savedPlaylists, setSavedPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { loadSavedPlaylist, deleteSavedPlaylist } = usePresentationStore();

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const list = await (window as any).crossenter.getPlaylists();
      setSavedPlaylists(list || []);
    } catch (err) {
      console.error("Failed to load playlists", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleLoad = async (id: number) => {
    if (confirm("This will replace your current active playlist. Proceed?")) {
      await loadSavedPlaylist(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this saved preparation?")) {
      await deleteSavedPlaylist(id);
      await fetchPlaylists();
    }
  };

  const handleExport = async (id: number) => {
    try {
      await (window as any).crossenter.exportPlaylist(id);
      console.log("Export successful");
    } catch (err) {
      alert("Failed to export playlist.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await (window as any).crossenter.importPlaylist();
      if (result?.success) {
        await fetchPlaylists();
        if (confirm("Import successful! Would you like to load this playlist now?")) {
          await loadSavedPlaylist(result.playlist.id);
        }
      }
    } catch (err) {
      alert("Failed to import playlist.");
    }
  };

  const filtered = savedPlaylists.filter(p => 
    p?.name?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-base/20">
      {/* Action Header */}
      <div className="p-4 bg-bg-surface/40 border-b border-border-dim/50 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
           <Calendar size={16} className="text-accent" />
           <h2 className="text-xs font-black uppercase tracking-widest text-text-hi">Service Preparations</h2>
        </div>
        <button 
          onClick={handleImport}
          className="px-4 py-2 bg-accent/20 hover:bg-accent/40 text-accent rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-accent/20"
        >
          <Import size={14} strokeWidth={3} />
          Import .CEPL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
             <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Library...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-4/5 text-center p-8 border-2 border-dashed border-border-dim/30 rounded-3xl">
             <div className="w-16 h-16 bg-bg-surface/50 rounded-full flex items-center justify-center mb-4 text-text-ghost">
                <List size={32} />
             </div>
             <p className="text-xs font-bold text-text-hi uppercase tracking-widest mb-1">No Preparations Found</p>
             <p className="text-[10px] text-text-ghost max-w-[200px]">Save your current playlist layout using the header "Save" action to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((pl) => (
              <div 
                key={pl.id}
                className="group relative bg-bg-surface/30 border border-border-dim/40 p-4 rounded-xl hover:bg-bg-surface/60 hover:border-accent/30 hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-black text-text-hi group-hover:text-accent transition-colors truncate">
                      {pl.name}
                    </h3>
                    <p className="text-[9px] text-text-ghost mt-0.5 font-bold flex items-center gap-1 opacity-60">
                      <Calendar size={8} />
                      {new Date(pl.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight">
                     <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/10 text-accent">
                        {pl.items_count || '0'} Items
                     </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-border-dim/20">
                    <button 
                      onClick={() => handleLoad(pl.id)}
                      className="flex-1 py-1.5 bg-accent hover:bg-accent-hi text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-accent/10"
                    >
                      <PlayCircle size={12} strokeWidth={3} />
                      Load
                    </button>
                    <div className="flex gap-1.5">
                       <button 
                        onClick={() => handleExport(pl.id)}
                        title="Export CEPL"
                        className="p-1.5 bg-bg-base/40 hover:bg-accent/10 text-text-ghost hover:text-accent rounded-lg border border-border-dim transition-all active:scale-90"
                      >
                         <Download size={12} />
                      </button>
                       <button 
                        onClick={() => handleDelete(pl.id)}
                        title="Delete"
                        className="p-1.5 bg-bg-base/40 hover:bg-red-500/10 text-text-ghost hover:text-red-500 rounded-lg border border-border-dim transition-all active:scale-90"
                      >
                         <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
