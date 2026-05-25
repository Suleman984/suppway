import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

/**
 * Admin-side read services. Public catalog reads (storefront) go through
 * separate functions in this file with a smaller projection.
 *
 * Every query runs with the staff user's auth cookies, so RLS gates writes
 * automatically — these functions just hide non-published rows already
 * permitted to staff by the policies in 0003_catalog.sql.
 */

export interface AdminProductRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  kind: string;
  brand: string | null;
  tags: string[];
  updatedAt: string;
  /** First media url; used as table thumbnail. */
  thumbUrl: string | null;
  /** Cheapest variant price in cents — used for the price column. */
  minPriceCents: number | null;
  currency: string | null;
  variantCount: number;
}

export interface ListAdminProductsParams {
  q?: string;
  status?: "draft" | "published" | "archived";
  kind?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAdminProductsResult {
  rows: AdminProductRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listAdminProducts(
  params: ListAdminProductsParams = {},
): Promise<ListAdminProductsResult> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      `id, slug, title, status, kind, brand, tags, updated_at,
       product_variants(id, price_cents, currency, position),
       product_media(url, position)`,
      { count: "exact" },
    )
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status) query = query.eq("status", params.status);
  if (params.kind) query = query.eq("kind", params.kind);
  if (params.q && params.q.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`title.ilike.${term},slug.ilike.${term},brand.ilike.${term}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows: AdminProductRow[] = (data ?? []).map((p: Record<string, unknown>) => {
    const variants = (p.product_variants as Array<{
      id: string;
      price_cents: number;
      currency: string;
      position: number;
    }>) ?? [];
    const media = (p.product_media as Array<{ url: string; position: number }>) ?? [];
    const sortedMedia = [...media].sort((a, b) => a.position - b.position);
    const cheapest = variants.reduce<typeof variants[number] | null>(
      (acc, v) => (acc == null || v.price_cents < acc.price_cents ? v : acc),
      null,
    );
    return {
      id: p.id as string,
      slug: p.slug as string,
      title: p.title as string,
      status: p.status as AdminProductRow["status"],
      kind: p.kind as string,
      brand: (p.brand as string | null) ?? null,
      tags: ((p.tags as string[] | null) ?? []),
      updatedAt: p.updated_at as string,
      thumbUrl: sortedMedia[0]?.url ?? null,
      minPriceCents: cheapest?.price_cents ?? null,
      currency: cheapest?.currency ?? null,
      variantCount: variants.length,
    };
  });

  return { rows, total: count ?? 0, page, pageSize };
}

export interface AdminProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  status: "draft" | "published" | "archived";
  brand: string | null;
  tags: string[];
  attributes: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  variants: Array<{
    id: string;
    sku: string | null;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    priceCents: number;
    compareAtCents: number | null;
    currency: string;
    weightGrams: number | null;
    requiresShipping: boolean;
    taxable: boolean;
    inventoryQty: number;
    inventoryPolicy: "deny" | "continue";
    position: number;
  }>;
  media: Array<{ id: string; url: string; alt: string | null; position: number }>;
}

export async function getAdminProductById(
  id: string,
): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, title, description, kind, status, brand, tags, attributes,
       seo_title, seo_description, published_at,
       product_variants(id, sku, title, option1, option2, option3,
                        price_cents, compare_at_cents, currency, weight_grams,
                        requires_shipping, taxable, inventory_qty,
                        inventory_policy, position),
       product_media(id, url, alt, position)`,
    )
    .eq("store_id", storeId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const p = data as Record<string, unknown>;
  const variants = ((p.product_variants as Array<Record<string, unknown>>) ?? []).map((v) => ({
    id: v.id as string,
    sku: (v.sku as string | null) ?? null,
    title: v.title as string,
    option1: (v.option1 as string | null) ?? null,
    option2: (v.option2 as string | null) ?? null,
    option3: (v.option3 as string | null) ?? null,
    priceCents: v.price_cents as number,
    compareAtCents: (v.compare_at_cents as number | null) ?? null,
    currency: v.currency as string,
    weightGrams: (v.weight_grams as number | null) ?? null,
    requiresShipping: v.requires_shipping as boolean,
    taxable: v.taxable as boolean,
    inventoryQty: v.inventory_qty as number,
    inventoryPolicy: v.inventory_policy as "deny" | "continue",
    position: v.position as number,
  }));
  variants.sort((a, b) => a.position - b.position);

  const media = ((p.product_media as Array<Record<string, unknown>>) ?? []).map((m) => ({
    id: m.id as string,
    url: m.url as string,
    alt: (m.alt as string | null) ?? null,
    position: m.position as number,
  }));
  media.sort((a, b) => a.position - b.position);

  return {
    id: p.id as string,
    slug: p.slug as string,
    title: p.title as string,
    description: (p.description as string | null) ?? null,
    kind: p.kind as string,
    status: p.status as AdminProductDetail["status"],
    brand: (p.brand as string | null) ?? null,
    tags: ((p.tags as string[] | null) ?? []),
    attributes: ((p.attributes as Record<string, unknown> | null) ?? {}),
    seoTitle: (p.seo_title as string | null) ?? null,
    seoDescription: (p.seo_description as string | null) ?? null,
    publishedAt: (p.published_at as string | null) ?? null,
    variants,
    media,
  };
}

export function formatCents(cents: number | null, currency = "PKR") {
  if (cents == null) return "—";
  return `${currency} ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
