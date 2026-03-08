import { create } from 'zustand'
import type { SlotConfig, LocalFile, SlotType, SeparatorType, MenuId } from '../types'

const DEFAULT_SLOTS: SlotConfig[] = [
  { type: '起', label: '起（イントロ）', color: '#FF8400', files: [] },
  { type: '承', label: '承（展開）', color: '#2563EB', files: [] },
  { type: '転', label: '転（転換）', color: '#16A34A', files: [] },
  { type: '結', label: '結（結論）', color: '#DC2626', files: [] },
]

interface EditorStore {
  slots: SlotConfig[]
  mergedMarkdown: string
  outputFileName: string
  outputFolderPath: string
  isGoogleAuthenticated: boolean
  activeMenu: MenuId
  isMerging: boolean
  isSaving: boolean
  isScanning: boolean // [P1-11] スキャン中状態
  separator: SeparatorType
  extractImages: boolean

  setSlots: (slots: SlotConfig[]) => void
  addFileToSlot: (slotType: SlotType, file: LocalFile) => void
  removeFileFromSlot: (slotType: SlotType, fileIndex: number) => void
  moveFile: (fromSlot: SlotType, fromIndex: number, toSlot: SlotType, toIndex: number) => void
  setMergedMarkdown: (md: string) => void
  setOutputFileName: (name: string) => void
  setOutputFolderPath: (path: string) => void
  setGoogleAuthenticated: (status: boolean) => void
  setActiveMenu: (menu: MenuId) => void
  setIsMerging: (v: boolean) => void
  setIsSaving: (v: boolean) => void
  setIsScanning: (v: boolean) => void
  setSeparator: (v: SeparatorType) => void
  setExtractImages: (v: boolean) => void
  resetSlots: () => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  slots: DEFAULT_SLOTS.map(s => ({ ...s, files: [] })),
  mergedMarkdown: '',
  outputFileName: 'output_document.md',
  outputFolderPath: '',
  isGoogleAuthenticated: false,
  activeMenu: 'editor',
  isMerging: false,
  isSaving: false,
  isScanning: false,
  separator: 'hr' as SeparatorType,
  extractImages: false,

  setSlots: (slots) => set({ slots }),

  addFileToSlot: (slotType, file) => set((state) => ({
    slots: state.slots.map(slot =>
      slot.type === slotType
        ? { ...slot, files: [...slot.files, file] }
        : slot
    ),
  })),

  removeFileFromSlot: (slotType, fileIndex) => set((state) => ({
    slots: state.slots.map(slot =>
      slot.type === slotType
        ? { ...slot, files: slot.files.filter((_, i) => i !== fileIndex) }
        : slot
    ),
  })),

  // [P1-12] non-null assertion 除去 → ガード節
  moveFile: (fromSlot, fromIndex, toSlot, toIndex) => set((state) => {
    const newSlots = state.slots.map(s => ({ ...s, files: [...s.files] }))
    const from = newSlots.find(s => s.type === fromSlot)
    const to = newSlots.find(s => s.type === toSlot)
    if (!from || !to) return state
    const [moved] = from.files.splice(fromIndex, 1)
    if (!moved) return state
    to.files.splice(toIndex, 0, moved)
    return { slots: newSlots }
  }),

  setMergedMarkdown: (md) => set({ mergedMarkdown: md }),
  setOutputFileName: (name) => set({ outputFileName: name }),
  setOutputFolderPath: (path) => set({ outputFolderPath: path }),
  setGoogleAuthenticated: (status) => set({ isGoogleAuthenticated: status }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  setIsMerging: (v) => set({ isMerging: v }),
  setIsSaving: (v) => set({ isSaving: v }),
  setIsScanning: (v) => set({ isScanning: v }),
  setSeparator: (v) => set({ separator: v }),
  setExtractImages: (v) => set({ extractImages: v }),
  resetSlots: () => set({ slots: DEFAULT_SLOTS.map(s => ({ ...s, files: [] })) }),
}))
