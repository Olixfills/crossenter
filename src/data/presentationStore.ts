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

  // Phase 8: Media Transport State
  playbackMode: 'background' | 'foreground'
  mediaPlaying: boolean
  mediaCurrentTime: number
  mediaDuration: number
  mediaVolume: number
  mediaMuted: boolean
  mediaLoop: boolean
  activeMedia: any | null // The actual media object being rendered

  // Phase 7: Templates
  templates: TemplateData[]
  defaultSongTemplateId: number | null
  defaultScriptureTemplateId: number | null
  
  // Phase 9.5: Blank Screen Configuration
  isBlanked: boolean
  globalBlankType: 'color' | 'gradient' | 'image'
  globalBlankValue: string

  // Phase 10: Refined Overlays
  isLogoEnabled: boolean
  logoUrl: string
  logoPosition: string
  logoScale: number
  logoOpacity: number
  logoIsFullScreen: boolean

  isTimerEnabled: boolean
  timerMode: 'countdown' | 'clock'
  timerTarget: string
  timerPosition: string
  timerColor: string
  timerFontSize: number

  isSafetyEnabled: boolean
  safetyUrl: string
  loadActivePlaylist: () => Promise<void>
  setPlaylistItems: (items: PlaylistItem[]) => void
  setActiveShow: (show: Show | null) => void
  setSelectedSlideId: (id: string | null) => void
  setLiveSlideId: (id: string | null) => void
  goLive: (slideId: string | null) => void
  goLiveExternal: (slide: Slide | null) => void
  
  setBackgroundMedia: (media: Media | null, context: 'scripture' | 'show') => void
  setStyles: (styles: Partial<TextStyles>) => void

  // Phase 8 Actions
  sendMediaCommand: (command: 'PLAY' | 'PAUSE' | 'STOP' | 'SEEK' | 'SET_VOLUME' | 'TOGGLE_MUTE' | 'TOGGLE_LOOP', payload?: any) => void
  updateMediaState: (state: Partial<PresentationState>) => void

  removePlaylistItem: (itemId: number) => Promise<void>
  reorderPlaylistItems: (newItems: PlaylistItem[]) => Promise<void>
