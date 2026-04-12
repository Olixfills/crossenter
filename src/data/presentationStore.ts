import { create } from 'zustand'
import { 
  type Playlist,
  type PlaylistItem,
  type Show,
  type Slide
} from './placeholders'
import type { TemplateData } from './editorStore'

declare global {
  interface Window {
    crossenter: any
  }
}

interface Media {
  name: string
  path: string
  url: string
  type: 'video' | 'image'
}

interface TextStyles {
  fontSize: number
  color: string
  fontWeight: string
  textAlign: 'left' | 'center' | 'right'
  textShadowColor: string
  textShadowBlur: number
  textShadowX: number
  textShadowY: number
  bgOpacity: number
  padding: number
  // Template-driven fields (resolved when going live)
  fontFamily: string
  templateBgType: 'color' | 'image' | 'video' | 'gradient' | null
  templateBgValue: string | null
  transition: 'cut' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
  transitionDuration: number
}

interface PresentationState {
  // Data
  activePlaylist: Playlist | null
  playlistItems: PlaylistItem[]
  activeShow: Show | null
  slides: Slide[]
  
  // Selection
  selectedSlideId: string | null
  liveSlideId: string | null
  liveSlide: Slide | null
  liveNextSlide: Slide | null
  
  // Contextual Backgrounds & Styles
  scriptureBackground: Media | null
  showBackground: Media | null
  textStyles: TextStyles

  // Phase 7: Templates
  templates: TemplateData[]
  defaultSongTemplateId: number | null
  defaultScriptureTemplateId: number | null
  
  // Actions
  loadActivePlaylist: () => Promise<void>
  setPlaylistItems: (items: PlaylistItem[]) => void
  setActiveShow: (show: Show | null) => void
  setSelectedSlideId: (id: string | null) => void
  setLiveSlideId: (id: string | null) => void
  goLive: (slideId: string | null) => void
  goLiveExternal: (slide: Slide | null) => void
  
  setBackgroundMedia: (media: Media | null, context: 'scripture' | 'show') => void
  setStyles: (styles: Partial<TextStyles>) => void

  removePlaylistItem: (itemId: number) => Promise<void>
  reorderPlaylistItems: (newItems: PlaylistItem[]) => Promise<void>
  
  // Playlist Management
  saveActivePlaylistAs: (name: string) => Promise<void>
  renameActivePlaylist: (name: string) => Promise<void>
  deleteSavedPlaylist: (id: number) => Promise<void>
  loadSavedPlaylist: (id: number) => Promise<void>

  // Style Management
  resetStyles: () => void

  nextSlide: () => void
  prevSlide: () => void
  refreshActiveShow: () => Promise<void>

  // Phase 7: Template Management
  loadTemplates: () => Promise<void>
  setDefaultTemplate: (type: 'song' | 'scripture', templateId: number | null) => Promise<void>
  refreshTemplates: () => Promise<void>
}

const DEFAULT_TEXT_STYLES: TextStyles = {
  fontSize: 64,
  color: '#ffffff',
  fontWeight: '900',
  textAlign: 'center',
  textShadowColor: 'rgba(0,0,0,0.8)',
  textShadowBlur: 40,
  textShadowX: 0,
  textShadowY: 10,
  bgOpacity: 0.3,
  padding: 24,
  fontFamily: 'Inter',
  templateBgType: null,
  templateBgValue: null,
  transition: 'fade',
  transitionDuration: 700,
}

// WebSocket client for broadcasting live changes
let ws: WebSocket | null = null

const connectWS = () => {
  if (typeof window === 'undefined') return
  try {
    ws = new WebSocket('ws://localhost:8080')
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'SYNC_STATE') {
          usePresentationStore.setState({ 
            liveSlide: message.payload.current,
            liveSlideId: message.payload.current?.id,
            liveNextSlide: message.payload.next,
            textStyles: message.payload.styles,
            // Only update backgrounds if we are an output window
            ...(window.location.hash !== '#control' && {
               scriptureBackground: message.payload.scriptureBackground,
               showBackground: message.payload.showBackground
            })
          })
        }
      } catch (e) {
        console.error('[Sync Error]:', e)
      }
    }
    ws.onclose = () => { setTimeout(connectWS, 2000) }
  } catch (e) { console.error(e) }
}

