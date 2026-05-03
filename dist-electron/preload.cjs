"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("crossenter", {
  version: "1.0.0",
  platform: process.platform,
  openOutputWindow: () => electron.ipcRenderer.invoke("window:open-output"),
  openStageWindow: () => electron.ipcRenderer.invoke("window:open-stage"),
  getAppPath: () => electron.ipcRenderer.invoke("app:get-path"),
  // Bible APIs
  importBible: () => electron.ipcRenderer.invoke("bible:import"),
  getBibles: () => {
    console.log("[Preload] Invoking bible:get-all");
    return electron.ipcRenderer.invoke("bible:get-all");
  },
  getBooks: (bibleId) => electron.ipcRenderer.invoke("bible:get-books", bibleId),
  getVerses: (bookId, chapter) => electron.ipcRenderer.invoke("bible:get-verses", bookId, chapter),
  getChapterCount: (id) => electron.ipcRenderer.invoke("bible:get-chapter-count", id),
  deleteBible: (id) => electron.ipcRenderer.invoke("bible:delete", id),
  // Shows
  getShows: (categoryId) => electron.ipcRenderer.invoke("show:get-all", categoryId),
  getShowWithSlides: (id) => electron.ipcRenderer.invoke("show:get-with-slides", id),
  saveShow: (data) => electron.ipcRenderer.invoke("show:save", data),
  deleteShow: (id) => electron.ipcRenderer.invoke("show:delete", id),
  // Categories
  getCategories: (type) => electron.ipcRenderer.invoke("category:get-all", type),
  addCategory: (data) => electron.ipcRenderer.invoke("category:add", data),
  // Playlists
  getActivePlaylist: () => electron.ipcRenderer.invoke("playlist:get-active"),
  updatePlaylistItems: (data) => electron.ipcRenderer.invoke("playlist:update-items", data),
  getPlaylists: () => electron.ipcRenderer.invoke("playlist:get-all"),
  savePlaylistAs: (name, items) => electron.ipcRenderer.invoke("playlist:save-as", { name, items }),
  renamePlaylist: (id, name) => electron.ipcRenderer.invoke("playlist:rename", { id, name }),
  saveDraftSlides: (showId, slides, settings) => electron.ipcRenderer.invoke("show:save-draft", showId, slides, settings),
  deletePlaylist: (id) => electron.ipcRenderer.invoke("playlist:delete", id),
  getPlaylistDetails: (id) => electron.ipcRenderer.invoke("playlist:get-details", id),
  exportPlaylist: (id) => electron.ipcRenderer.invoke("playlist:export", id),
  importPlaylist: () => electron.ipcRenderer.invoke("playlist:import"),
  // Media
  getAllMedia: (typeFilter) => electron.ipcRenderer.invoke("media:get-all", typeFilter),
  importMediaFiles: (filePaths) => electron.ipcRenderer.invoke("media:import-local-files", filePaths),
  addMediaLink: (data) => electron.ipcRenderer.invoke("media:add-link", data),
  openMediaDialog: () => electron.ipcRenderer.invoke("media:open-dialog"),
  deleteMedia: (id, filePath, isLink = false) => electron.ipcRenderer.invoke("media:delete", { id, filePath, isLink }),
  // Search
  searchWebLyrics: (query) => electron.ipcRenderer.invoke("search-web-lyrics", query),
  fetchWebLyrics: (data) => electron.ipcRenderer.invoke("fetch-web-lyrics", data),
  // Events
  onShowsUpdated: (callback) => {
    const subscription = (_event) => callback();
    electron.ipcRenderer.on("show:list-updated", subscription);
    return () => electron.ipcRenderer.removeListener("show:list-updated", subscription);
  },
  // Templates (Phase 7)
  getTemplates: () => electron.ipcRenderer.invoke("get-templates"),
  saveTemplate: (data) => electron.ipcRenderer.invoke("save-template", data),
  deleteTemplate: (id) => electron.ipcRenderer.invoke("delete-template", id),
  // App Settings (Phase 7)
  getSetting: (key) => electron.ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => electron.ipcRenderer.invoke("set-setting", key, value)
});
