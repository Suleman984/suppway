import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminCategoryRow {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  sortOrder: number;
  imageUrl: string | null;
  parentTitle: string | null;
  productCount: number;
  updatedAt: string;
}

export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(
      `id, slug, title, is_published, sort_order, image_url, updated_at,
       parent:categories!parent_id(title),
       product_categories(product_id)`,
    )
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;

  return ((data as Array<Record<string, unknown>>) ?? []).map((c) => {
    const parentRaw = c.parent as unknown;
    const parent = (Array.isArray(parentRaw) ? parentRaw[0] : parentRaw) as
      | { title?: string }
      | null
      | undefined;
    const productLinks =
      (c.product_categories as Array<{ product_id: string }> | null) ?? [];
    return {
      id: c.id as string,
      slug: c.slug as string,
      title: c.title as string,
      isPublished: c.is_published as boolean,
      sortOrder: c.sort_order as number,
      imageUrl: (c.image_url as string | null) ?? null,
      parentTitle: parent?.title ?? null,
      productCount: productLinks.length,
      updatedAt: c.updated_at as string,
    };
  });
}

export interface AdminCategoryDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getAdminCategoryById(
  id: string,
): Promise<AdminCategoryDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(
      `id, slug, title, description, image_url, parent_id, sort_order,
       is_published, seo_title, seo_description`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const c = data as Record<string, unknown>;
  return {
    id: c.id as string,
    slug: c.slug as string,
    title: c.title as string,
    description: (c.description as string | null) ?? null,
    imageUrl: (c.image_url as string | null) ?? null,
    parentId: (c.parent_id as string | null) ?? null,
    sortOrder: c.sort_order as number,
    isPublished: c.is_published as boolean,
    seoTitle: (c.seo_title as string | null) ?? null,
    seoDescription: (c.seo_description as string | null) ?? null,
  };
}

export interface CategoryOption {
  id: string;
  title: string;
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, title")
    .order("title", { ascending: true });
  if (error) throw error;
  return ((data as Array<Record<string, unknown>>) ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string,
  }));
}
