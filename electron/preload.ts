import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('crossenter', {
  version: '1.0.0',
  platform: process.platform,

  openOutputWindow: () => ipcRenderer.invoke('window:open-output'),
  openStageWindow: () => ipcRenderer.invoke('window:open-stage'),
  getAppPath: () => ipcRenderer.invoke('app:get-path'),

  // Bible APIs
  importBible: () => ipcRenderer.invoke('bible:import'),
  getBibles: () => {
    console.log("[Preload] Invoking bible:get-all");
    return ipcRenderer.invoke('bible:get-all');
  },
  getBooks: (bibleId: number) => ipcRenderer.invoke('bible:get-books', bibleId),
  getVerses: (bookId: number, chapter: number) => ipcRenderer.invoke('bible:get-verses', bookId, chapter),
  getChapterCount: (id: number) => ipcRenderer.invoke('bible:get-chapter-count', id),
  deleteBible: (id: number) => ipcRenderer.invoke('bible:delete', id),

  // Shows
  getShows: (categoryId?: number) => ipcRenderer.invoke('show:get-all', categoryId),
  getShowWithSlides: (id: number) => ipcRenderer.invoke('show:get-with-slides', id),
  saveShow: (data: { title: string; artist?: string; categoryId?: number; slides: any[] }) => ipcRenderer.invoke('show:save', data),
  deleteShow: (id: number) => ipcRenderer.invoke('show:delete', id),

  // Categories
  getCategories: (type: string) => ipcRenderer.invoke('category:get-all', type),
  addCategory: (data: { name: string; type: string }) => ipcRenderer.invoke('category:add', data),

  // Playlists
  getActivePlaylist: () => ipcRenderer.invoke('playlist:get-active'),
  updatePlaylistItems: (data: { playlistId: number; items: any[] }) => ipcRenderer.invoke('playlist:update-items', data),
  getPlaylists: () => ipcRenderer.invoke('playlist:get-all'),
  savePlaylistAs: (name: string, items: any[]) => ipcRenderer.invoke('playlist:save-as', { name, items }),
  renamePlaylist: (id: number, name: string) => ipcRenderer.invoke('playlist:rename', { id, name }),
  saveDraftSlides: (showId: number, slides: any[], settings?: any) => ipcRenderer.invoke('show:save-draft', showId, slides, settings),
  deletePlaylist: (id: number) => ipcRenderer.invoke('playlist:delete', id),
  getPlaylistDetails: (id: number) => ipcRenderer.invoke('playlist:get-details', id),
  exportPlaylist: (id: number) => ipcRenderer.invoke('playlist:export', id),
  importPlaylist: () => ipcRenderer.invoke('playlist:import'),

  // Media
  getAllMedia: (typeFilter?: string) => ipcRenderer.invoke('media:get-all', typeFilter),
  importMediaFiles: (filePaths: string[]) => ipcRenderer.invoke('media:import-local-files', filePaths),
  addMediaLink: (data: { name: string; type: string; url: string }) => ipcRenderer.invoke('media:add-link', data),
  openMediaDialog: () => ipcRenderer.invoke('media:open-dialog'),
  deleteMedia: (id: number, filePath?: string, isLink: boolean = false) => ipcRenderer.invoke('media:delete', { id, filePath, isLink }),

  // Search
  searchWebLyrics: (query: string) => ipcRenderer.invoke('search-web-lyrics', query),
  fetchWebLyrics: (data: { id: any, source: string }) => ipcRenderer.invoke('fetch-web-lyrics', data),

  // Events
  onShowsUpdated: (callback: () => void) => {
    const subscription = (_event: any) => callback();
    ipcRenderer.on('show:list-updated', subscription);
    return () => ipcRenderer.removeListener('show:list-updated', subscription);
  }
})

// Type declaration for renderer TypeScript access
export type CrossenterBridge = {
  version: string
  platform: NodeJS.Platform
  openOutputWindow: () => Promise<void>
  openStageWindow: () => Promise<void>
  getAppPath: () => Promise<string>
  
  // Bible APIs
  importBible: () => Promise<{ success: boolean; bibleId: number; name: string } | null>
  getBibles: () => Promise<any[]>
  getBooks: (bibleId: number) => Promise<any[]>
  getVerses: (bookId: number, chapter: number) => Promise<any[]>
  getChapterCount: (bookId: number) => Promise<number>
  deleteBible: (id: number) => Promise<void>

  // Shows
  getShows: (categoryId?: number) => Promise<any[]>
  getShowWithSlides: (id: number) => Promise<any>
  saveShow: (data: { title: string; artist?: string; categoryId?: number; slides: any[] }) => Promise<any>
  deleteShow: (id: number) => Promise<any>

  // Categories
  getCategories: (type: string) => Promise<any[]>
  addCategory: (data: { name: string; type: string }) => Promise<any>

  // Playlists
  getActivePlaylist: () => Promise<any>
  updatePlaylistItems: (data: { playlistId: number; items: any[] }) => Promise<any>
  getPlaylists: () => Promise<any[]>
  savePlaylistAs: (name: string, items: any[]) => Promise<number>;
  renamePlaylist: (id: number, name: string) => Promise<void>;
  saveDraftSlides: (showId: number, slides: any[], settings?: any) => Promise<void>;
  deletePlaylist: (id: number) => Promise<void>;
  getPlaylistDetails: (id: number) => Promise<any>
  exportPlaylist: (id: number) => Promise<void>
  importPlaylist: () => Promise<{ success: boolean; playlist?: any }>

  // Media
  getAllMedia: (typeFilter?: string) => Promise<any[]>
  importMediaFiles: (filePaths: string[]) => Promise<any[]>
  addMediaLink: (data: { name: string; type: string; url: string }) => Promise<any>
  openMediaDialog: () => Promise<string[]>
  deleteMedia: (id: number, filePath?: string, isLink?: boolean) => Promise<void>

  // Search
  searchWebLyrics: (query: string) => Promise<any[]>
  fetchWebLyrics: (data: { id: any, source: string }) => Promise<string>

  // Events
  onShowsUpdated: (callback: () => void) => () => void
}
