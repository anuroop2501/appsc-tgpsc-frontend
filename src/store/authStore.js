import { create } from 'zustand'

const TOKEN_KEY = 'examedge_token'
const REFRESH_KEY = 'examedge_refresh_token'
const USER_KEY = 'examedge_user'

const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem(TOKEN_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_KEY) || null,
  isLoading: false,

  setAuth: ({ user, token, refreshToken }) => {
    localStorage.setItem(TOKEN_KEY, token)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, token, refreshToken: refreshToken || get().refreshToken })
  },

  updateUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null, refreshToken: null })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))

export default useAuthStore
