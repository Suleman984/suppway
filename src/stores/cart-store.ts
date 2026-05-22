"use client";

import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  flavor: string;
  qty: number;
  price: number;
  accent: string;
}

interface CartState {
  open: boolean;
  items: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  add: (item: CartItem) => void;
}

export const useCartStore = create<CartState>((set) => ({
  open: false,
  items: [],
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
  toggleCart: () => set((s) => ({ open: !s.open })),
  setQty: (id, qty) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, qty) } : it,
      ),
    })),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((it) => it.id !== id) })),
  add: (item) =>
    set((s) => {
      const existing = s.items.find((it) => it.id === item.id);
      if (existing) {
        return {
          items: s.items.map((it) =>
            it.id === item.id ? { ...it, qty: it.qty + item.qty } : it,
          ),
        };
      }
      return { items: [...s.items, item] };
    }),
}));
