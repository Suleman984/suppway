import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

/**
 * Server-side cart pricing engine. The client cart only stores variant
 * ids + quantities (and an accent for the drawer UI). The server is the
 * source of truth for prices, stock, and discounts so customers can't
 * tamper with totals via the cart store.
 *
 * Discount rules (greedy, single-pass for now):
 *   - Auto-applied (no code) discounts that match the cart are layered on
 *     in priority order: product > category > order. The largest single
 *     monetary saving per scope is used.
 *   - At most one coupon code is honoured at checkout.
 *   - Percent discounts cap at 100%. Fixed discounts cap at the line/cart
 *     subtotal they apply to.
 *
 * Returns an immutable, fully-priced cart ready to render OR to persist
 * as an order (createOrder reuses this).
 */

export interface CartInputLine {
  variantId: string;
  qty: number;
}

export interface PricedLine {
  variantId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string | null;
  unitPriceCents: number;
  qty: number;
  /** Per-line discount applied (positive number, in cents). */
  lineDiscountCents: number;
  /** unitPriceCents * qty - lineDiscountCents */
  lineTotalCents: number;
  /** Categories this product is in (for category-discount matching). */
  categoryIds: string[];
}

export interface AppliedDiscount {
  id: string;
  title: string;
  code: string | null;
  kind: "percent" | "fixed";
  value: number;
  scope: "product" | "category" | "order";
  amountCents: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  itemCount: number;
  appliedDiscounts: AppliedDiscount[];
  /** When a coupon is supplied but invalid, surface why. */
  couponError: string | null;
  /** Unknown / dropped lines (variant deleted, out of stock with deny policy). */
  invalidLines: { variantId: string; reason: string }[];
}

const FREE_SHIPPING_THRESHOLD_CENTS = 500_000; // PKR 5,000
const FLAT_SHIPPING_CENTS = 35_000; // PKR 350

