import { app, BrowserWindow, Menu, ipcMain, dialog, protocol, net } from 'electron'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { WebSocketServer, WebSocket } from 'ws'
import { initDatabase, dbOps } from './db'
import { importBibleXML } from './bible-parser'
import fs from 'fs'
import Genius from "genius-lyrics";
import AdmZip from 'adm-zip';

app.disableHardwareAcceleration();

const GENIUS_ACCESS_TOKEN = "x8Q-VA-Zw5QJIrJfJyUJzygT8LRp2wUU7J37mgBPpofzMv6_q9eSkkN7nsQZz7pf";
const GeniusClient = new Genius.Client(GENIUS_ACCESS_TOKEN);

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite dev server URL is injected by vite-plugin-electron
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Register crossenter:// protocol for local file access
protocol.registerSchemesAsPrivileged([
  { scheme: 'crossenter', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }
])

// ─────────────────────────────────────────────────────────────────────────────
// Sync Engine (WebSocket Server)
// ─────────────────────────────────────────────────────────────────────────────

let wss: WebSocketServer | null = null
let stageState = {
  message: null as string | null,
  running: false,
  remaining: 300,
  duration: 300
}
let stageInterval: NodeJS.Timeout | null = null

function broadcastToAll(data: any) {
  const msg = JSON.stringify(data)
  wss?.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  })
}

function startSyncEngine() {
  wss = new WebSocketServer({ port: 8080 })
  console.log('[Main] Sync Engine started on ws://localhost:8080')

  wss.on('connection', (socket) => {
    // Send initial state
    socket.send(JSON.stringify({ type: 'STAGE_UPDATE', payload: stageState }))

    socket.on('message', (data) => {
      const messageStr = data.toString()
      let msg: any
      try {
        msg = JSON.parse(messageStr)
      } catch (e) {
        // Fallback for non-JSON or malformed
        broadcastOthers(socket, messageStr)
        return
      }

      // 1. Handle Stage Commands
      if (msg.type === 'STAGE_COMMAND') {
        const { command, payload } = msg
        switch (command) {
          case 'SET_MESSAGE':
            stageState.message = payload
            break
          case 'TIMER_START':
            stageState.running = true
            if (!stageInterval) {
              stageInterval = setInterval(() => {
                if (stageState.running && stageState.remaining > 0) {
                  stageState.remaining--
                  broadcastToAll({ type: 'STAGE_TICK', payload: { remaining: stageState.remaining } })
                } else if (stageState.remaining <= 0) {
                  stageState.running = false
                  broadcastToAll({ type: 'STAGE_UPDATE', payload: stageState })
                }
              }, 1000)
            }
            break
          case 'TIMER_STOP':
            stageState.running = false
            break
          case 'TIMER_RESET':
            stageState.running = false
            stageState.remaining = payload || 300
            stageState.duration = payload || 300
            break
        }
        broadcastToAll({ type: 'STAGE_UPDATE', payload: stageState })
      } else {
        // 2. Default broadcast sync (SYNC_STATE, etc.)
        broadcastOthers(socket, messageStr)
      }
    })
    socket.on('error', console.error)
  })
}

