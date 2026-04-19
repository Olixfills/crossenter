import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import LeftPane from '../components/LeftPane'
import CenterPane from '../components/CenterPane'
import RightPane from '../components/RightPane'
import LibraryPane from '../components/LibraryPane'
import ResizeHandle from '../components/ResizeHandle'
import NewShowModal from '../components/modals/NewShowModal'
import { useUIStore } from '../data/store'
import { usePresentationStore } from '../data/presentationStore'
import SavePlaylistModal from '../components/modals/SavePlaylistModal'
import EditorLayout from '../components/editor/EditorLayout'
import StageDashboard from '../components/stage/StageDashboard'
import { 
  DndContext, 
  useDroppable, 
  rectIntersection,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable'
import { 
  Music, 
  BookOpen, 
  PlayCircle, 
  Layout, 
  Theater 
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Control Panel Window
// Unified DnD Root for the entire application.
// ─────────────────────────────────────────────────────────────────────────────

const TypeIcons: Record<string, any> = {
  song:        Music,
  scripture:   BookOpen,
  media:       PlayCircle,
  presentation: Layout,
  recital:     Theater,
}

function DropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: 'playlist-container' });
  return <div ref={setNodeRef} className="flex h-full">{children}</div>;
}

export default function ControlPanel() {
  const { 
    leftPaneWidth, setLeftPaneWidth, 
    rightPaneWidth, setRightPaneWidth,
    bottomPaneHeight, setBottomPaneHeight,
    isFocusMode, activeMode,
    setSavePlaylistModalOpen
  } = useUIStore()

  const { 
    activePlaylist, 
    playlistItems, 
    reorderPlaylistItems,
    nextSlide, 
    prevSlide 
  } = usePresentationStore()

  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 8 } 
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over || !activePlaylist) return;

    // A. Handle REORDERING within the Playlist
    if (active.id !== over.id && playlistItems.find(i => i.id === active.id)) {
      const oldIndex = playlistItems.findIndex((item) => item.id === active.id);
      const newIndex = playlistItems.findIndex((item) => item.id === over.id);
      
      const newItems = arrayMove(playlistItems, oldIndex, newIndex);
      await reorderPlaylistItems(newItems);
      return;
    }

    // B. Handle ADDITION/INSERTION from Library to Playlist
    if (active.data.current?.type === 'library') {
      const overIndex = playlistItems.findIndex(i => i.id === over.id);
      const libraryItem = active.data.current.item;
      
      let updated = [...playlistItems];
      const insertAt = overIndex !== -1 ? overIndex : playlistItems.length;

      const newItem: any = {
        id: Date.now(),
        playlist_id: activePlaylist.id,
        type: libraryItem.type,
        reference_id: libraryItem.id,
        title: libraryItem.title,
        metadata: libraryItem.metadata || {},
        sort_order: insertAt
      };

      if (overIndex !== -1) {
        updated.splice(overIndex, 0, newItem);
      } else if (over.id === 'playlist-container') {
        updated.push(newItem);
      } else {
        return; // Not dropped over valid target
      }
      
      await reorderPlaylistItems(updated);
    }
  };

  // ── Keyboard Navigation ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow shortcuts even if input is focused if it's a modifier key combo
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      
      if (isInput && !e.metaKey && !e.ctrlKey) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setSavePlaylistModalOpen(true);
        return;
      }

      if (isInput) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); prevSlide();
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, setSavePlaylistModalOpen])

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={rectIntersection} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex flex-col h-full w-full overflow-hidden select-none"
        style={{ background: '#16161b' }}
      >
        <TopNav />

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {activeMode === 'Edit' ? (
            <EditorLayout />
          ) : activeMode === 'Stage' ? (
            <StageDashboard />
          ) : (
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <DropZone>
                  <LeftPane />
                </DropZone>
                
                <ResizeHandle onResize={(d) => setLeftPaneWidth(Math.max(180, leftPaneWidth + d))} />
                <CenterPane />
              </div>

              {!isFocusMode && (
                 <div 
                   className="flex flex-col shrink-0" 
                   style={{ height: bottomPaneHeight, minHeight: 120, maxHeight: '80%' }}
                 >
                    <ResizeHandle direction="vertical" onResize={(d) => setBottomPaneHeight(Math.max(120, bottomPaneHeight - d))} />
                    <div className="flex-1 overflow-hidden bg-bg-base">
                       <LibraryPane />
                    </div>
                 </div>
              )}
            </div>
          )}

          {activeMode !== 'Edit' && activeMode !== 'Stage' && (
            <>
              <ResizeHandle onResize={(d) => setRightPaneWidth(Math.max(180, rightPaneWidth - d))} />
              <RightPane />
            </>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-accent shadow-2xl rounded-lg border border-white/20 scale-105 opacity-90 cursor-grabbing">
            {(() => {
               const Icon = TypeIcons[activeDragItem.item?.type] || Music;
               return <Icon size={14} className="text-white" />;
            })()}
            <span className="text-xs font-bold text-white truncate max-w-[150px]">
              {activeDragItem.item?.title || "Dragging item..."}
            </span>
          </div>
        ) : null}
      </DragOverlay>

      <NewShowModal />
      <SavePlaylistModal />
    </DndContext>
  )
}