const broadcastLiveEnriched = (state: PresentationState) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const { liveSlide, slides, scriptureBackground, showBackground, textStyles } = state
    
    // Find Next Slide
    let nextSlide: Slide | null = null
    if (liveSlide && slides.length > 0) {
      const idx = slides.findIndex((s: any) => s.id === liveSlide.id)
      if (idx !== -1 && idx < slides.length - 1) {
        nextSlide = slides[idx + 1]
      }
    }

    ws.send(JSON.stringify({
      type: 'SYNC_STATE',
      payload: {
        current: liveSlide,
        next: nextSlide,
        scriptureBackground,
        showBackground,
        styles: textStyles
      }
    }))
  }
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  activePlaylist: null,
  playlistItems: [],
  activeShow: null,
  slides: [], 
  
  selectedSlideId: null,
  liveSlideId: null,
  liveSlide: null,
  liveNextSlide: null,

  scriptureBackground: null,
  showBackground: null,
  textStyles: DEFAULT_TEXT_STYLES,

  // Phase 7
  templates: [],
  defaultSongTemplateId: null,
  defaultScriptureTemplateId: null,

  setBackgroundMedia: (media, context) => {
    if (context === 'scripture') set({ scriptureBackground: media })
    else set({ showBackground: media })
    broadcastLiveEnriched(get())
  },

  setStyles: (styles) => {
    set({ textStyles: { ...get().textStyles, ...styles } })
    broadcastLiveEnriched(get())
  },

  loadActivePlaylist: async () => {
    const pl = await window.crossenter.getActivePlaylist();
    set({ 
      activePlaylist: pl, 
      playlistItems: (pl.items || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    });
  },

  setPlaylistItems: (playlistItems) => set({ playlistItems }),
  
  removePlaylistItem: async (itemId) => {
    const { activePlaylist, playlistItems } = get();
    if (!activePlaylist) return;
    const updated = playlistItems.filter(i => i.id !== itemId);
    set({ playlistItems: updated });
    await window.crossenter.updatePlaylistItems({ 
      playlistId: activePlaylist.id, 
      items: updated.map((it, idx) => ({ ...it, sort_order: idx }))
    });
  },

  reorderPlaylistItems: async (newItems) => {
    const { activePlaylist } = get();
    if (!activePlaylist) return;
    const itemsWithOrder = newItems.map((it, idx) => ({ ...it, sort_order: idx }));
    set({ playlistItems: itemsWithOrder });
    await window.crossenter.updatePlaylistItems({ 
      playlistId: activePlaylist.id, 
      items: itemsWithOrder
    });
  },

  setActiveShow: (activeShow) => {
    set({ 
      activeShow, 
      selectedSlideId: null,
      slides: activeShow?.content || []
    })
  },

  setSelectedSlideId: (selectedSlideId) => set({ selectedSlideId }),
  
  setLiveSlideId: (liveSlideId) => {
    const applyLive = () => {
      const state = get()
      const slide = state.slides.find(s => s.id === liveSlideId) || null
      // Resolve the appropriate template based on slide type
      const { templates, defaultSongTemplateId, defaultScriptureTemplateId } = state
      const isScripture = slide?.type === 'scripture'
      const templateId = isScripture ? defaultScriptureTemplateId : defaultSongTemplateId
      const template = templateId ? templates.find(t => t.id === templateId) : undefined
      
      console.log('[goLive] templates:', templates.length, 'templateId:', templateId, 'found:', !!template)
      
      const templateStyles = template ? {
        fontSize: template.font_size,
        color: template.font_color,
        textAlign: template.text_align as any,
        textShadowColor: template.shadow_color,
        textShadowBlur: template.shadow_blur,
        textShadowX: template.offset_x,
        textShadowY: template.offset_y,
        bgOpacity: template.backdrop_opacity,
        padding: template.padding,
        fontFamily: template.font_family,
        templateBgType: template.bg_type,
        templateBgValue: template.bg_value,
        transition: (template as any).transition ?? 'fade',
        transitionDuration: (template as any).transition_duration ?? 700,
      } : {}
      const newStyles = { ...state.textStyles, ...templateStyles }
      set({ liveSlideId, liveSlide: slide, selectedSlideId: liveSlideId, textStyles: newStyles })
      broadcastLiveEnriched(get())
    }

    // If templates haven't loaded yet, load them first then go live
    if (get().templates.length === 0) {
      get().loadTemplates().then(applyLive)
    } else {
      applyLive()
    }
  },

  goLive: (slideId) => {
    get().setLiveSlideId(slideId)
  },

  goLiveExternal: (slide) => {
    const applyExternal = () => {
      const state = get()
      const { templates, defaultScriptureTemplateId, defaultSongTemplateId } = state
      const isScripture = slide?.type === 'scripture'
      const templateId = isScripture ? defaultScriptureTemplateId : defaultSongTemplateId
      const template = templateId ? templates.find(t => t.id === templateId) : undefined

      console.log('[goLiveExternal] templates:', templates.length, 'found:', !!template)

      const templateStyles = template ? {
        fontSize: template.font_size,
        color: template.font_color,
        textAlign: template.text_align as any,
        textShadowColor: template.shadow_color,
        textShadowBlur: template.shadow_blur,
        textShadowX: template.offset_x,
        textShadowY: template.offset_y,
        bgOpacity: template.backdrop_opacity,
        padding: template.padding,
        fontFamily: template.font_family,
        templateBgType: template.bg_type,
        templateBgValue: template.bg_value,
        transition: (template as any).transition ?? 'fade',
        transitionDuration: (template as any).transition_duration ?? 700,
      } : {}
      const newStyles = { ...state.textStyles, ...templateStyles }
      set({ liveSlide: slide, liveSlideId: slide?.id || null, activeShow: null, slides: [], textStyles: newStyles })
      broadcastLiveEnriched(get())
    }

    if (get().templates.length === 0) {
      get().loadTemplates().then(applyExternal)
    } else {
      applyExternal()
    }
  },

  nextSlide: () => {
    const { slides, liveSlideId } = get()
    if (slides.length === 0) return
    const currentIndex = slides.findIndex(s => s.id === liveSlideId)
    const nextIndex = currentIndex + 1
    if (nextIndex < slides.length) get().goLive(slides[nextIndex].id)
  },

  prevSlide: () => {
    const { slides, liveSlideId } = get()
    if (slides.length === 0) return
    const currentIndex = slides.findIndex(s => s.id === liveSlideId)
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) get().goLive(slides[prevIndex].id)
  },

  saveActivePlaylistAs: async (name) => {
    const { playlistItems } = get()
    await window.crossenter.savePlaylistAs(name, playlistItems)
  },

  renameActivePlaylist: async (name) => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    await window.crossenter.renamePlaylist(activePlaylist.id, name)
    set({ activePlaylist: { ...activePlaylist, name } })
  },

  deleteSavedPlaylist: async (id) => {
    await window.crossenter.deletePlaylist(id)
  },

  loadSavedPlaylist: async (id) => {
    const { activePlaylist } = get()
    if (!activePlaylist) return
    
    // 1. Get the items from the saved playlist
    const saved = await window.crossenter.getPlaylistDetails(id)
    if (!saved) return

    // 2. Overwrite the items in the current ACTIVE playlist draft
    const itemsWithOrder = (saved.items || []).map((it: any, idx: number) => ({ ...it, sort_order: idx }))
    await window.crossenter.updatePlaylistItems({ 
      playlistId: activePlaylist.id, 
      items: itemsWithOrder
    })

    // 3. Reload for the UI
    await get().loadActivePlaylist()
    set({ activeShow: null, slides: [], selectedSlideId: null })
  },

  resetStyles: () => {
    set({ textStyles: DEFAULT_TEXT_STYLES })
    broadcastLiveEnriched(get())
  },

  refreshActiveShow: async () => {
    const { activeShow } = get()
    if (!activeShow) return
    
    try {
      const updatedShow = await window.crossenter.getShowWithSlides(activeShow.id)
      if (updatedShow) {
        set({ 
          activeShow: updatedShow, 
          slides: updatedShow.content || [] 
        })
      }
    } catch (err) {
      console.error("[Refresh] Failed to reload active show:", err)
    }
  },

  // Phase 7: Template management
  loadTemplates: async () => {
    try {
      const templates = await window.crossenter.getTemplates()
      const songIdStr = await window.crossenter.getSetting('default_song_template_id')
      const scriptureIdStr = await window.crossenter.getSetting('default_scripture_template_id')
      set({
        templates: templates || [],
        defaultSongTemplateId: songIdStr ? Number(songIdStr) : null,
        defaultScriptureTemplateId: scriptureIdStr ? Number(scriptureIdStr) : null,
      })
    } catch (err) {
      console.error('[Templates] Failed to load templates:', err)
    }
  },

  setDefaultTemplate: async (type, templateId) => {
    const key = type === 'song' ? 'default_song_template_id' : 'default_scripture_template_id'
    await window.crossenter.setSetting(key, templateId ? String(templateId) : null)
    if (type === 'song') set({ defaultSongTemplateId: templateId })
    else set({ defaultScriptureTemplateId: templateId })
  },

  refreshTemplates: async () => {
    const templates = await window.crossenter.getTemplates()
    set({ templates: templates || [] })
  },
}))

if (typeof window !== 'undefined' && window.crossenter) {
  connectWS();
  usePresentationStore.getState().loadActivePlaylist();
  usePresentationStore.getState().loadTemplates();
}