function broadcastOthers(socket: WebSocket, message: string) {
  wss?.clients.forEach((client) => {
    if (client !== socket && client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handlers
// ─────────────────────────────────────────────────────────────────────────────

function registerHandlers() {
  console.log('[Main] Registering Bible IPC handlers...');
  // Bible
  ipcMain.handle('bible:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Bible (Zefania XML)',
      filters: [{ name: 'XML Files', extensions: ['xml'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null
    try { return importBibleXML(filePaths[0]) } catch (error: any) { console.error(error); throw error }
  })
  ipcMain.handle('bible:get-all', async () => dbOps.getBibles())
  ipcMain.handle('bible:get-books', async (_e, id) => dbOps.getBooks(id))
  ipcMain.handle('bible:get-verses', async (_e, b, c) => dbOps.getVerses(b, c))
  ipcMain.handle('bible:get-chapter-count', async (_e, id) => dbOps.getChapterCount(id))
  ipcMain.handle('bible:delete', async (_e, id) => dbOps.deleteBible(id))

  // Content
  ipcMain.handle('show:get-all', async (_e, catId) => dbOps.getShows(catId));
  ipcMain.handle('show:get-with-slides', async (_e, id) => dbOps.getShowWithSlides(id));
  ipcMain.handle('show:save', async (_e, data) => {
    try {
      console.log(`[Main] Saving show: ${data.title} with ${data.slides.length} slides`);
      const result = await dbOps.saveShow(data);
      
      // Notify all windows to refresh lists
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('show:list-updated');
      });
      
      return result;
    } catch (err) {
      console.error("[Main] Failed to save show:", err);
      throw err;
    }
  });
  ipcMain.handle('show:delete', async (_e, id) => dbOps.deleteShow(id));
  
  ipcMain.handle('category:get-all', async (_e, type) => dbOps.getCategories(type));
  ipcMain.handle('category:add', async (_e, { name, type }) => dbOps.saveCategory(name, type));
  
  ipcMain.handle('search-web-lyrics', async (_e, query: string) => {
    const results: any[] = [];
    
    // Concurrent searching
    const searches = await Promise.allSettled([
      // 1. Genius
      GeniusClient.songs.search(query).then(songs => 
        songs.slice(0, 5).map(s => ({ title: s.title, artist: s.artist.name, id: s.id, source: 'Genius' }))
      ),
      // 2. LRCLIB
      net.fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'CrossenterApp/1.0.0' } })
        .then(r => r.json())
        .then((data: any) => (data || []).slice(0, 5).map((r: any) => ({
          title: r.trackName, artist: r.artistName, instantLyrics: r.plainLyrics, source: 'LRCLIB'
        }))),
      // 3. Hymnary
      net.fetch(`https://hymnary.org/hymnary/api/v1/search?term=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then((data: any) => (data || []).slice(0, 5).map((r: any) => ({
          title: r.title, artist: r.hymnal || 'Hymnary', id: r.uri, source: 'Hymnary'
        }))),
      // 4. Letras
      net.fetch(`https://www.letras.mus.br/winamp.php?t=${encodeURIComponent(query)}`)
        .then(r => r.text())
        .then(text => {
          // Letras winamp endpoint returns "artist - track" usually, let's just tag it for now
          // Real Letras search might need deeper scraping if this is too limited
          return [{ title: query, artist: 'Various', id: query, source: 'Letras', instantLyrics: text }];
        })
    ]);

    searches.forEach(s => {
      if (s.status === 'fulfilled') results.push(...s.value);
    });

    return results;
  });

  ipcMain.handle('fetch-web-lyrics', async (_e, { id, source }) => {
    try {
      console.log(`[Main] Fetching lyrics for ${source} (ID: ${id})`);
      if (source === 'Genius') {
        const song = await GeniusClient.songs.get(id);
        const lyrics = await song.lyrics();
        console.log(`[Main] Genius lyrics fetched: ${lyrics?.length || 0} chars`);
        return lyrics || "";
      }
      if (source === 'Hymnary') {
        const response = await net.fetch(`https://hymnary.org/${id}`);
        const html = await response.text();
        const match = html.match(/<div id="hymn_text">([\s\S]*?)<\/div>/);
        const text = match ? match[1] : "Lyrics not found on page structure";
        // Aggressive strip all HTML tags
        return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      }
      if (source === 'Letras') {
        const response = await net.fetch(`https://www.letras.mus.br/winamp.php?t=${encodeURIComponent(id)}`);
        const body = await response.text();
        // winamp.php sometimes returns HTML if it's a search result, let's strip it just in case
        return body.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      }
      return "";
    } catch (err) {
      console.error(`[Main] Fetch error for ${source}:`, err);
      return "";
    }
  });

  ipcMain.handle('playlist:get-active', async () => dbOps.getActivePlaylist());
  ipcMain.handle('playlist:update-items', async (_e, { playlistId, items }) => dbOps.updatePlaylistItems(playlistId, items));
  ipcMain.handle('playlist:get-all', async () => dbOps.getPlaylists());
  ipcMain.handle('playlist:save-as', async (_e, { name, items }) => dbOps.savePlaylistAs(name, items));
  ipcMain.handle('playlist:rename', async (_, { id, name }) => {
    return dbOps.renamePlaylist(id, name);
  });

  ipcMain.handle('show:save-draft', async (_, showId, slides, settings) => {
    return dbOps.saveDraftSlides(showId, slides, settings);
  });
  ipcMain.handle('playlist:delete', async (_e, id) => dbOps.deletePlaylist(id));
  ipcMain.handle('playlist:get-details', async (_e, id) => dbOps.getPlaylistWithItems(id));

  // --- Archiving Engine (Export) ---
  ipcMain.handle('playlist:export', async (_e, playlistId) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export Crossenter Playlist',
      defaultPath: `Playlist-${new Date().toISOString().split('T')[0]}.cepl`,
      filters: [{ name: 'Crossenter Playlist', extensions: ['cepl'] }]
    });

    if (!filePath) return;

    try {
      const pl = dbOps.getPlaylistWithItems(playlistId);
      if (!pl) throw new Error("Playlist not found");

      const zip = new AdmZip();
      const manifest: any = {
        name: pl.name,
        created_at: pl.created_at,
        items: []
      };

      // 1. Spider for data and assets
      for (const item of pl.items) {
        const itemRecord: any = { type: item.type, metadata: JSON.parse(item.metadata || '{}'), sort_order: item.sort_order };
        
        if (item.type === 'show' && item.reference_id) {
          const show = dbOps.getShowWithSlides(item.reference_id);
          if (show) {
            zip.addFile(`shows/${show.id}.json`, Buffer.from(JSON.stringify(show), 'utf-8'));
            itemRecord.show_file = `shows/${show.id}.json`;
            itemRecord.title = show.title;
          }
        }
        
        // Handle media assets in metadata (backgrounds)
        const meta = itemRecord.metadata;
        if (meta?.background?.path) {
          const assetName = path.basename(meta.background.path);
          if (fs.existsSync(meta.background.path)) {
            zip.addLocalFile(meta.background.path, 'assets');
            meta.background.original_path = meta.background.path;
            meta.background.path = `assets/${assetName}`;
          }
        }

        manifest.items.push(itemRecord);
      }

      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest), 'utf-8'));
      zip.writeZip(filePath);
      
      return { success: true, path: filePath };
    } catch (err) {
      console.error("[Main] Export failed:", err);
      throw err;
    }
  });

  // --- Archiving Engine (Import) ---
  ipcMain.handle('playlist:import', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import Crossenter Playlist',
      filters: [{ name: 'Crossenter Playlist', extensions: ['cepl'] }],
      properties: ['openFile']
    });

    if (!filePaths || filePaths.length === 0) return;

    try {
      const zip = new AdmZip(filePaths[0]);
      const manifestLine = zip.getEntry('manifest.json');
      if (!manifestLine) throw new Error("Invalid bundle: Missing manifest.json");

      const manifest = JSON.parse(manifestLine.getData().toString('utf-8'));
      const userDataPath = app.getPath('userData');
      const assetsDir = path.join(userDataPath, 'assets');
      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

      const newItems: any[] = [];

      for (const item of manifest.items) {
        let refId = null;

        // 1. Sync Shows
        if (item.type === 'show' && item.show_file) {
          const showEntry = zip.getEntry(item.show_file);
          if (showEntry) {
            const showData = JSON.parse(showEntry.getData().toString('utf-8'));
            refId = dbOps.syncImportedShow(showData);
          }
        }

        // 2. Extract and link assets
        if (item.metadata?.background?.path?.startsWith('assets/')) {
          const assetEntry = zip.getEntry(item.metadata.background.path);
          if (assetEntry) {
            const fileName = path.basename(item.metadata.background.path);
            const targetPath = path.join(assetsDir, fileName);
            if (!fs.existsSync(targetPath)) {
              fs.writeFileSync(targetPath, assetEntry.getData());
            }
            item.metadata.background.path = targetPath;
            item.metadata.background.url = `crossenter://${targetPath}`;
          }
        }

        newItems.push({
          type: item.type,
          reference_id: refId,
          metadata: item.metadata
        });
      }

      // Save as a new saved playlist
      const playlistId = dbOps.savePlaylistAs(`Imported: ${manifest.name}`, newItems);
      const importedPL = dbOps.getPlaylistWithItems(Number(playlistId));

      return { success: true, playlist: importedPL };
    } catch (err) {
      console.error("[Main] Import failed:", err);
      throw err;
    }
  });

  // Media Library (Phase 6)
  ipcMain.handle('media:get-all', async (_e, typeFilter) => {
    const records = dbOps.getMedia(typeFilter);
    return records.map((r: any) => ({
      ...r,
      url: (r.file_path_or_url.startsWith('http') || r.file_path_or_url.startsWith('data:'))
        ? r.file_path_or_url 
        : `crossenter://${r.file_path_or_url}`
    }));
  });

  ipcMain.handle('media:import-local-files', async (_e, filePaths: string[]) => {
    const managedMediaPath = path.join(app.getPath('userData'), 'Media');
    const importedRecords = [];

    for (const srcPath of filePaths) {
      if (!fs.existsSync(srcPath)) continue;
      
      const fileName = path.basename(srcPath);
      // Ensure unique filename in managed storage if needed
      let destPath = path.join(managedMediaPath, fileName);
      if (fs.existsSync(destPath)) {
        const ext = path.extname(fileName);
        const name = path.basename(fileName, ext);
        destPath = path.join(managedMediaPath, `${name}-${Date.now()}${ext}`);
      }

      try {
        fs.copyFileSync(srcPath, destPath);
        const type = getMediaType(destPath);
        const id = dbOps.saveMedia(path.basename(destPath), type, destPath);
        importedRecords.push({ id, name: path.basename(destPath), type, file_path_or_url: destPath, url: `crossenter://${destPath}` });
      } catch (err) {
        console.error(`[Main] Failed to import ${srcPath}:`, err);
      }
    }
    return importedRecords;
  });

  ipcMain.handle('media:add-link', async (_e, { name, type, url }) => {
    const id = dbOps.saveMedia(name, type, url);
    return { id, name, type, file_path_or_url: url, url };
  });

  ipcMain.handle('media:open-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Media',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'mp3', 'wav', 'pdf'] }
      ]
    });
    return canceled ? [] : filePaths;
  });

  ipcMain.handle('media:delete', async (_e, { id, filePath, isLink }) => {
    if (!isLink && filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn("Failed to delete managed file:", e); }
    }
    return dbOps.deleteMedia(id);
  });

  // Templates (Phase 7)
  ipcMain.handle('get-templates', async () => dbOps.getTemplates());
  ipcMain.handle('save-template', async (_e, data) => dbOps.saveTemplate(data));
  ipcMain.handle('delete-template', async (_e, id) => dbOps.deleteTemplate(id));

  // App Settings (Phase 7)
  ipcMain.handle('get-setting', async (_e, key) => dbOps.getSetting(key));
  ipcMain.handle('set-setting', async (_e, key, value) => dbOps.setSetting(key, value));

  // Alert Templates (Phase 10)
  ipcMain.handle('alert-templates:get-all', async () => dbOps.getAlertTemplates());
  ipcMain.handle('alert-templates:save', async (_e, data) => dbOps.saveAlertTemplate(data));
  ipcMain.handle('alert-templates:delete', async (_e, id) => dbOps.deleteAlertTemplate(id));
}

