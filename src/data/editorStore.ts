import { create } from 'zustand'
import { type Show, type Slide, type SlideType } from './placeholders'

interface EditorState {
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

  // Actions
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
}

export const useEditorStore = create<EditorState>((set, get) => ({
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

  setDraftShow: (show, slides) => {
    // Deep clone slides to ensure isolation
    const clonedSlides = JSON.parse(JSON.stringify(slides))
    set({ 
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
    isEditing: false, 
    draftShow: null, 
    draftSlides: [], 
    selectedSlideId: null 
  })
}))
