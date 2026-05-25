import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";
import {
  DUMMY_PRODUCTS,
  getDummyProductBySlug,
  type DummyProduct,
} from "@/lib/catalog/products";

/**
 * Public storefront read services. Reads `status='published'` rows via the
 * anonymous RLS path so they work for unauthenticated browsers.
 *
 * If the `products` table is empty (fresh install, no DB seed yet), every
 * function transparently falls back to the bundled DUMMY_PRODUCTS so the
 * site never renders an empty shell. Owners see real data the moment they
 * publish their first product.
 */

export type StorefrontKind =
  | "supplement"
  | "apparel"
  | "equipment"
  | "accessory"
  | "program"
  | "membership";

export interface StorefrontProductCard {
  slug: string;
  name: string;
  kind: string;
  categoryLabel: string;
  flavor: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  accent: string;
  short: string;
  imageUrl: string;
  /** Stable accent in hex (driven by category/kind). Used for hover gradients. */
  fallback: string;
  /**
   * The variant a Quick-Add button should add to the cart. `null` when the
   * product has 0 variants (don't render Quick-Add) or 2+ variants
   * (require a trip to the PDP so the customer picks one).
   */
  quickAddVariantId: string | null;
}

export interface ListStorefrontProductsParams {
  kind?: string;
  cat?: string;
  sort?: "popular" | "rating" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
}

export interface ListStorefrontProductsResult {
  items: StorefrontProductCard[];
  total: number;
  page: number;
  pageSize: number;
  /** True when the result is served from the bundled dummy catalog. */
  fallback: boolean;
}

const ACCENT_BY_KIND: Record<string, string> = {
  supplement: "#ff3b3b",
  apparel: "#a855f7",
  equipment: "#22c55e",
  accessory: "#ffae00",
  program: "#00d4ff",
  membership: "#ff6b35",
};

function dummyAsCard(p: DummyProduct): StorefrontProductCard {
  return {
    slug: p.slug,
    name: p.name,
    kind: p.kind,
    categoryLabel: p.categoryLabel,
    flavor: p.flavor,
    price: p.price,
    oldPrice: p.oldPrice,
    rating: p.rating,
    reviews: p.reviews,
    badge: p.badge,
    accent: p.accent,
    short: p.short,
    imageUrl: p.images[0],
    fallback: p.accent,
    // Dummies don't have real DB variants — Quick-Add isn't valid here.
    quickAddVariantId: null,
  };
}

export async function listStorefrontProducts(
  params: ListStorefrontProductsParams = {},
): Promise<ListStorefrontProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(60, Math.max(8, params.pageSize ?? 24));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  let query = supabase
    .from("products")
    .select(
      `id, slug, title, kind, brand, attributes, rating_avg, rating_count,
       product_variants(id, title, price_cents, compare_at_cents, currency, position),
       product_media(url, position)`,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .eq("status", "published")
    .range(from, to);

  if (params.kind) query = query.eq("kind", params.kind);

  switch (params.sort) {
    case "price-asc":
    case "price-desc":
    case "rating":
      // server-side sorts that need joins are best handled in-memory below
      query = query.order("updated_at", { ascending: false });
      break;
    default:
      query = query.order("rating_count", { ascending: false, nullsFirst: false });
  }

  const { data, count } = await query;

  let rows: StorefrontProductCard[] = (
    (data as Array<Record<string, unknown>>) ?? []
  ).map((p) => productRowToCard(p));

  // Optional category sub-filter (lives in attributes.category for supplements)
  if (params.cat) {
    rows = rows.filter(
      (r) =>
        r.kind === params.kind &&
        (r as unknown as { categoryLabelKey?: string }).categoryLabelKey ===
          params.cat,
    );
  }

  if (params.sort === "price-asc") rows.sort((a, b) => a.price - b.price);
  else if (params.sort === "price-desc") rows.sort((a, b) => b.price - a.price);
  else if (params.sort === "rating") rows.sort((a, b) => b.rating - a.rating);

  // Fallback: empty DB → bundled dummy catalog so the storefront isn't blank
  if (rows.length === 0 && (!count || count === 0)) {
    let dummies = DUMMY_PRODUCTS.map(dummyAsCard);
    if (params.kind) dummies = dummies.filter((d) => d.kind === params.kind);
    if (params.cat) {
      const dummyCatFilter = DUMMY_PRODUCTS.filter(
        (d) => d.category === params.cat,
      ).map((d) => d.slug);
      dummies = dummies.filter((d) => dummyCatFilter.includes(d.slug));
    }
    if (params.sort === "price-asc") dummies.sort((a, b) => a.price - b.price);
    else if (params.sort === "price-desc")
      dummies.sort((a, b) => b.price - a.price);
    else if (params.sort === "rating")
      dummies.sort((a, b) => b.rating - a.rating);
    else dummies.sort((a, b) => b.reviews - a.reviews);

    return {
      items: dummies.slice(from, to + 1),
      total: dummies.length,
      page,
      pageSize,
      fallback: true,
    };
  }

  return {
    items: rows,
    total: count ?? rows.length,
    page,
    pageSize,
    fallback: false,
  };
}

