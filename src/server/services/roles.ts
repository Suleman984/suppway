import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

export interface AdminRoleRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionCount: number;
  memberCount: number;
}

export interface PermissionInfo {
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface AdminRoleDetail {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export async function listAdminRoles(): Promise<AdminRoleRow[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  const [rolesRes, permCountRes, staffCountRes] = await Promise.all([
    supabase
      .from("roles")
      .select("id, key, name, description, is_system")
      .order("is_system", { ascending: false })
      .order("name"),
    supabase
      .from("role_permissions")
      .select("role_id, permission"),
    supabase
      .from("staff")
      .select("role_id")
      .eq("store_id", storeId),
  ]);

  const permCounts = new Map<string, number>();
  for (const row of ((permCountRes.data as Array<{ role_id: string }> | null) ??
    [])) {
    permCounts.set(row.role_id, (permCounts.get(row.role_id) ?? 0) + 1);
  }

  const memberCounts = new Map<string, number>();
  for (const row of ((staffCountRes.data as Array<{ role_id: string }> | null) ??
    [])) {
    memberCounts.set(row.role_id, (memberCounts.get(row.role_id) ?? 0) + 1);
  }

  return ((rolesRes.data as Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    is_system: boolean;
  }> | null) ?? []).map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.is_system,
    permissionCount: permCounts.get(r.id) ?? 0,
    memberCount: memberCounts.get(r.id) ?? 0,
  }));
}

export async function listAllPermissions(): Promise<PermissionInfo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("permissions")
    .select("key, resource, action, description")
    .order("resource")
    .order("action");
  return (data as PermissionInfo[] | null) ?? [];
}

export async function getRoleDetail(
  roleId: string,
): Promise<AdminRoleDetail | null> {
  const supabase = await createClient();
  const [roleRes, permsRes] = await Promise.all([
    supabase
      .from("roles")
      .select("id, key, name, description, is_system")
      .eq("id", roleId)
      .maybeSingle(),
    supabase
      .from("role_permissions")
      .select("permission")
      .eq("role_id", roleId),
  ]);
  if (!roleRes.data) return null;
  const role = roleRes.data as {
    id: string;
    key: string;
    name: string;
    description: string | null;
    is_system: boolean;
  };
  const permissions = (
    (permsRes.data as Array<{ permission: string }> | null) ?? []
  ).map((p) => p.permission);
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.is_system,
    permissions,
  };
}
