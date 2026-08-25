import { create } from 'zustand'

export const useTenantStore = create((set) => ({
  echo: null,
  wsStatus: 'disconnected', // disconnected | connecting | connected | error

  setEcho: (echo) => set({ echo }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
}))
