"use server";

import { z } from "zod";
import { priceCart, type PricedCart } from "@/server/services/pricing";

const inputSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .max(50),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

export type CartPricingResult =
  | { ok: true; cart: PricedCart }
  | { ok: false; error: string };

/**
 * Server price-check for a client-side cart. Called by the cart page and
 * checkout every time the cart, qty, or coupon changes. Returns the
 * authoritative pricing so the client never displays totals the server
 * disagrees with.
 */
export async function recalculateCart(input: unknown): Promise<CartPricingResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid cart payload" };
  }
  try {
    const cart = await priceCart(parsed.data.items, {
      couponCode: parsed.data.couponCode ?? null,
    });
    return { ok: true, cart };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to price cart",
    };
  }
}
