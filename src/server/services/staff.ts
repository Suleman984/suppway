import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveStoreId } from "@/lib/store/active";

export interface AdminStaffRow {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: "active" | "invited" | "suspended";
  invitedAt: string | null;
  joinedAt: string | null;
}

export async function listAdminStaff(): Promise<AdminStaffRow[]> {
  const supabase = await createClient();
  const storeId = await getActiveStoreId();

  const { data } = await supabase
    .from("staff")
    .select(
      `user_id, status, invited_at, joined_at,
       role:roles(id, key, name),
       profile:profiles(email, full_name, avatar_url)`,
    )
    .eq("store_id", storeId)
    .order("joined_at", { ascending: false });

  type Row = {
    user_id: string;
    status: string;
    invited_at: string | null;
    joined_at: string | null;
    role:
      | { id: string; key: string; name: string }
      | Array<{ id: string; key: string; name: string }>
      | null;
    profile:
      | {
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
        }
      | Array<{
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
        }>
      | null;
  };

  return ((data as Row[] | null) ?? []).map((s) => {
    const role = Array.isArray(s.role) ? s.role[0] : s.role;
    const profile = Array.isArray(s.profile) ? s.profile[0] : s.profile;
    return {
      userId: s.user_id,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      roleId: role?.id ?? "",
      roleKey: role?.key ?? "",
      roleName: role?.name ?? "Unknown role",
      status: (s.status as AdminStaffRow["status"]) ?? "active",
      invitedAt: s.invited_at,
      joinedAt: s.joined_at,
    };
  });
}