function productRowToCard(p: Record<string, unknown>): StorefrontProductCard {
  const variants = (p.product_variants as Array<Record<string, unknown>>) ?? [];
  const media = (p.product_media as Array<Record<string, unknown>>) ?? [];
  const sortedMedia = [...media].sort(
    (a, b) => (a.position as number) - (b.position as number),
  );
  const cheapestVariant = variants.reduce<Record<string, unknown> | null>(
    (acc, v) => {
      const price = v.price_cents as number;
      if (acc == null || price < (acc.price_cents as number)) return v;
      return acc;
    },
    null,
  );
  const cents = (cheapestVariant?.price_cents as number) ?? 0;
  const compareAt = cheapestVariant?.compare_at_cents as number | null;
  const kind = (p.kind as string) ?? "supplement";
  const attributes = (p.attributes as Record<string, unknown>) ?? {};
  const categoryLabel =
    (attributes.category_label as string) ??
    (kind === "supplement" ? "Supplement" : kind.charAt(0).toUpperCase() + kind.slice(1));
  const flavor =
    (cheapestVariant?.title as string) ?? (attributes.flavor as string) ?? "";

  return {
    slug: p.slug as string,
    name: p.title as string,
    kind,
    categoryLabel,
    flavor,
    price: cents / 100,
    oldPrice: compareAt ? compareAt / 100 : undefined,
    rating: (p.rating_avg as number | null) ?? 0,
    reviews: (p.rating_count as number | null) ?? 0,
    accent: ACCENT_BY_KIND[kind] ?? "#ff3b3b",
    short:
      (attributes.short as string) ??
      ((p.title as string) ?? ""),
    imageUrl:
      (sortedMedia[0]?.url as string) ??
      "https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=800",
    fallback: ACCENT_BY_KIND[kind] ?? "#ff3b3b",
    // Quick-add only when there's exactly one variant. With 2+ we want
    // the customer to pick on the PDP; with 0 we can't add anything.
    quickAddVariantId:
      variants.length === 1 ? ((variants[0]?.id as string) ?? null) : null,
  };
}

export interface StorefrontVariant {
  id: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  inStock: boolean;
}

export interface StorefrontProductDetail {
  id: string;
  slug: string;
  name: string;
  kind: string;
  categoryLabel: string;
  description: string;
  short: string;
  highlights: string[];
  ingredients?: string[];
  macros?: {
    servings: number;
    servingSize: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
  };
  badge?: string;
  rating: number;
  reviews: number;
  accent: string;
  price: number;
  oldPrice?: number;
  variants: StorefrontVariant[];
  images: string[];
  fallback: boolean;
}

