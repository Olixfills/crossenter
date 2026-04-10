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
  }
};