// ... rest ...
  
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
  clearOutput: () => void

  // Phase 7: Template Management
  loadTemplates: () => Promise<void>
  setDefaultTemplate: (type: 'song' | 'scripture', templateId: number | null) => Promise<void>
  refreshTemplates: () => Promise<void>

  // Phase 9.5 Actions
  toggleBlank: () => void
  setBlankSetting: (key: 'global_blank_type' | 'global_blank_value', value: string) => Promise<void>

  // Phase 10 Actions
  toggleOverlay: (type: 'logo' | 'timer' | 'safety') => void
  setOverlaySetting: (key: string, value: any) => Promise<void>
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
            playbackMode: message.payload.playbackMode,
            activeMedia: message.payload.activeMedia,
            // Only update backgrounds if we are an output window
            ...(window.location.hash !== '#control' && {
               scriptureBackground: message.payload.scriptureBackground,
               showBackground: message.payload.showBackground,
               isBlanked: message.payload.isBlanked,
               globalBlankType: message.payload.globalBlankType,
               globalBlankValue: message.payload.globalBlankValue,
               
               // Phase 10
               isLogoEnabled: message.payload.isLogoEnabled,
               logoUrl: message.payload.logoUrl,
               logoPosition: message.payload.logoPosition,
               logoScale: message.payload.logoScale,
               logoOpacity: message.payload.logoOpacity,
               isTimerEnabled: message.payload.isTimerEnabled,
               timerMode: message.payload.timerMode,
               timerTarget: message.payload.timerTarget,
               timerPosition: message.payload.timerPosition,
               timerColor: message.payload.timerColor,
               timerFontSize: message.payload.timerFontSize,
               isSafetyEnabled: message.payload.isSafetyEnabled,
               safetyUrl: message.payload.safetyUrl,
            })
          })
        }
        if (message.type === 'MEDIA_SYNC') {
          usePresentationStore.setState({
            mediaCurrentTime: message.payload.currentTime,
            mediaDuration: message.payload.duration,
            mediaPlaying: message.payload.playing,
            mediaMuted: message.payload.muted,
            mediaVolume: message.payload.volume,
            mediaLoop: message.payload.loop
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
        styles: textStyles,
        playbackMode: state.playbackMode,
        activeMedia: state.activeMedia,
        mediaLoop: state.mediaLoop,
        mediaVolume: state.mediaVolume,
        mediaMuted: state.mediaMuted,
        isBlanked: state.isBlanked,
        globalBlankType: state.globalBlankType,
        globalBlankValue: state.globalBlankValue,
        
        // Phase 10
        isLogoEnabled: state.isLogoEnabled,
        logoUrl: state.logoUrl,
        logoPosition: state.logoPosition,
        logoScale: state.logoScale,
        logoOpacity: state.logoOpacity,
        isTimerEnabled: state.isTimerEnabled,
        timerMode: state.timerMode,
        timerTarget: state.timerTarget,
        timerPosition: state.timerPosition,
        timerColor: state.timerColor,
        timerFontSize: state.timerFontSize,
        isSafetyEnabled: state.isSafetyEnabled,
        safetyUrl: state.safetyUrl,
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

  // Phase 8
  playbackMode: 'background',
  mediaPlaying: false,
  mediaCurrentTime: 0,
  mediaDuration: 0,
  mediaVolume: 1,
  mediaMuted: false,
  mediaLoop: false,
  activeMedia: null,

  // Phase 7
  templates: [],
  defaultSongTemplateId: null,
  defaultScriptureTemplateId: null,

  // Phase 9.5
  isBlanked: false,
  globalBlankType: 'color',
  globalBlankValue: '#000000',

  // Phase 10
  isLogoEnabled: false,
  logoUrl: '',
  logoPosition: 'bottom-right',
  logoScale: 100,
  logoOpacity: 1,

  isTimerEnabled: false,
  timerMode: 'clock',
  timerTarget: '00:05:00',
  timerPosition: 'top-right',
  timerColor: '#ffffff',
  timerFontSize: 48,

  isSafetyEnabled: false,
  safetyUrl: '',

  setBackgroundMedia: (media, context) => {
    if (context === 'scripture') set({ scriptureBackground: media })
    else set({ showBackground: media })
    broadcastLiveEnriched(get())
  },

  setStyles: (styles) => {
    set({ textStyles: { ...get().textStyles, ...styles } })
    broadcastLiveEnriched(get())
  },

  sendMediaCommand: (command, payload) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'MEDIA_COMMAND', command, payload }))
      // Optimistic update for immediate UI response
      if (command === 'PLAY') set({ mediaPlaying: true })
      if (command === 'PAUSE' || command === 'STOP') set({ mediaPlaying: false })
    }
  },

  updateMediaState: (newState) => set(newState),

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
    const slide = get().slides.find(s => s.id === liveSlideId) || null
    if (slide) get().goLiveInternal(slide, liveSlideId)
  },

  // Internal helper to apply slide state consistently
  goLiveInternal: (slide, slideId) => {
    const state = get()
    const { templates, defaultSongTemplateId, defaultScriptureTemplateId } = state
    
    // 1. Resolve Template
    const isScripture = slide?.type === 'scripture'
    const templateId = isScripture ? defaultScriptureTemplateId : defaultSongTemplateId
    const template = templateId ? templates.find(t => t.id === templateId) : undefined
    
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

    // 2. Resolve Media Hierarchy (Phase 8)
    let playbackMode: 'foreground' | 'background' = 'background'
    let activeMedia = null

    // Priority 1: Slide-level Foreground Media
    if (slide?.media_url) {
      playbackMode = 'foreground'
      activeMedia = { url: slide.media_url, type: slide.media_type || 'video', name: slide.label }
    } 
    // Priority 2: Show-level Background Media
    else if ((state.activeShow as any)?.background_media) {
      playbackMode = 'background'
      activeMedia = (state.activeShow as any).background_media
    }
    // Priority 3: Slide-level Background Media (If added to slide specifically)
    else if ((slide as any)?.background_media) {
      playbackMode = 'background'
      activeMedia = (slide as any).background_media
    }
    // Priority 4: Template Fallback
    else if (newStyles.templateBgType === 'video' || newStyles.templateBgType === 'image') {
      playbackMode = 'background'
      activeMedia = { url: newStyles.templateBgValue, type: newStyles.templateBgType, name: 'Template BG' }
    }

    const mediaLoop = playbackMode === 'background'
    const currentActiveUrl = state.activeMedia?.url
    const isSameMedia = activeMedia?.url === currentActiveUrl

    // 3. Update State
    set({ 
      liveSlideId: slideId || slide?.id || null, 
      liveSlide: slide, 
      selectedSlideId: slideId || slide?.id || state.selectedSlideId, 
      textStyles: newStyles,
      playbackMode,
      activeMedia: isSameMedia ? state.activeMedia : activeMedia,
      mediaPlaying: isSameMedia ? state.mediaPlaying : false,
      mediaCurrentTime: isSameMedia ? state.mediaCurrentTime : 0,
      mediaLoop: isSameMedia ? state.mediaLoop : mediaLoop,
      // Clear slides context if external
      ...(!slideId && { activeShow: null, slides: [] })
    })

    // 4. Broadcast
    broadcastLiveEnriched(get())
  },

  goLive: (slideId) => {
    get().setLiveSlideId(slideId)
  },

  goLiveExternal: (slide) => {
    // Ensure templates are loaded before going live
    if (get().templates.length === 0) {
      get().loadTemplates().then(() => get().goLiveInternal(slide))
    } else {
      get().goLiveInternal(slide)
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
      
      // Phase 9.5
      const blankType = await window.crossenter.getSetting('global_blank_type')
      const blankValue = await window.crossenter.getSetting('global_blank_value')

      // Phase 10
      const isLogoEnabled = await window.crossenter.getSetting('is_logo_enabled') === 'true'
      const logoUrl = await window.crossenter.getSetting('logo_url') || ''
      const logoPosition = await window.crossenter.getSetting('logo_position') || 'bottom-right'
      const logoScale = Number(await window.crossenter.getSetting('logo_scale') || '100')
      const logoOpacity = Number(await window.crossenter.getSetting('logo_opacity') || '1')

      const isTimerEnabled = await window.crossenter.getSetting('is_timer_enabled') === 'true'
      const timerMode = (await window.crossenter.getSetting('timer_mode') || 'clock') as any
      const timerTarget = await window.crossenter.getSetting('timer_target') || '00:05:00'
      const timerPosition = await window.crossenter.getSetting('timer_position') || 'top-right'
      const timerColor = await window.crossenter.getSetting('timer_color') || '#ffffff'
      const timerFontSize = Number(await window.crossenter.getSetting('timer_font_size') || '48')

      const isSafetyEnabled = await window.crossenter.getSetting('is_safety_enabled') === 'true'
      const safetyUrl = await window.crossenter.getSetting('safety_url') || ''
      const logoIsFullScreen = await window.crossenter.getSetting('logo_is_full_screen') === 'true'

      set({
        templates: templates || [],
        defaultSongTemplateId: songIdStr ? Number(songIdStr) : null,
        defaultScriptureTemplateId: scriptureIdStr ? Number(scriptureIdStr) : null,
        globalBlankType: (blankType as any) || 'color',
        globalBlankValue: blankValue || '#000000',

        isLogoEnabled, logoUrl, logoPosition, logoScale, logoOpacity, logoIsFullScreen,
        isTimerEnabled, timerMode, timerTarget, timerPosition, timerColor, timerFontSize,
        isSafetyEnabled, safetyUrl
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

  toggleBlank: () => {
    set({ isBlanked: !get().isBlanked })
    broadcastLiveEnriched(get())
  },

  setBlankSetting: async (key, value) => {
    await window.crossenter.setSetting(key, value)
    if (key === 'global_blank_type') set({ globalBlankType: value as any })
    if (key === 'global_blank_value') set({ globalBlankValue: value })
    broadcastLiveEnriched(get())
  },

  toggleOverlay: (type) => {
    if (type === 'logo') {
      const newVal = !get().isLogoEnabled
      set({ isLogoEnabled: newVal })
      window.crossenter.setSetting('is_logo_enabled', String(newVal))
    }
    if (type === 'timer') {
      const newVal = !get().isTimerEnabled
      set({ isTimerEnabled: newVal })
      window.crossenter.setSetting('is_timer_enabled', String(newVal))
    }
    if (type === 'safety') {
      const newVal = !get().isSafetyEnabled
      set({ isSafetyEnabled: newVal })
      window.crossenter.setSetting('is_safety_enabled', String(newVal))
    }
    broadcastLiveEnriched(get())
  },

  setOverlaySetting: async (key, value) => {
    // 1. Map camelCase to snake_case for SQLite
    const settingKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    await window.crossenter.setSetting(settingKey, String(value))
    
    // 2. Update state
    set({ [key]: value } as any)
    
    // 3. Broadcast
    broadcastLiveEnriched(get())
  },

  clearOutput: () => {
    set({ 
      liveSlideId: null, 
      liveSlide: null, 
      selectedSlideId: null,
      isLogoEnabled: false,
      isTimerEnabled: false,
      isSafetyEnabled: false,
      isBlanked: false
    })
    broadcastLiveEnriched(get())
  },
}))

if (typeof window !== 'undefined' && window.crossenter) {
  connectWS();
  usePresentationStore.getState().loadActivePlaylist();
  usePresentationStore.getState().loadTemplates();
}
