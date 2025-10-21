import { create } from 'zustand'

interface User {
  id: number
  email: string
  username: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: boolean
  hydrated: boolean
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
    set({ user, token, isAuthenticated: true })
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

