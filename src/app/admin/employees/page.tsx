import { Mail, ShieldCheck, UserCircle2 } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminStaff } from "@/server/services/staff";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Employees" };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  invited: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  suspended: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default async function AdminEmployeesPage() {
  if (!(await hasPermission(PERMISSIONS.EMPLOYEES_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Employees"
        permission={PERMISSIONS.EMPLOYEES_VIEW}
        roleName={staff?.roleName}
      />
    );
  }

  const staff = await listAdminStaff();
  const canInvite = await hasPermission(PERMISSIONS.EMPLOYEES_INVITE);

  const active = staff.filter((s) => s.status === "active").length;
  const invited = staff.filter((s) => s.status === "invited").length;
  const suspended = staff.filter((s) => s.status === "suspended").length;

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active} active · {invited} invited · {suspended} suspended
          </p>
        </div>
        {canInvite && (
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-md border bg-muted/40 px-4 text-sm font-medium text-muted-foreground"
            title="Invite flow coming soon"
          >
            <Mail className="h-4 w-4" />
            Invite employee
          </button>
        )}
      </header>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staff.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No staff in this store yet. Invite teammates to get started.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.userId} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                        {s.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {s.fullName ?? s.email ?? "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.email ?? "no email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                        STATUS_STYLES[s.status] ??
                        "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {s.joinedAt
                      ? new Date(s.joinedAt).toLocaleDateString()
                      : s.invitedAt
                        ? `invited ${new Date(s.invitedAt).toLocaleDateString()}`
                        : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canInvite && (
        <p className="mt-4 text-xs text-muted-foreground">
          Self-serve invitations are not wired up yet — staff are currently
          added by inserting rows into <code>public.staff</code> via SQL.
        </p>
      )}
    </div>
  );
}
