"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/cart-store";

type QuickAddItem = Omit<CartItem, "qty" | "id"> & {
  /** Real product_variants.id (UUID). Null = no single default variant. */
  variantId: string | null;
  /** PDP slug — used as the fallback link when variantId is null. */
  productSlug: string;
  qty?: number;
};

/**
 * Adds an item to the cart when the product has exactly one variant.
 * Otherwise renders a "Pick variant" link to the PDP so the customer
 * can choose, instead of silently adding a placeholder line the
 * pricing engine can't resolve.
 */
export function QuickAddButton({ item }: { item: QuickAddItem }) {
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.openCart);

  if (!item.variantId) {
    return (
      <Link
        href={`/product/${item.productSlug}`}
        prefetch
        className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-bold uppercase tracking-widest text-neutral-900 transition hover:bg-[#ff3b3b] hover:text-white"
      >
        Pick options
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add({
          id: item.variantId!,
          productSlug: item.productSlug,
          name: item.name,
          flavor: item.flavor,
          price: item.price,
          accent: item.accent,
          imageUrl: item.imageUrl,
          qty: item.qty ?? 1,
        });
        openCart();
      }}
      className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-xs font-bold uppercase tracking-widest text-neutral-900 transition hover:bg-[#ff3b3b] hover:text-white"
    >
      <Plus className="h-4 w-4" strokeWidth={3} />
      Quick add
    </button>
  );
}
