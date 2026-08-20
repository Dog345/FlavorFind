import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  // Main selected dish (the hero plate)
  hero: null,

  // Add-ons: { [item.id]: { item, qty } }
  addons: {},

  // Placed orders
  orders: [],

  setHero: (item) => set({ hero: item }),

  addAddon: (item) => {
    const addons = { ...get().addons };
    if (addons[item.id]) {
      addons[item.id] = { item, qty: addons[item.id].qty + 1 };
    } else {
      addons[item.id] = { item, qty: 1 };
    }
    set({ addons });
  },

  removeAddon: (itemId) => {
    const addons = { ...get().addons };
    if (addons[itemId]?.qty > 1) {
      addons[itemId] = { ...addons[itemId], qty: addons[itemId].qty - 1 };
    } else {
      delete addons[itemId];
    }
    set({ addons });
  },

  clearAddon: (itemId) => {
    const addons = { ...get().addons };
    delete addons[itemId];
    set({ addons });
  },

  clearAll: () => set({ hero: null, addons: {} }),

  addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),

  // Build the order payload for the API
  buildPayload: () => {
    const { hero, addons } = get();
    const items = [];
    if (hero) items.push({ menu_item_id: hero.id, quantity: 1 });
    Object.values(addons).forEach(({ item, qty }) => {
      items.push({ menu_item_id: item.id, quantity: qty });
    });
    return { items };
  },

  // Total price
  total: () => {
    const { hero, addons } = get();
    let t = hero ? Number(hero.base_price) : 0;
    Object.values(addons).forEach(({ item, qty }) => {
      t += Number(item.base_price) * qty;
    });
    return t;
  },

  // Count of items in cart
  count: () => {
    const { hero, addons } = get();
    let c = hero ? 1 : 0;
    Object.values(addons).forEach(({ qty }) => { c += qty; });
    return c;
  },
}));
