import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStoreContext } from "@/lib/store/context";
import type { Permission } from "@/config/permissions";

/**
 * RBAC checks for Server Components, Server Actions, and Route Handlers.
 * Single store — no tenant id needed.
 *
 *   hasPermission("orders.refund")
 *   await requirePermission("products.create")
 */

export async function hasPermission(permission: Permission): Promise<boolean> {
  const ctx = await getStoreContext();
  if (!ctx.user || !ctx.staff) return false;

  // Cheap path: in-memory check from the cached context.
  if (ctx.staff.permissions.includes(permission)) return true;

  // Fall back to the DB function (handles fresh permission grants without
  // a request boundary refresh).
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_permission", { p_permission: permission });
  return Boolean(data);
}

export class AuthorizationError extends Error {
  constructor(public permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission);
  if (!allowed) throw new AuthorizationError(permission);
}

export async function requireStaff(): Promise<{ userId: string; permissions: string[] }> {
  const ctx = await getStoreContext();
  if (!ctx.user || !ctx.staff) throw new Error("Staff access required");
  return { userId: ctx.user.id, permissions: ctx.staff.permissions };
}
