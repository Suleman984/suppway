import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

export interface AdminFunnelRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  stepsCount: number;
  sessionsCount: number;
  convertedCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export async function listAdminFunnels(): Promise<AdminFunnelRow[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  const [funnelsRes, stepsRes, sessionsRes] = await Promise.all([
    supabase
      .from("funnels")
      .select("id, slug, name, description, status, created_at, updated_at")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("funnel_steps")
      .select("funnel_id")
      .eq("store_id", storeId),
    supabase
      .from("funnel_sessions")
      .select("funnel_id, status")
      .eq("store_id", storeId),
  ]);

  const stepCounts = new Map<string, number>();
  for (const row of ((stepsRes.data as Array<{ funnel_id: string }> | null) ??
    [])) {
    stepCounts.set(row.funnel_id, (stepCounts.get(row.funnel_id) ?? 0) + 1);
  }

  const sessionCounts = new Map<string, number>();
  const convertedCounts = new Map<string, number>();
  for (const row of ((sessionsRes.data as Array<{
    funnel_id: string;
    status: string;
  }> | null) ?? [])) {
    sessionCounts.set(
      row.funnel_id,
      (sessionCounts.get(row.funnel_id) ?? 0) + 1,
    );
    if (row.status === "converted") {
      convertedCounts.set(
        row.funnel_id,
        (convertedCounts.get(row.funnel_id) ?? 0) + 1,
      );
    }
  }

  return ((funnelsRes.data as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }> | null) ?? []).map((f) => {
    const sessions = sessionCounts.get(f.id) ?? 0;
    const converted = convertedCounts.get(f.id) ?? 0;
    return {
      id: f.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      status: f.status as AdminFunnelRow["status"],
      stepsCount: stepCounts.get(f.id) ?? 0,
      sessionsCount: sessions,
      convertedCount: converted,
      conversionRate: sessions > 0 ? converted / sessions : 0,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    };
  });
}
