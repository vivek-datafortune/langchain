import { create } from 'zustand'
import type { MediVoiceUser } from '../api'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

interface AuthStore {
  isAuthenticated: boolean
  user: MediVoiceUser | null
  showPhoneInput: boolean
  phoneNumber: string
  setAuthenticated: (v: boolean) => void
  setUser: (u: MediVoiceUser | null) => void
  setShowPhoneInput: (v: boolean) => void
  setPhoneNumber: (v: string) => void
  resetPhoneInput: () => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: !!getCookie('medivoice_token'),
  user: null,
  showPhoneInput: false,
  phoneNumber: '',

  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setUser: (u) => set({ user: u }),
  setShowPhoneInput: (v) => set({ showPhoneInput: v }),
  setPhoneNumber: (v) => set({ phoneNumber: v.slice(0, 10) }),
  resetPhoneInput: () => set({ phoneNumber: '' }),
  logout: () => {
    removeCookie('medivoice_token')
    set({ isAuthenticated: false, user: null, showPhoneInput: false, phoneNumber: '' })
  },
}))
