import { create } from 'zustand';

/**
 * Holds the resolved QR session: which hotel, which table, which guest
 * session. Populated once on app load by useSession() after
 * GET /api/v1/guest/{token} succeeds.
 */
export const useSessionStore = create((set) => ({
  token: null,
  session: null, // { id, covers, guest_name, opened_at }
  table: null, // { id, label, floor }
  hotel: null, // { name, logo_url, primary_color, currency, mpesa_paybill }
  isReady: false,
  error: null, // { status, message } set on 404 / 410

  setToken: (token) => set({ token }),

  setSession: (data) => {
    set({
      session: data.session,
      table: data.table,
      hotel: data.hotel,
      isReady: true,
      error: null,
    });

    // Apply the hotel's brand color as a CSS variable so every accent
    // (buttons, active tab, tracker steps) follows their identity.
    if (data.hotel?.primary_color) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', data.hotel.primary_color);
      root.style.setProperty('--color-primary-dark', shade(data.hotel.primary_color, -18));
      root.style.setProperty('--color-primary-light', shade(data.hotel.primary_color, 70));
    }
  },

  setError: (error) => set({ error, isReady: false }),

  reset: () => set({ session: null, table: null, hotel: null, isReady: false, error: null }),
}));

/** Lighten (positive) or darken (negative) a hex color by a percentage. Used to derive
 * hover/active shades from the hotel's single brand color without extra API fields. */
function shade(hex, percent) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  let r = (num >> 16) + Math.round((percent / 100) * 255);
  let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
  let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