function getMediaType(filePath: string): string {
  const ext = path.extname(filePath)?.toLowerCase();
  if (['.mp4', '.webm', '.mov', '.mkv'].includes(ext)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return 'audio';
  if (ext === '.pdf') return 'pdf';
  return 'link';
}

// ─────────────────────────────────────────────────────────────────────────────
// Window factories
// ─────────────────────────────────────────────────────────────────────────────

function createControlPanelWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900,
    minWidth: 1100, minHeight: 700,
    backgroundColor: '#1e1e24',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  Menu.setApplicationMenu(null)
  if (VITE_DEV_SERVER_URL) win.loadURL(`${VITE_DEV_SERVER_URL}#control`)
  else win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'control' })

  // Stability Monitors
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[Main] Control Panel Renderer GONE: ${details.reason} (Exit Code: ${details.exitCode})`);
    if (details.reason !== 'clean-exit') {
      console.log('[Main] Attempting automatic window recovery...');
      win.reload();
    }
  });

  win.on('unresponsive', () => {
    console.warn('[Main] Control Panel is unresponsive. Requesting reload...');
    dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Performance Lag Detected',
      message: 'The application is taking too long to respond. Would you like to reload?',
      buttons: ['Reload', 'Keep Waiting']
    }).then(({ response }) => {
      if (response === 0) win.reload();
    });
  });

  return win
}

function createOutputWindow() {
  const win = new BrowserWindow({
    width: 1024, height: 768,
    backgroundColor: '#000000',
    title: 'Crossenter — Main Output',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  if (VITE_DEV_SERVER_URL) win.loadURL(`${VITE_DEV_SERVER_URL}#output`)
  else win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'output' })
  return win
}

