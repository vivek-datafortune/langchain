import { create } from 'zustand'

export interface MediVoiceHeaderActions {
  show: boolean
  messageCount: number
  onClear: () => void
  isClearing: boolean
  onResetConversation: () => void
  onOpenSettings: () => void
  onLogout: () => void
  disabled: boolean
}

interface MediVoiceHeaderActionsStore {
  actions: MediVoiceHeaderActions | null
  setActions: (actions: MediVoiceHeaderActions | null) => void
}

export const useMediVoiceHeaderActionsStore = create<MediVoiceHeaderActionsStore>((set) => ({
  actions: null,
  setActions: (actions) => set({ actions }),
}))
