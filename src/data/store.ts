import { create } from 'zustand'

export type AppMode = 'Show' | 'Edit' | 'Stage' | 'Draw' | 'Calendar' | 'Templates'

interface UIState {
  activeMode: AppMode
  setActiveMode: (mode: AppMode) => void
  
  // Sidebar widths
  leftPaneWidth: number
  setLeftPaneWidth: (width: number) => void
  rightPaneWidth: number
  setRightPaneWidth: (width: number) => void
  
  // Focus mode (Fullscreen style)
  isFocusMode: boolean
  setFocusMode: (focus: boolean) => void

  // Bottom Pane Height
  bottomPaneHeight: number
  setBottomPaneHeight: (height: number) => void

  // New Show Modal Flow
  isNewShowModalOpen: boolean
  setNewShowModalOpen: (open: boolean) => void
  newShowStep: 'setup' | 'method' | 'quick' | 'search'
  setNewShowStep: (step: 'setup' | 'method' | 'quick' | 'search') => void

  isSavePlaylistModalOpen: boolean
  setSavePlaylistModalOpen: (open: boolean) => void

  isAddLinkModalOpen: boolean
  setAddLinkModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeMode: 'Show',
  setActiveMode: (mode) => set({ activeMode: mode }),
  
  leftPaneWidth: 260,
  setLeftPaneWidth: (width) => set({ leftPaneWidth: width }),
  rightPaneWidth: 260,
  setRightPaneWidth: (width) => set({ rightPaneWidth: width }),
  
  isFocusMode: false,
  setFocusMode: (focus) => set({ isFocusMode: focus }),

  bottomPaneHeight: 320,
  setBottomPaneHeight: (height) => set({ bottomPaneHeight: height }),

  isNewShowModalOpen: false,
  setNewShowModalOpen: (open) => set({ isNewShowModalOpen: open }),
  newShowStep: 'setup',
  setNewShowStep: (step) => set({ newShowStep: step }),

  isSavePlaylistModalOpen: false,
  setSavePlaylistModalOpen: (open) => set({ isSavePlaylistModalOpen: open }),

  isAddLinkModalOpen: false,
  setAddLinkModalOpen: (open) => set({ isAddLinkModalOpen: open }),
}))
