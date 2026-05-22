import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminDiscountRow {
  id: string;
  title: string;
  code: string | null;
  kind: "percent" | "fixed";
  value: number;
  scope: "product" | "category" | "order";
  productTitle: string | null;
  categoryTitle: string | null;
  usesCount: number;
  maxUses: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isLive: boolean;
}

function isLive(d: {
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}): boolean {
  if (!d.is_active) return false;
  const now = Date.now();
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return false;
  if (d.ends_at && new Date(d.ends_at).getTime() <= now) return false;
  return true;
}

export async function listAdminDiscounts(): Promise<AdminDiscountRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select(
      `id, title, code, kind, value, scope, uses_count, max_uses,
       starts_at, ends_at, is_active,
       product:products(title),
       category:categories(title)`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data as Array<Record<string, unknown>>) ?? []).map((d) => {
    const productRaw = d.product as unknown;
    const categoryRaw = d.category as unknown;
    const product = (Array.isArray(productRaw) ? productRaw[0] : productRaw) as
      | { title?: string }
      | null
      | undefined;
    const category = (Array.isArray(categoryRaw)
      ? categoryRaw[0]
      : categoryRaw) as { title?: string } | null | undefined;
    return {
      id: d.id as string,
      title: d.title as string,
      code: (d.code as string | null) ?? null,
      kind: d.kind as "percent" | "fixed",
      value: d.value as number,
      scope: d.scope as "product" | "category" | "order",
      productTitle: product?.title ?? null,
      categoryTitle: category?.title ?? null,
      usesCount: d.uses_count as number,
      maxUses: (d.max_uses as number | null) ?? null,
      startsAt: (d.starts_at as string | null) ?? null,
      endsAt: (d.ends_at as string | null) ?? null,
      isActive: d.is_active as boolean,
      isLive: isLive({
        is_active: d.is_active as boolean,
        starts_at: (d.starts_at as string | null) ?? null,
        ends_at: (d.ends_at as string | null) ?? null,
      }),
    };
  });
}

export interface AdminDiscountDetail {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  kind: "percent" | "fixed";
  value: number;
  scope: "product" | "category" | "order";
  productId: string | null;
  categoryId: string | null;
  minSubtotalCents: number | null;
  maxUses: number | null;
  usesCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export async function getAdminDiscountById(
  id: string,
): Promise<AdminDiscountDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select(
      `id, title, description, code, kind, value, scope, product_id, category_id,
       min_subtotal_cents, max_uses, uses_count, starts_at, ends_at, is_active`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    title: d.title as string,
    description: (d.description as string | null) ?? null,
    code: (d.code as string | null) ?? null,
    kind: d.kind as "percent" | "fixed",
    value: d.value as number,
    scope: d.scope as "product" | "category" | "order",
    productId: (d.product_id as string | null) ?? null,
    categoryId: (d.category_id as string | null) ?? null,
    minSubtotalCents: (d.min_subtotal_cents as number | null) ?? null,
    maxUses: (d.max_uses as number | null) ?? null,
    usesCount: d.uses_count as number,
    startsAt: (d.starts_at as string | null) ?? null,
    endsAt: (d.ends_at as string | null) ?? null,
    isActive: d.is_active as boolean,
  };
}

export interface ProductOption {
  id: string;
  title: string;
}

export async function listProductOptions(): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .order("title", { ascending: true })
    .limit(500);
  if (error) throw error;
  return ((data as Array<Record<string, unknown>>) ?? []).map((p) => ({
    id: p.id as string,
    title: p.title as string,
  }));
}
