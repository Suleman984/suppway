"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Client-side cart. Persisted to localStorage so customers don't lose
 * their cart between visits. The store carries display-only data
 * (price, name, etc.); the server re-prices every cart at checkout via
 * `priceCart` to prevent tampering and pick up live discounts.
 *
 *   - `id` is the cart-line key. For DB products it's the variant UUID;
 *     for dummy/demo products it's the dummy variant id. The server
 *     looks up `id` in `product_variants` — unknown ids are surfaced
 *     as "no longer available" at checkout.
 *   - `productSlug` lets us link back to the PDP from the drawer.
 */

export interface CartItem {
  /** Cart-line key. = variant id. */
  id: string;
  productSlug: string;
  name: string;
  flavor: string;
  qty: number;
  /** Display price in PKR (whole units, not cents). Server re-prices. */
  price: number;
  accent: string;
  imageUrl?: string;
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
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
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
      clear: () => set({ items: [], open: false }),
    }),
    {
      name: "suppway-cart",
      storage: createJSONStorage(() => localStorage),
      // Don't persist UI state — only the items.
      partialize: (s) => ({ items: s.items }) as Partial<CartState>,
      // Avoid hydration mismatch warnings: skip cart restoration during SSR
      // by checking for window existence in storage getter (handled by
      // zustand/middleware automatically).
    },
  ),
);
