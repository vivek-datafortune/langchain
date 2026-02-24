import { create } from 'zustand'
import type { FeedbackResult } from '../types'

export interface HistoryEntry {
  id: string
  userMessage: string
  result: FeedbackResult
  timestamp: Date
}

interface HistoryStore {
  entries: HistoryEntry[]
  addEntry: (userMessage: string, result: FeedbackResult) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: [],

  addEntry: (userMessage, result) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          id: crypto.randomUUID(),
          userMessage,
          result,
          timestamp: new Date(),
        },
      ],
    })),

  clear: () => set({ entries: [] }),
}))
