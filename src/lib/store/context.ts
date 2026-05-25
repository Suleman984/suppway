import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/active";

/**
 * Per-request auth + staff context, now scoped to the active store.
 *
 * `staff` is non-null only if the signed-in user has an active staff row
 * **in the active store**. Users who are admin of one store and customers
 * of another will see `staff: null` on the second store's URLs — which is
 * exactly what we want for tenant isolation.
 */

export interface StoreContext {
  user: { id: string; email?: string } | null;
  profile: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  staff: {
    storeId: string;
    roleId: string;
    roleKey: string;
    roleName: string;
    permissions: string[];
  } | null;
  activeStore: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
}

export const getStoreContext = cache(async (): Promise<StoreContext> => {
  const supabase = await createClient();
  const activeStore = await getActiveStore();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = {
    user: null,
    profile: null,
    staff: null,
    activeStore,
  } as StoreContext;

  if (!user) return base;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow
    ? {
        id: profileRow.id as string,
        email: profileRow.email as string,
        fullName: (profileRow.full_name as string | null) ?? null,
        avatarUrl: (profileRow.avatar_url as string | null) ?? null,
      }
    : null;

  // Staff row scoped to the active store only.
  const { data: staffRow } = await supabase
    .from("staff")
    .select("role_id, status, role:roles(id, key, name)")
    .eq("user_id", user.id)
    .eq("store_id", activeStore.id)
    .eq("status", "active")
    .maybeSingle();

  let staff: StoreContext["staff"] = null;
  if (staffRow?.role_id) {
    const { data: perms } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role_id", staffRow.role_id);
    const roleRaw = staffRow.role as unknown;
    const role = (Array.isArray(roleRaw) ? roleRaw[0] : roleRaw) as
      | { id: string; key: string; name: string }
      | null
      | undefined;
    staff = {
      storeId: activeStore.id,
      roleId: staffRow.role_id as string,
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "",
      permissions: (perms ?? []).map(
        (p: { permission: string }) => p.permission,
      ),
    };
  }

  return { user, profile, staff, activeStore };
});
