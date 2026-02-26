import { create } from 'zustand'

interface MediVoiceSearchStore {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useMediVoiceSearchStore = create<MediVoiceSearchStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
