import { create } from 'zustand'
import { type Show, type Slide, type SlideType } from './placeholders'

// ─────────────────────────────────────────────────────────────────────────────
// Template shape (mirrors the DB schema)
// ─────────────────────────────────────────────────────────────────────────────
export interface TemplateData {
  id?: number
  name: string
  bg_type: 'color' | 'image' | 'video' | 'gradient'
  bg_value: string          // CSS color, file path, or CSS gradient string
  font_family: string
  font_size: number
  font_color: string
  text_align: 'left' | 'center' | 'right'
  shadow_blur: number
  shadow_color: string
  offset_x: number
  offset_y: number
  padding: number
  backdrop_opacity: number
  // Phase 8 additions
  transition: 'cut' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
  transition_duration: number  // milliseconds
}

export const DEFAULT_TEMPLATE: TemplateData = {
  name: 'New Template',
  bg_type: 'color',
  bg_value: '#000000',
  font_family: 'Inter',
  font_size: 64,
  font_color: '#ffffff',
  text_align: 'center',
  shadow_blur: 40,
  shadow_color: 'rgba(0,0,0,0.8)',
  offset_x: 0,
  offset_y: 10,
  padding: 24,
  backdrop_opacity: 0.3,
  transition: 'fade',
  transition_duration: 700,
}

interface EditorState {
  // Mode distinguishes between editing a Show vs. editing a Template
  editorMode: 'show' | 'template' | null

  // Show editing state
  isEditing: boolean
  draftShow: Show | null
  draftSlides: Slide[]
  selectedSlideId: string | null
  
  // Local formatting for this show
  localStyles: {
    fontSize: number
    textAlign: 'left' | 'center' | 'right'
    fontWeight: string
    isItalic: boolean
  }

  // Template editing state
  draftTemplate: TemplateData | null

  // ── Actions ──────────────────────────────────────────────────────────────
  // Show editing
  setDraftShow: (show: Show, slides: Slide[]) => void
  updateSlideText: (id: string, text: string) => void
  updateSlideType: (id: string, type: SlideType) => void
  updateLocalStyles: (styles: Partial<EditorState['localStyles']>) => void
  setSelectedSlideId: (id: string | null) => void
  addSlide: () => void
  removeSlide: (id: string) => void
  splitSlide: (id: string, firstPart: string, secondPart: string) => void
  setDraftSlides: (slides: Slide[]) => void
  clearEditor: () => void

  // Template editing
  openTemplateEditor: (templateData?: Partial<TemplateData>) => void
  updateDraftTemplate: (key: keyof TemplateData, value: any) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  editorMode: null,

  isEditing: false,
  draftShow: null,
  draftSlides: [],
  selectedSlideId: null,
  localStyles: {
    fontSize: 64,
    textAlign: 'center',
    fontWeight: '900',
    isItalic: false
  },

  draftTemplate: null,

  // ── Show editing actions ────────────────────────────────────────────────
  setDraftShow: (show, slides) => {
    const clonedSlides = JSON.parse(JSON.stringify(slides))
    set({ 
      editorMode: 'show',
      draftShow: show, 
      draftSlides: clonedSlides, 
      isEditing: true,
      selectedSlideId: clonedSlides.length > 0 ? clonedSlides[0].id : null,
      localStyles: (show as any).settings || {
        fontSize: 64,
        textAlign: 'center',
        fontWeight: '900',
        isItalic: false
      }
    })
  },

  updateSlideText: (id, text) => {
    const { draftSlides } = get()
    const updated = draftSlides.map(s => s.id === id ? { ...s, text } : s)
    set({ draftSlides: updated })
  },

  updateSlideType: (id, type) => {
    const { draftSlides } = get()
    const updated = draftSlides.map(s => s.id === id ? { ...s, type, label: `${type} ${id.slice(-2)}` } : s)
    set({ draftSlides: updated })
  },

  updateLocalStyles: (styles) => {
    set({ localStyles: { ...get().localStyles, ...styles } })
  },

  setSelectedSlideId: (id) => set({ selectedSlideId: id }),

  addSlide: () => {
    const { draftSlides } = get()
    const newId = `new-${Date.now()}`
    const newSlide: Slide = {
      id: newId,
      type: 'verse',
      label: 'New Verse',
      text: ''
    }
    set({ 
      draftSlides: [...draftSlides, newSlide],
      selectedSlideId: newId
    })
  },

  removeSlide: (id) => {
    const { draftSlides, selectedSlideId } = get()
    const updated = draftSlides.filter(s => s.id !== id)
    let nextSelected = selectedSlideId
    if (selectedSlideId === id) {
      nextSelected = updated.length > 0 ? updated[updated.length - 1].id : null
    }
    set({ draftSlides: updated, selectedSlideId: nextSelected })
  },

  splitSlide: (id, firstPart, secondPart) => {
    const { draftSlides } = get()
    const index = draftSlides.findIndex(s => s.id === id)
    if (index === -1) return

    const currentSlide = draftSlides[index]
    const newSlideId = `split-${Date.now()}`
    const newSlide: Slide = {
      ...currentSlide,
      id: newSlideId,
      text: secondPart,
      label: `${currentSlide.type} (Split)`
    }

    const updatedSlides = [...draftSlides]
    updatedSlides[index] = { ...currentSlide, text: firstPart }
    updatedSlides.splice(index + 1, 0, newSlide)

    set({ 
      draftSlides: updatedSlides,
      selectedSlideId: newSlideId
    })
  },

  setDraftSlides: (slides) => set({ draftSlides: slides }),

  clearEditor: () => set({ 
    editorMode: null,
    isEditing: false, 
    draftShow: null, 
    draftSlides: [], 
    selectedSlideId: null,
    draftTemplate: null,
  }),

  // ── Template editing actions ────────────────────────────────────────────
  openTemplateEditor: (templateData) => {
    set({
      editorMode: 'template',
      draftTemplate: { ...DEFAULT_TEMPLATE, ...templateData },
      // Reset show state so it doesn't leak
      draftShow: null,
      draftSlides: [],
      selectedSlideId: null,
      isEditing: false,
    })
  },

  updateDraftTemplate: (key, value) => {
    const { draftTemplate } = get()
    if (!draftTemplate) return
    set({ draftTemplate: { ...draftTemplate, [key]: value } })
  },
}))
