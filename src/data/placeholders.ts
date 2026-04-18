// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Placeholder data for Phase 1 static UI
// ─────────────────────────────────────────────────────────────────────────────

export type SlideType = 'verse' | 'chorus' | 'bridge' | 'tag' | 'media' | 'blank' | 'title' | 'scripture'

export interface Slide {
  id: string
  type: SlideType
  label: string
  text: string
  showTitle?: string
  active?: boolean
  media_url?: string
  media_type?: 'video' | 'image' | 'audio' | 'link'
  background_media_id?: number | null
}

export interface Show {
  id: number | string
  title: string
  artist?: string
  category_id?: number
  content: Slide[]
  type: 'song' | 'scripture' | 'media' | 'presentation' | 'recital'
  created_at?: string
  background_media_id?: number | null
}

export interface Category {
  id: number
  name: string
  type: 'show' | 'media'
}

export interface Playlist {
  id: number
  name: string
  is_active: boolean
  items: PlaylistItem[]
}

export interface PlaylistItem {
  id: number
  playlist_id: number
  type: 'song' | 'scripture' | 'media' | 'presentation' | 'recital'
  reference_id: number | null
  metadata: any // For scripture ranges or media paths
  sort_order: number
  // Computed fields for UI convenience
  title: string
  subtitle?: string
  active?: boolean
  duration?: string
}

export interface LibraryItem {
  id: string | number
  title: string
  subtitle?: string
  type: 'song' | 'scripture' | 'media' | 'template' | 'presentation' | 'recital'
  category?: string
  date?: string
  slidesCount?: number
  wordsCount?: number
}

// ── Tag buttons for RightPane ─────────────────────────────────────────────────
export const CURRENT_TAGS  = ['Verse', 'Chorus', 'Bridge', 'Tag', 'Intro', 'Outro']
export const GLOBAL_TAGS   = ['Clear', 'Blank', 'Logo', 'Timer', 'Scripture', 'Media']

// ── Slide type badge colours ──────────────────────────────────────────────────
export const SLIDE_TYPE_STYLES: Record<string, string> = {
  verse:   'bg-blue-900/60 text-blue-300 border border-blue-700/50',
  chorus:  'bg-purple-900/60 text-purple-300 border border-purple-700/50',
  bridge:  'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  tag:     'bg-teal-900/60 text-teal-300 border border-teal-700/50',
  media:   'bg-slate-800/80 text-slate-300 border border-slate-600/50',
  blank:   'bg-zinc-800/50 text-zinc-500 border border-zinc-700/40',
  title:   'bg-purple-900/60 text-purple-200 border border-purple-600/50',
  scripture: 'bg-indigo-900/60 text-indigo-200 border border-indigo-600/50',
}
