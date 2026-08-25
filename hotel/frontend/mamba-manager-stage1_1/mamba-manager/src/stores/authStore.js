import { create } from 'zustand'

const STORAGE_KEY = 'mamba.auth'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function persist(state) {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: state.token, user: state.user, tenant: state.tenant })
    )
  } catch {
    // localStorage may be unavailable (private mode) - fail silently
  }
}

const persisted = loadPersisted()

export const useAuthStore = create((set, get) => ({
  token: persisted?.token ?? null,
  user: persisted?.user ?? null,
  tenant: persisted?.tenant ?? null,

  isAuthenticated: () => !!get().token,

  login: ({ token, user, tenant }) => {
    set({ token, user, tenant })
    persist({ token, user, tenant })
  },

  logout: () => {
    set({ token: null, user: null, tenant: null })
    persist(null)
  },

  updateTenant: (tenant) => {
    set((state) => {
      const next = { ...state.tenant, ...tenant }
      persist({ token: state.token, user: state.user, tenant: next })
      return { tenant: next }
    })
  },
}))

// Roles that can see admin-only destructive settings
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
}
