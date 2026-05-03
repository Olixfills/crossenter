import { useEffect } from 'react';

/**
 * Custom hook to dynamically load fonts from Google Fonts.
 * Injects a <link> tag into the head of the current window/document.
 * @param fontFamily Names of fonts to load (e.g. "Roboto" or "Plus Jakarta Sans")
 */
export function useFontLoader(fontFamily: string | undefined) {
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Inter' || fontFamily === 'system-ui' || fontFamily === 'sans-serif') {
      return;
    }

    // Clean up the font name for the Google Fonts API
    const formattedFont = fontFamily.replace(/\s+/g, '+');
    const linkId = `google-font-${formattedFont.toLowerCase()}`;

    // If already loaded, skip
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@400;500;700;800;900&display=swap`;
    
    document.head.appendChild(link);

    console.log(`[useFontLoader] Dynamic font loaded: ${fontFamily}`);
  }, [fontFamily]);
}
