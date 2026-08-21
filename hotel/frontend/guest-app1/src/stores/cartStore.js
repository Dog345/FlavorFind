import { create } from 'zustand';

const VAT_RATE = 0.16;

function lineTotal(item) {
  return item.unitPrice * item.quantity;
}

export const useCartStore = create((set, get) => ({
  items: [], // [{ menuItem, variantId, modifierIds, quantity, notes, unitPrice }]
  note: '',

  addItem: (menuItem, variantId, modifierIds, quantity, notes, unitPrice) =>
    set((state) => ({
      items: [
        ...state.items,
        { menuItem, variantId, modifierIds, quantity, notes, unitPrice },
      ],
    })),

  removeItem: (index) =>
    set((state) => ({ items: state.items.filter((_, i) => i !== index) })),

  updateQuantity: (index, quantity) =>
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    })),

  setNote: (note) => set({ note }),

  clearCart: () => set({ items: [], note: '' }),

  get totalItems() {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
  get subtotal() {
    return get().items.reduce((sum, item) => sum + lineTotal(item), 0);
  },
  get tax() {
    return Math.round(get().subtotal * VAT_RATE);
  },
  get total() {
    return get().subtotal + get().tax;
  },
}));
