import { create } from 'zustand'
import type { HRUser } from '../types'
import { apiLogout, getCurrentUser, getToken } from '../lib/db'

interface AuthState {
  user: HRUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: HRUser) => void
  logout: () => void
  restoreSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => set({ user, isAuthenticated: true }),

  logout: () => {
    apiLogout(get().user)
    set({ user: null, isAuthenticated: false })
  },

  restoreSession: () => {
    const token = getToken()
    if (!token) { set({ isLoading: false }); return }
    const user = getCurrentUser()
    if (user) set({ user, isAuthenticated: true, isLoading: false })
    else set({ isLoading: false })
  },
}))