export async function getStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { data } = await supabase
    .from("products")
    .select(
      `id, slug, title, description, kind, brand, attributes, rating_avg, rating_count,
       product_variants(id, title, price_cents, compare_at_cents, currency, inventory_qty,
                        inventory_policy, position),
       product_media(url, position)`,
    )
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (data) return productRowToDetail(data as Record<string, unknown>);

  // Fallback to dummy
  const dummy = getDummyProductBySlug(slug);
  if (!dummy) return null;
  return {
    id: dummy.slug,
    slug: dummy.slug,
    name: dummy.name,
    kind: dummy.kind,
    categoryLabel: dummy.categoryLabel,
    description: dummy.description,
    short: dummy.short,
    highlights: dummy.highlights,
    ingredients: dummy.ingredients,
    macros: dummy.macros,
    badge: dummy.badge,
    rating: dummy.rating,
    reviews: dummy.reviews,
    accent: dummy.accent,
    price: dummy.price,
    oldPrice: dummy.oldPrice,
    variants: dummy.variants.map((v) => ({
      id: v.id,
      title: v.label,
      priceCents: v.price * 100,
      compareAtCents: null,
      currency: "PKR",
      inStock: v.inStock,
    })),
    images: dummy.images,
    fallback: true,
  };
}

function productRowToDetail(p: Record<string, unknown>): StorefrontProductDetail {
  const variants = ((p.product_variants as Array<Record<string, unknown>>) ?? [])
    .map((v) => ({
      id: v.id as string,
      title: v.title as string,
      priceCents: v.price_cents as number,
      compareAtCents: (v.compare_at_cents as number | null) ?? null,
      currency: (v.currency as string) ?? "PKR",
      inStock:
        ((v.inventory_qty as number | null) ?? 0) > 0 ||
        v.inventory_policy === "continue",
      position: (v.position as number) ?? 0,
    }))
    .sort((a, b) => a.position - b.position)
    .map(({ position: _p, ...rest }) => rest);

  const media = ((p.product_media as Array<Record<string, unknown>>) ?? [])
    .sort((a, b) => (a.position as number) - (b.position as number))
    .map((m) => m.url as string);

  const kind = (p.kind as string) ?? "supplement";
  const attributes = (p.attributes as Record<string, unknown>) ?? {};
  const cheapest = variants.reduce<typeof variants[number] | null>(
    (acc, v) => (acc == null || v.priceCents < acc.priceCents ? v : acc),
    null,
  );

  return {
    id: p.id as string,
    slug: p.slug as string,
    name: p.title as string,
    kind,
    categoryLabel:
      (attributes.category_label as string) ??
      kind.charAt(0).toUpperCase() + kind.slice(1),
    description: (p.description as string | null) ?? "",
    short: (attributes.short as string) ?? (p.title as string),
    highlights: (attributes.highlights as string[] | undefined) ?? [],
    ingredients: attributes.ingredients as string[] | undefined,
    macros: attributes.macros as StorefrontProductDetail["macros"],
    rating: (p.rating_avg as number | null) ?? 0,
    reviews: (p.rating_count as number | null) ?? 0,
    accent: ACCENT_BY_KIND[kind] ?? "#ff3b3b",
    price: (cheapest?.priceCents ?? 0) / 100,
    oldPrice: cheapest?.compareAtCents
      ? cheapest.compareAtCents / 100
      : undefined,
    variants,
    images:
      media.length > 0
        ? media
        : [
            "https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=800",
          ],
    fallback: false,
  };
}

export async function getStorefrontBestsellers(
  limit = 4,
): Promise<StorefrontProductCard[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { data } = await supabase
    .from("products")
    .select(
      `id, slug, title, kind, attributes, rating_avg, rating_count,
       product_variants(price_cents, compare_at_cents, currency),
       product_media(url, position)`,
    )
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("rating_count", { ascending: false, nullsFirst: false })
    .limit(limit);

  const rows = ((data as Array<Record<string, unknown>>) ?? []).map(
    productRowToCard,
  );
  if (rows.length > 0) return rows;
  return DUMMY_PRODUCTS.slice(0, limit).map(dummyAsCard);
}

export function formatPKR(value: number) {
  return `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