export async function priceCart(
  input: CartInputLine[],
  options: { couponCode?: string | null } = {},
): Promise<PricedCart> {
  const couponCode = options.couponCode?.trim().toUpperCase() || null;
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  if (input.length === 0) {
    return emptyCart(couponCode ? "Add items to your cart first" : null);
  }

  // Split inputs: only well-formed UUIDs can be looked up in the DB.
  // Anything else (e.g. demo/dummy slugs added via Quick-Add) is reported
  // as invalid up front rather than blowing up the whole .in() query with
  // a Postgres uuid-syntax error.
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalidLines: PricedCart["invalidLines"] = [];
  const validIds: string[] = [];
  for (const it of input) {
    if (UUID_RE.test(it.variantId)) validIds.push(it.variantId);
    else
      invalidLines.push({
        variantId: it.variantId,
        reason: "Item is no longer available (demo product)",
      });
  }
  const variantIds = Array.from(new Set(validIds));

  let variantRows: Array<Record<string, unknown>> | null = null;
  if (variantIds.length > 0) {
    const { data, error: variantErr } = await supabase
      .from("product_variants")
      .select(
        `id, title, price_cents, currency, inventory_qty, inventory_policy,
         product:products(id, slug, title, status,
           product_media(url, position),
           product_categories(category_id))`,
      )
      .eq("store_id", storeId)
      .in("id", variantIds);
    if (variantErr) {
      throw new Error(`Failed to price cart: ${variantErr.message}`);
    }
    variantRows = (data as Array<Record<string, unknown>>) ?? [];
  }

  const lines: PricedLine[] = [];

  for (const item of input) {
    if (!UUID_RE.test(item.variantId)) continue; // already in invalidLines
    const v = variantRows?.find((r) => r.id === item.variantId);
    if (!v) {
      invalidLines.push({ variantId: item.variantId, reason: "Variant not found" });
      continue;
    }
    const productRaw = v.product as unknown;
    const product = (Array.isArray(productRaw) ? productRaw[0] : productRaw) as
      | Record<string, unknown>
      | null;
    if (!product || product.status !== "published") {
      invalidLines.push({
        variantId: item.variantId,
        reason: "Product is no longer available",
      });
      continue;
    }
    const inventoryQty = (v.inventory_qty as number) ?? 0;
    const inventoryPolicy = (v.inventory_policy as string) ?? "deny";
    if (inventoryPolicy === "deny" && inventoryQty < item.qty) {
      invalidLines.push({
        variantId: item.variantId,
        reason:
          inventoryQty === 0
            ? "Out of stock"
            : `Only ${inventoryQty} left in stock`,
      });
      continue;
    }

    const media = ((product.product_media as Array<Record<string, unknown>>) ?? [])
      .sort((a, b) => (a.position as number) - (b.position as number));
    const categoryIds = (
      (product.product_categories as Array<{ category_id: string }>) ?? []
    ).map((pc) => pc.category_id);

    const unit = v.price_cents as number;
    lines.push({
      variantId: v.id as string,
      productId: product.id as string,
      productSlug: product.slug as string,
      productTitle: product.title as string,
      variantTitle: v.title as string,
      imageUrl: (media[0]?.url as string) ?? null,
      unitPriceCents: unit,
      qty: item.qty,
      lineDiscountCents: 0,
      lineTotalCents: unit * item.qty,
      categoryIds,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.qty, 0);

  // Pull every potentially-applicable discount in one query.
  const productIds = Array.from(new Set(lines.map((l) => l.productId)));
  const categoryIds = Array.from(
    new Set(lines.flatMap((l) => l.categoryIds)),
  );

  // Build the OR clause carefully — empty arrays produce malformed filters.
  const orParts: string[] = ["scope.eq.order"];
  if (productIds.length > 0) orParts.push(`product_id.in.(${productIds.join(",")})`);
  if (categoryIds.length > 0) orParts.push(`category_id.in.(${categoryIds.join(",")})`);
  if (couponCode) orParts.push(`code.eq.${couponCode}`);

  const { data: candidateRows } = await supabase
    .from("discounts")
    .select(
      "id, title, code, kind, value, scope, product_id, category_id, min_subtotal_cents, max_uses, uses_count, starts_at, ends_at, is_active",
    )
    .eq("store_id", storeId)
    .or(orParts.join(","));
  const now = Date.now();

  type DiscountRow = {
    id: string;
    title: string;
    code: string | null;
    kind: "percent" | "fixed";
    value: number;
    scope: "product" | "category" | "order";
    product_id: string | null;
    category_id: string | null;
    min_subtotal_cents: number | null;
    max_uses: number | null;
    uses_count: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
  };

  const candidates: DiscountRow[] = (
    (candidateRows as DiscountRow[] | null) ?? []
  ).filter((d) => {
    if (!d.is_active) return false;
    if (d.starts_at && new Date(d.starts_at).getTime() > now) return false;
    if (d.ends_at && new Date(d.ends_at).getTime() <= now) return false;
    if (d.max_uses != null && d.uses_count >= d.max_uses) return false;
    if (d.min_subtotal_cents != null && subtotalCents < d.min_subtotal_cents)
      return false;
    return true;
  });

  // Validate coupon up front so we can return a meaningful error.
  let couponError: string | null = null;
  if (couponCode) {
    const coupon = candidates.find((d) => d.code === couponCode);
    if (!coupon) {
      couponError = "Coupon code is invalid or expired.";
    }
  }

  // ----- Apply per-product discounts (auto OR matching coupon) -----
  for (const line of lines) {
    const productDiscounts = candidates.filter(
      (d) =>
        d.scope === "product" &&
        d.product_id === line.productId &&
        (d.code == null || d.code === couponCode),
    );
    const best = bestForLineSubtotal(productDiscounts, line.unitPriceCents * line.qty);
    if (best) {
      line.lineDiscountCents += best.amountCents;
    }
  }

  // ----- Apply per-category discounts -----
  for (const line of lines) {
    const matching = candidates.filter(
      (d) =>
        d.scope === "category" &&
        d.category_id != null &&
        line.categoryIds.includes(d.category_id) &&
        (d.code == null || d.code === couponCode),
    );
    const remaining = line.unitPriceCents * line.qty - line.lineDiscountCents;
    if (remaining <= 0) continue;
    const best = bestForLineSubtotal(matching, remaining);
    if (best) {
      line.lineDiscountCents += best.amountCents;
    }
  }

  // Recompute line totals
  for (const line of lines) {
    line.lineTotalCents = Math.max(
      0,
      line.unitPriceCents * line.qty - line.lineDiscountCents,
    );
  }

  const afterLines = lines.reduce((s, l) => s + l.lineTotalCents, 0);

  // ----- Apply at most one order-wide discount -----
  const orderDiscounts = candidates.filter(
    (d) =>
      d.scope === "order" && (d.code == null || d.code === couponCode),
  );
  const orderBest = bestForLineSubtotal(orderDiscounts, afterLines);
  let orderDiscountCents = 0;
  if (orderBest) orderDiscountCents = orderBest.amountCents;

  // Aggregate the applied discounts for display.
  const applied: AppliedDiscount[] = [];
  for (const line of lines) {
    if (line.lineDiscountCents > 0) {
      // We don't know which exact discount won unless we recompute — keep
      // the picture simple in this iteration and emit a synthetic entry
      // per line.
      // (Order-level entry is added below.)
    }
  }
  if (orderBest) {
    applied.push({
      id: orderBest.id,
      title: orderBest.title,
      code: orderBest.code,
      kind: orderBest.kind,
      value: orderBest.value,
      scope: orderBest.scope,
      amountCents: orderDiscountCents,
    });
  }

  const totalLineDiscount = lines.reduce(
    (s, l) => s + l.lineDiscountCents,
    0,
  );
  const discountCents = totalLineDiscount + orderDiscountCents;

  const shippingCents =
    afterLines - orderDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS ||
    lines.length === 0
      ? 0
      : FLAT_SHIPPING_CENTS;

  const totalCents = Math.max(0, afterLines - orderDiscountCents) + shippingCents;
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  return {
    lines,
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents: 0,
    totalCents,
    currency: "PKR",
    itemCount,
    appliedDiscounts: applied,
    couponError,
    invalidLines,
  };
}

function emptyCart(couponError: string | null): PricedCart {
  return {
    lines: [],
    subtotalCents: 0,
    discountCents: 0,
    shippingCents: 0,
    taxCents: 0,
    totalCents: 0,
    currency: "PKR",
    itemCount: 0,
    appliedDiscounts: [],
    couponError,
    invalidLines: [],
  };
}

function bestForLineSubtotal<
  T extends { kind: "percent" | "fixed"; value: number; id: string; title: string; code: string | null; scope: "product" | "category" | "order" },
>(
  discounts: T[],
  applicableSubtotal: number,
): (T & { amountCents: number }) | null {
  let winner: (T & { amountCents: number }) | null = null;
  for (const d of discounts) {
    let amount =
      d.kind === "percent"
        ? Math.floor((applicableSubtotal * d.value) / 100)
        : Math.min(d.value, applicableSubtotal);
    if (amount <= 0) continue;
    amount = Math.min(amount, applicableSubtotal);
    if (winner == null || amount > winner.amountCents) {
      winner = Object.assign({}, d, { amountCents: amount });
    }
  }
  return winner;
}
