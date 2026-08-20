import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  token:   null,
  session: null,
  table:   null,
  hotel:   null,
  error:   null,

  setToken:   (token)   => set({ token }),
  setSession: (data)    => set({ session: data.session, table: data.table, hotel: data.hotel, error: null }),
  setError:   (error)   => set({ error }),
}));