function createStageDisplayWindow() {
  const win = new BrowserWindow({
    width: 1024, height: 768,
    backgroundColor: '#000000',
    title: 'Crossenter — Stage Display',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  })
  if (VITE_DEV_SERVER_URL) win.loadURL(`${VITE_DEV_SERVER_URL}#stage`)
  else win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'stage' })
  return win
}

// ─────────────────────────────────────────────────────────────────────────────
// App lifecycle
// ─────────────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Setup crossenter:// protocol
  protocol.handle('crossenter', (request) => {
    try {
      // Remove crossenter:// and any leading slashes to get a clean absolute path
      let cleanPath = request.url.replace(/^crossenter:\/+/i, '/');
      const decodedPath = decodeURIComponent(cleanPath);
      
      if (fs.existsSync(decodedPath)) {
        return net.fetch(pathToFileURL(decodedPath).toString());
      }
      return new Response('File not found', { status: 404 });
    } catch (err) {
      console.error("[Main] Protocol error:", err);
      return new Response('Protocol error', { status: 500 });
    }
  });

  initDatabase()

  // Ensure managed Media directory exists
  const managedMediaPath = path.join(app.getPath('userData'), 'Media');
  if (!fs.existsSync(managedMediaPath)) {
    fs.mkdirSync(managedMediaPath, { recursive: true });
  }

  registerHandlers()
  startSyncEngine()
  
  createControlPanelWindow()

  if (VITE_DEV_SERVER_URL) {
    createOutputWindow()
    createStageDisplayWindow()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlPanelWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
