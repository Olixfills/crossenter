/**
 * Crossenter — Lyrics Parsing Utility
 * Converts raw text blobs into structured Show objects.
 */

export interface ParsedSlide {
  type: string;
  text: string;
  label: string;
}

export interface ParsedShow {
  title: string;
  artist: string;
  slides: ParsedSlide[];
}

export function parseLyrics(rawText: string): ParsedShow {
  const lines = rawText.split(/\r?\n/);
  let title = "Untitled Show";
  let artist = "";
  const bodyLines: string[] = [];

  // 1. Extract metadata headers
  lines.forEach(line => {
    const titleMatch = line.match(/^Title\s*=\s*(.*)$/i);
    const artistMatch = line.match(/^Artist\s*=\s*(.*)$/i);

    if (titleMatch) {
      title = titleMatch[1].trim();
    } else if (artistMatch) {
      artist = artistMatch[1].trim();
    } else {
      bodyLines.push(line);
    }
  });

  // 2. Rejoin and split by double line breaks
  const bodyText = bodyLines.join('\n').trim();
  const rawSlides = bodyText.split(/\n\s*\n/);

  const typeCounts: Record<string, number> = {
    Verse: 0,
    Chorus: 0,
    Bridge: 0,
    Misc: 0
  };

  const slides: ParsedSlide[] = rawSlides
    .map(slideText => slideText.trim())
    .filter(text => text.length > 0)
    .map(text => {
      // Simple heuristic for type detection
      // Future: look for [Verse], [Chorus] markers
      let type = "Verse";
      
      const lower = text.toLowerCase();
      if (lower.includes("chorus")) type = "Chorus";
      else if (lower.includes("bridge")) type = "Bridge";
      
      // Remove the marker if found at start
      const cleanText = text.replace(/^(verse|chorus|bridge)\s*\d*\s*:?\s*/i, "").trim();
      
      typeCounts[type]++;
      
      return {
        type,
        text: cleanText,
        label: `${type} ${typeCounts[type]}`
      };
    });

  return {
    title,
    artist,
    slides
  };
}
