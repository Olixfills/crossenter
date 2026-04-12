import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — SQLite Database Engine
// Manages Bibles, Shows, and Application Settings.
// ─────────────────────────────────────────────────────────────────────────────

let db: Database.Database;

/**
 * Initializes the database file and creates the schema.
 */
export function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'crossenter.db');

  console.log(`[Database] Initializing at: ${dbPath}`);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // High-performance write-ahead logging

  // Create Bibles Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS bibles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      abbreviation TEXT,
      language TEXT,
      path TEXT UNIQUE -- Source path if imported from file
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bible_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      book_number INTEGER NOT NULL,
      FOREIGN KEY (bible_id) REFERENCES bibles (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter);

    -- New Content Management Tables
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'show'
    );

    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      artist TEXT,
      settings TEXT, -- JSON for local show settings (styles, etc.)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'Verse', -- Verse, Chorus, Bridge, etc.
      text TEXT NOT NULL,
      slide_order INTEGER NOT NULL,
      label TEXT, -- e.g. "Verse 1"
      FOREIGN KEY (show_id) REFERENCES shows (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS playlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'show', 'scripture', 'media'
      reference_id INTEGER, -- show_id or null
      metadata TEXT, -- JSON for scripture range or media paths
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
      FOREIGN KEY (reference_id) REFERENCES shows (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- image, video, audio, pdf, link
      file_path_or_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 7: Global Template Engine
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bg_type TEXT NOT NULL DEFAULT 'color', -- 'color' | 'image' | 'video' | 'gradient'
      bg_value TEXT NOT NULL DEFAULT '#000000', -- CSS color, file path, or CSS gradient string
      font_family TEXT NOT NULL DEFAULT 'Inter',
      font_size INTEGER NOT NULL DEFAULT 64,
      font_color TEXT NOT NULL DEFAULT '#ffffff',
      text_align TEXT NOT NULL DEFAULT 'center',
      shadow_blur INTEGER NOT NULL DEFAULT 40,
      shadow_color TEXT NOT NULL DEFAULT 'rgba(0,0,0,0.8)',
      offset_x INTEGER NOT NULL DEFAULT 0,
      offset_y INTEGER NOT NULL DEFAULT 10,
      padding INTEGER NOT NULL DEFAULT 24,
      backdrop_opacity REAL NOT NULL DEFAULT 0.3,
      transition TEXT NOT NULL DEFAULT 'fade',
      transition_duration INTEGER NOT NULL DEFAULT 700,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration: Reconcile shows schema (Remove legacy NOT NULL content column)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const tableInfo = db.prepare("PRAGMA table_info(shows)").all() as any[];
    const hasContent = tableInfo.some(info => info.name === 'content');
    
    if (hasContent) {
      console.log("[Database] Legacy 'content' column detected. Rebuilding shows table to clear constraints...");
      
      // 1. Move data to temp
      db.exec("CREATE TABLE IF NOT EXISTS shows_temp AS SELECT id, category_id, title, artist, created_at FROM shows;");
      
      // 2. Drop legacy table
      db.exec("DROP TABLE shows;");
      
      // 3. Recreate it clean
      db.exec(`
        CREATE TABLE shows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          title TEXT NOT NULL,
          artist TEXT,
          settings TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        );
      `);
      
      // 4. Restore data
      db.exec("INSERT INTO shows (id, category_id, title, artist, created_at) SELECT id, category_id, title, artist, created_at FROM shows_temp;");
      
      // 5. Cleanup
      db.exec("DROP TABLE shows_temp;");
      console.log("[Database] Migration complete: shows table reconciled.");
    }
  } catch (e) {
    console.warn("[DB] Migration (schema reconciliation) error:", e);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration: Fix polymorphic reference_id and metadata columns
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    // 1. Ensure basic columns exist
    const tableInfo = db.prepare("PRAGMA table_info(shows)").all() as any[];
    if (!tableInfo.some(info => info.name === 'settings')) {
      db.exec("ALTER TABLE shows ADD COLUMN settings TEXT;");
    }
    if (!tableInfo.some(info => info.name === 'ccli')) {
      db.exec("ALTER TABLE shows ADD COLUMN ccli TEXT;");
      db.exec("ALTER TABLE shows ADD COLUMN author TEXT;");
      db.exec("ALTER TABLE shows ADD COLUMN key TEXT;");
      db.exec("ALTER TABLE shows ADD COLUMN tempo TEXT;");
    }

    // 2. Fix playlist_items: Remove the restrictive FK on reference_id
    // We check if the FK currently exists
    const fkList = db.prepare("PRAGMA foreign_key_list(playlist_items)").all() as any[];
    const hasRestrictiveFK = fkList.some(fk => fk.table === 'shows' && fk.from === 'reference_id');

    if (hasRestrictiveFK) {
      console.log("[Database] Polished Migration: Removing restrictive FK from playlist_items...");
      db.exec(`
        CREATE TABLE playlist_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          playlist_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          reference_id INTEGER,
          title TEXT,
          metadata TEXT,
          sort_order INTEGER NOT NULL,
          FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
        );
        INSERT INTO playlist_items_new (id, playlist_id, type, reference_id, metadata, sort_order) 
        SELECT id, playlist_id, type, reference_id, metadata, sort_order FROM playlist_items;
      `);
      
      // Update titles if the column was already added partially
      const plItemInfo = db.prepare("PRAGMA table_info(playlist_items)").all() as any[];
      if (plItemInfo.some(info => info.name === 'title')) {
        db.exec("UPDATE playlist_items_new SET title = (SELECT title FROM playlist_items WHERE playlist_items.id = playlist_items_new.id)");
      }

      db.exec(`
        DROP TABLE playlist_items;
        ALTER TABLE playlist_items_new RENAME TO playlist_items;
      `);
      console.log("[Database] Migration complete: playlist_items table is now polymorphic.");
    } else {
      // Just ensure 'title' exists if we didn't rebuild the table
      const plItemInfo = db.prepare("PRAGMA table_info(playlist_items)").all() as any[];
      if (!plItemInfo.some(info => info.name === 'title')) {
        db.exec("ALTER TABLE playlist_items ADD COLUMN title TEXT;");
      }
    }
  } catch (e) {
    console.error("[Database] Migration error:", e);
  }

  // Ensure default category exists
  const rootShowCat = db.prepare("SELECT id FROM categories WHERE name = 'General'").get();
  if (!rootShowCat) {
    db.prepare("INSERT INTO categories (name, type) VALUES ('General', 'show')").run();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration: Add new template columns (transition, transition_duration)
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const templateCols = db.prepare("PRAGMA table_info(templates)").all() as any[];
    if (!templateCols.some(c => c.name === 'transition')) {
      db.exec("ALTER TABLE templates ADD COLUMN transition TEXT NOT NULL DEFAULT 'fade';");
      console.log('[Database] Migration: Added transition column to templates.');
    }
    if (!templateCols.some(c => c.name === 'transition_duration')) {
      db.exec("ALTER TABLE templates ADD COLUMN transition_duration INTEGER NOT NULL DEFAULT 700;");
      console.log('[Database] Migration: Added transition_duration column to templates.');
    }
  } catch (e) {
    console.warn('[DB] Template column migration error:', e);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Seed: Insert built-in starter templates (runs once per install via flag)
  // Uses app_settings flag 'builtin_templates_seeded_v1' so it runs even if
  // user already has custom templates from a previous session.
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    const alreadySeeded = db.prepare("SELECT value FROM app_settings WHERE key = 'builtin_templates_seeded_v1'").get();
    if (!alreadySeeded) {
      console.log('[Database] Seeding built-in starter templates...');
      const insertTemplate = db.prepare(`
        INSERT INTO templates (name, bg_type, bg_value, font_family, font_size, font_color, text_align, shadow_blur, shadow_color, offset_x, offset_y, padding, backdrop_opacity, transition, transition_duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const builtinTemplates = [
        // 1. Deep Worship — clean black, bold fade (song default)
        ['Deep Worship', 'color', '#0a0a12', 'Inter', 72, '#ffffff', 'center', 60, 'rgba(0,0,0,0.9)', 0, 4, 80, 0.0, 'fade', 800],
        // 2. Scripture Blue — deep navy gradient (scripture default)
        ['Scripture Blue', 'gradient', 'linear-gradient(160deg, #0f1c3d 0%, #0a0a1a 80%)', 'Georgia', 64, '#e8f0ff', 'center', 40, 'rgba(0,20,80,0.6)', 0, 6, 72, 0.1, 'slide-up', 900],
        // 3. Royal Purple — rich radial purple gradient
        ['Royal Purple', 'gradient', 'radial-gradient(ellipse at center, #1e0a3c 0%, #0a0012 100%)', 'Outfit', 68, '#f0e8ff', 'center', 50, 'rgba(80,0,160,0.5)', 0, 5, 76, 0.15, 'fade', 700],
        // 4. Warm Ember — warm dark brown gradient
        ['Warm Ember', 'gradient', 'linear-gradient(135deg, #1a0800 0%, #2d1500 50%, #0a0000 100%)', 'Raleway', 64, '#fff1e0', 'center', 45, 'rgba(120,40,0,0.5)', 0, 5, 72, 0.2, 'slide-left', 750],
        // 5. Minimal Contrast — pure black, instant cut
        ['Minimal Contrast', 'color', '#000000', 'Helvetica', 80, '#ffffff', 'center', 0, 'rgba(0,0,0,0)', 0, 0, 64, 0.0, 'cut', 0],
      ];

      let firstId: number | bigint = 1;
      builtinTemplates.forEach((t, i) => {
        const result = insertTemplate.run(...t as any);
        if (i === 0) firstId = result.lastInsertRowid;
      });

      // Set defaults only if none are currently set
      const hasSongDefault = db.prepare("SELECT value FROM app_settings WHERE key = 'default_song_template_id'").get();
      if (!hasSongDefault) {
        db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('default_song_template_id', ?)").run(String(firstId));
      }
      const hasScriptureDefault = db.prepare("SELECT value FROM app_settings WHERE key = 'default_scripture_template_id'").get();
      if (!hasScriptureDefault) {
        db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('default_scripture_template_id', ?)").run(String(Number(firstId) + 1));
      }

      // Mark as seeded so this never runs again
      db.prepare("INSERT INTO app_settings (key, value) VALUES ('builtin_templates_seeded_v1', '1')").run();
      console.log(`[Database] Seeded ${builtinTemplates.length} built-in templates. Defaults configured.`);
    }
  } catch (e) {
    console.warn('[DB] Template seeding error:', e);
  }

  return db;
}

/**
 * Getter for the active database instance.
 */
export function getDb() {
  if (!db) initDatabase();
  return db;
}

/**
 * CRUD Helpers
 */

export const dbOps = {
  // Bibles
  getBibles: () => {
    try {
      return getDb().prepare('SELECT * FROM bibles ORDER BY name ASC').all();
    } catch (err) {
      console.error("[Database] getBibles error:", err);
      return [];
    }
  },

  getBooks: (bibleId: number) => {
    return getDb().prepare('SELECT * FROM books WHERE bible_id = ? ORDER BY book_number ASC').all(bibleId);
  },

  getVerses: (bookId: number, chapter: number) => {
    return getDb().prepare('SELECT * FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse_number ASC').all(bookId, chapter);
  },

  getChapterCount: (bookId: number) => {
    const result = getDb().prepare('SELECT MAX(chapter) as count FROM verses WHERE book_id = ?').get(bookId) as { count: number };
    return result?.count || 0;
  },

  deleteBible: (id: number) => {
    return getDb().prepare('DELETE FROM bibles WHERE id = ?').run(id);
  },

  // Shows
  getShows: (categoryId?: number) => {
    if (categoryId) {
      return getDb().prepare('SELECT * FROM shows WHERE category_id = ? ORDER BY title ASC').all(categoryId);
    }
    return getDb().prepare('SELECT * FROM shows ORDER BY title ASC').all();
  },

  getShowWithSlides: (id: number) => {
    const show = getDb().prepare('SELECT * FROM shows WHERE id = ?').get(id) as any;
    if (!show) return null;
    const slides = getDb().prepare('SELECT * FROM slides WHERE show_id = ? ORDER BY slide_order ASC').all(id);
    return { 
      ...show, 
      content: slides,
      settings: show.settings ? JSON.parse(show.settings) : null
    }; 
  },

  saveShow: (data: { title: string; artist?: string; categoryId?: number; settings?: any; slides: any[] }) => {
    const transaction = getDb().transaction(() => {
      const showResult = getDb().prepare('INSERT INTO shows (title, artist, category_id, settings) VALUES (?, ?, ?, ?)')
        .run(data.title, data.artist || null, data.categoryId || null, data.settings ? JSON.stringify(data.settings) : null);
      
      const showId = showResult.lastInsertRowid;
      const stmt = getDb().prepare('INSERT INTO slides (show_id, type, text, slide_order, label) VALUES (?, ?, ?, ?, ?)');
      
      data.slides.forEach((s, idx) => {
        stmt.run(showId, s.type || 'Verse', s.text, idx, s.label || '');
      });
      
      return showId;
    });
    return transaction();
  },

  saveDraftSlides: (showId: number, slides: any[], settings?: any) => {
    const transaction = getDb().transaction(() => {
      // 1. Update show settings if provided
      if (settings) {
        getDb().prepare('UPDATE shows SET settings = ? WHERE id = ?').run(JSON.stringify(settings), showId);
      }
      
      // 2. Clear existing slides
      getDb().prepare('DELETE FROM slides WHERE show_id = ?').run(showId);
      
      // 3. Insert new slides
      const stmt = getDb().prepare('INSERT INTO slides (show_id, type, text, slide_order, label) VALUES (?, ?, ?, ?, ?)');
      slides.forEach((s, idx) => {
        stmt.run(showId, s.type || 'Verse', s.text, idx, s.label || '');
      });
    });
    return transaction();
  },

  deleteShow: (id: number) => {
    return getDb().prepare('DELETE FROM shows WHERE id = ?').run(id);
  },

  // Categories
  getCategories: (type: string) => {
    return getDb().prepare('SELECT * FROM categories WHERE type = ? ORDER BY name ASC').all(type);
  },

  saveCategory: (name: string, type: string) => {
    return getDb().prepare('INSERT INTO categories (name, type) VALUES (?, ?)').run(name, type);
  },

  deleteCategory: (id: number) => {
    return getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
  },

  // Playlists
  getPlaylists: () => {
    return getDb().prepare(`
      SELECT p.*, (SELECT COUNT(*) FROM playlist_items WHERE playlist_id = p.id) as items_count 
      FROM playlists p 
      WHERE p.is_active = 0
      ORDER BY p.created_at DESC
    `).all();
  },
  getActivePlaylist: () => {
    let pl = getDb().prepare("SELECT * FROM playlists WHERE is_active = 1 LIMIT 1").get() as any;
    if (!pl) {
      // Create default if missing
      const result = getDb().prepare("INSERT INTO playlists (name, is_active) VALUES ('Morning Service', 1)").run();
      pl = { id: result.lastInsertRowid, name: 'Morning Service', is_active: 1 };
    }
    const items = getDb().prepare(`
      SELECT pi.*, s.title as show_title
      FROM playlist_items pi
      LEFT JOIN shows s ON pi.reference_id = s.id AND pi.type = 'song'
      WHERE pi.playlist_id = ? 
      ORDER BY pi.sort_order ASC
    `).all(pl.id);
    
    // Map data for UI
    const mappedItems = items.map((i: any) => {
      const metadata = i.metadata ? JSON.parse(i.metadata) : {};
      let title = i.title || i.show_title || metadata.title;
      
      // Smart Fallback for Scripture Reference
      if (!title && i.type === 'scripture') {
        const ch = metadata.chapter || '?';
        const v = metadata.verseIds?.length > 0 ? (metadata.verseIds.length > 1 ? `${metadata.verseIds[0]}-${metadata.verseIds[metadata.verseIds.length-1]}` : metadata.verseIds[0]) : '?';
        title = `Scripture - Chapter ${ch}:${v}`;
      }

      return {
        ...i,
        title: title || 'Untitled Item',
        metadata
      };
    });

    return { ...pl, items: mappedItems };
  },
  updatePlaylistItems: (playlistId: number, items: any[]) => {
    const transaction = getDb().transaction((items) => {
      getDb().prepare('DELETE FROM playlist_items WHERE playlist_id = ?').run(playlistId);
      const stmt = getDb().prepare('INSERT INTO playlist_items (playlist_id, type, reference_id, title, metadata, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
      items.forEach((item: any, idx: number) => {
        stmt.run(playlistId, item.type, item.reference_id, item.title, JSON.stringify(item.metadata || {}), idx);
      });
    });
    return transaction(items);
  },
  savePlaylistAs: (name: string, items: any[]) => {
    const transaction = getDb().transaction(() => {
      // 1. Create the named playlist entry (inactive by default, it's an archive)
      const result = getDb().prepare("INSERT INTO playlists (name, is_active) VALUES (?, 0)").run(name);
      const playlistId = result.lastInsertRowid;
      
      // 2. Insert items
      const stmt = getDb().prepare('INSERT INTO playlist_items (playlist_id, type, reference_id, title, metadata, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
      items.forEach((item: any, idx: number) => {
        stmt.run(playlistId, item.type, item.reference_id, item.title, JSON.stringify(item.metadata || {}), idx);
      });
      
      return playlistId;
    });
    return transaction();
  },
  renamePlaylist: (id: number, name: string) => {
    return getDb().prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name, id);
  },
  deletePlaylist: (id: number) => {
    return getDb().prepare('DELETE FROM playlists WHERE id = ?').run(id);
  },
  getPlaylistWithItems: (id: number) => {
    const pl = getDb().prepare('SELECT * FROM playlists WHERE id = ?').get(id) as any;
    if (!pl) return null;
    const items = getDb().prepare(`
      SELECT pi.*, s.title as show_title
      FROM playlist_items pi
      LEFT JOIN shows s ON pi.reference_id = s.id AND pi.type = 'song'
      WHERE pi.playlist_id = ? 
      ORDER BY pi.sort_order ASC
    `).all(id);

    // Map data for UI
    const mappedItems = items.map((i: any) => {
      const metadata = i.metadata ? JSON.parse(i.metadata) : {};
      let title = i.title || i.show_title || metadata.title;
      
      // Smart Fallback for Scripture Reference
      if (!title && i.type === 'scripture') {
        const ch = metadata.chapter || '?';
        const v = metadata.verseIds?.length > 0 ? (metadata.verseIds.length > 1 ? `${metadata.verseIds[0]}-${metadata.verseIds[metadata.verseIds.length-1]}` : metadata.verseIds[0]) : '?';
        title = `Scripture - Chapter ${ch}:${v}`;
      }

      return {
        ...i,
        title: title || 'Untitled Item',
        metadata
      };
    });

    return { ...pl, items: mappedItems };
  },
  // Used for Smart Sync during Import
  syncImportedShow: (showData: any) => {
    const transaction = getDb().transaction(() => {
      // 1. Check if show exists by Title + Artist
      const existing = getDb().prepare('SELECT id FROM shows WHERE title = ? AND artist = ?').get(showData.title, showData.artist || null) as any;
      if (existing) {
        return existing.id; // Exist, return ID for linking
      }
      
      // 2. Not found, create it
      const result = getDb().prepare('INSERT INTO shows (title, artist, category_id) VALUES (?, ?, ?)')
        .run(showData.title, showData.artist || null, showData.categoryId || null);
      const newId = result.lastInsertRowid;
      
      // 3. Add slides
      const stmt = getDb().prepare('INSERT INTO slides (show_id, type, text, slide_order, label) VALUES (?, ?, ?, ?, ?)');
      (showData.content || []).forEach((s: any, idx: number) => {
        stmt.run(newId, s.type || 'Verse', s.text, idx, s.label || '');
      });
      
      return newId;
    });
    return transaction();
  },

  // Media
  getMedia: (typeFilter?: string) => {
    try {
      if (typeFilter && typeFilter !== 'all') {
        return getDb().prepare('SELECT * FROM media WHERE type = ? ORDER BY created_at DESC').all(typeFilter);
      }
      return getDb().prepare('SELECT * FROM media ORDER BY created_at DESC').all();
    } catch (err) {
      console.error("[Database] getMedia error:", err);
      return [];
    }
  },

  saveMedia: (name: string, type: string, pathOrUrl: string) => {
    try {
      const result = getDb().prepare('INSERT INTO media (name, type, file_path_or_url) VALUES (?, ?, ?)')
        .run(name, type, pathOrUrl);
      return result.lastInsertRowid;
    } catch (err) {
      console.error("[Database] saveMedia error:", err);
      throw err;
    }
  },

  deleteMedia: (id: number) => {
    try {
      return getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
    } catch (err) {
      console.error("[Database] deleteMedia error:", err);
      throw err;
    }
  },

  // Templates (Phase 7)
  getTemplates: () => {
    try {
      return getDb().prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
    } catch (err) {
      console.error("[Database] getTemplates error:", err);
      return [];
    }
  },

  saveTemplate: (data: {
    id?: number;
    name: string;
    bg_type: string;
    bg_value: string;
    font_family: string;
    font_size: number;
    font_color: string;
    text_align: string;
    shadow_blur: number;
    shadow_color: string;
    offset_x: number;
    offset_y: number;
    padding: number;
    backdrop_opacity: number;
    transition?: string;
    transition_duration?: number;
  }) => {
    const transition = data.transition ?? 'fade';
    const transitionDuration = data.transition_duration ?? 700;
    try {
      if (data.id) {
        getDb().prepare(`
          UPDATE templates SET
            name = ?, bg_type = ?, bg_value = ?, font_family = ?, font_size = ?,
            font_color = ?, text_align = ?, shadow_blur = ?, shadow_color = ?,
            offset_x = ?, offset_y = ?, padding = ?, backdrop_opacity = ?,
            transition = ?, transition_duration = ?
          WHERE id = ?
        `).run(
          data.name, data.bg_type, data.bg_value, data.font_family, data.font_size,
          data.font_color, data.text_align, data.shadow_blur, data.shadow_color,
          data.offset_x, data.offset_y, data.padding, data.backdrop_opacity,
          transition, transitionDuration,
          data.id
        );
        return data.id;
      } else {
        const result = getDb().prepare(`
          INSERT INTO templates (name, bg_type, bg_value, font_family, font_size, font_color, text_align, shadow_blur, shadow_color, offset_x, offset_y, padding, backdrop_opacity, transition, transition_duration)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          data.name, data.bg_type, data.bg_value, data.font_family, data.font_size,
          data.font_color, data.text_align, data.shadow_blur, data.shadow_color,
          data.offset_x, data.offset_y, data.padding, data.backdrop_opacity,
          transition, transitionDuration
        );
        return result.lastInsertRowid;
      }
    } catch (err) {
      console.error("[Database] saveTemplate error:", err);
      throw err;
    }
  },

  deleteTemplate: (id: number) => {
    try {
      return getDb().prepare('DELETE FROM templates WHERE id = ?').run(id);
    } catch (err) {
      console.error("[Database] deleteTemplate error:", err);
      throw err;
    }
  },

  // App Settings (Phase 7)
  getSetting: (key: string) => {
    try {
      const row = getDb().prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
      return row?.value ?? null;
    } catch (err) {
      console.error("[Database] getSetting error:", err);
      return null;
    }
  },

  setSetting: (key: string, value: string | null) => {
    try {
      getDb().prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
    } catch (err) {
      console.error("[Database] setSetting error:", err);
      throw err;
    }
  }
};
