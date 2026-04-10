import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import { getDb } from './db';

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Bible XML Ingestor (Zefania Format)
// ─────────────────────────────────────────────────────────────────────────────

interface ZefaniaVerse {
  '#text': string;
  '@_vnumber': string;
}

interface ZefaniaChapter {
  VERS: ZefaniaVerse | ZefaniaVerse[];
  '@_cnumber': string;
}

interface ZefaniaBook {
  CHAPTER: ZefaniaChapter | ZefaniaChapter[];
  '@_bname': string;
  '@_bnumber': string;
}

export function importBibleXML(filePath: string) {
  const db = getDb();
  const xmlData = fs.readFileSync(filePath, 'utf8');
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const jsonObj = parser.parse(xmlData);
  const bibleData = jsonObj.XMLBIBLE;

  if (!bibleData) {
    throw new Error('Invalid Zefania XML format: Missing <XMLBIBLE> root.');
  }

  const bibleName = bibleData['@_biblename'] || 'Unknown Bible';
  const abbreviation = bibleData['@_abbreviation'] || '';
  const language = bibleData['@_language'] || 'en';

  // Transaction for batch insertion
  const insertBible = db.prepare('INSERT INTO bibles (name, abbreviation, language, path) VALUES (?, ?, ?, ?)');
  const insertBook = db.prepare('INSERT INTO books (bible_id, name, book_number) VALUES (?, ?, ?)');
  const insertVerse = db.prepare('INSERT INTO verses (book_id, chapter, verse_number, text) VALUES (?, ?, ?, ?)');

  const importTransaction = db.transaction((data: any) => {
    // 1. Insert Bible
    const bibleResult = insertBible.run(bibleName, abbreviation, language, filePath);
    const bibleId = bibleResult.lastInsertRowid;

    const books = Array.isArray(data.BIBLEBOOK) ? data.BIBLEBOOK : [data.BIBLEBOOK];

    for (const book of books) {
      const bookName = book['@_bname'];
      const bookNumber = parseInt(book['@_bnumber'], 10) || 0;

      // 2. Insert Book
      const bookResult = insertBook.run(bibleId, bookName, bookNumber);
      const bookId = bookResult.lastInsertRowid;

      const chapters = Array.isArray(book.CHAPTER) ? book.CHAPTER : [book.CHAPTER];

      for (const chapter of chapters) {
        const chapterNumber = parseInt(chapter['@_cnumber'], 10) || 0;
        const verses = Array.isArray(chapter.VERS) ? chapter.VERS : [chapter.VERS];

        for (const verse of verses) {
          const verseNumber = parseInt(verse['@_vnumber'], 10) || 0;
          const verseText = verse['#text'] || '';

          // 3. Insert Verse
          insertVerse.run(bookId, chapterNumber, verseNumber, verseText);
        }
      }
    }
    
    return bibleId;
  });

  try {
    const importedBibleId = importTransaction(bibleData);
    console.log(`[Parser] Successfully imported Bible "${bibleName}" (ID: ${importedBibleId})`);
    return { success: true, bibleId: importedBibleId, name: bibleName };
  } catch (error) {
    console.error('[Parser] Import failed:', error);
    throw error;
  }
}
