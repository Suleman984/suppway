import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Per-request auth + staff context. Pair with `getStoreSettings()` from
 * settings.ts when a page also needs branding/theme.
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
    roleId: string;
    roleKey: string;
    roleName: string;
    permissions: string[];
  } | null;
}

export const getStoreContext = cache(async (): Promise<StoreContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, staff: null };

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow
    ? {
        id: profileRow.id,
        email: profileRow.email,
        fullName: profileRow.full_name,
        avatarUrl: profileRow.avatar_url,
      }
    : null;

  // Look up staff + role + permissions in one round-trip
  const { data: staffRow } = await supabase
    .from("staff")
    .select("role_id, status, role:roles(id, key, name)")
    .eq("user_id", user.id)
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
      roleId: staffRow.role_id,
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "",
      permissions: (perms ?? []).map((p: { permission: string }) => p.permission),
    };
  }

  return { user, profile, staff };
});
