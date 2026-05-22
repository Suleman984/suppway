"use client";

import { Plus } from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cart-store";

type QuickAddItem = Omit<CartItem, "qty"> & { qty?: number };

export function QuickAddButton({ item }: { item: QuickAddItem }) {
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <button
      type="button"
      onClick={() => {
        add({ ...item, qty: item.qty ?? 1 });
        openCart();
      }}
      className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-bold uppercase tracking-widest text-neutral-900 transition hover:bg-[#ff3b3b] hover:text-white"
    >
      <Plus className="h-4 w-4" strokeWidth={3} />
      Quick add
    </button>
  );
}
