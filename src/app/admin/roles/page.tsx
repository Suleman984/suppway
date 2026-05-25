import { ChevronRight, Lock, Shield, ShieldCheck, Users } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listAdminRoles, listAllPermissions } from "@/server/services/roles";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Roles" };

export default async function AdminRolesPage() {
  if (!(await hasPermission(PERMISSIONS.EMPLOYEES_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Roles"
        permission={PERMISSIONS.EMPLOYEES_VIEW}
        roleName={staff?.roleName}
      />
    );
  }

  const [roles, permissions] = await Promise.all([
    listAdminRoles(),
    listAllPermissions(),
  ]);
  const canManage = await hasPermission(PERMISSIONS.ROLES_MANAGE);

  const resources = new Set(permissions.map((p) => p.resource));

  return (
    <div className="container max-w-6xl py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {roles.length} {roles.length === 1 ? "role" : "roles"} ·{" "}
            {permissions.length} permissions across {resources.size} resources
          </p>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <article
            key={r.id}
            className="flex flex-col rounded-lg border bg-card p-5"
          >
            <header className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                    r.isSystem
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.isSystem ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Shield className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{r.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.key}
                  </p>
                </div>
              </div>
              {r.isSystem && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                  title="System role — cannot be modified"
                >
                  <Lock className="h-3 w-3" /> System
                </span>
              )}
            </header>
            {r.description && (
              <p className="mt-3 text-sm text-muted-foreground">
                {r.description}
              </p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Permissions
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {r.permissionCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Members
                </dt>
                <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold tabular-nums">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  {r.memberCount}
                </dd>
              </div>
            </dl>
            {canManage && !r.isSystem && (
              <button
                type="button"
                disabled
                className="mt-4 inline-flex items-center justify-between rounded-md border px-3 py-2 text-xs font-medium text-muted-foreground"
                title="Role editor coming soon"
              >
                Edit role
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </article>
        ))}
        {roles.length === 0 && (
          <p className="col-span-full rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
            No roles defined. Run the RBAC seed migration to create the
            defaults.
          </p>
        )}
      </section>

      <section className="mt-10">
        <header>
          <h2 className="text-xl font-semibold">Permission catalog</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every permission your store recognizes, grouped by resource. Used
            when assigning custom roles.
          </p>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from(resources)
            .sort()
            .map((resource) => {
              const group = permissions.filter((p) => p.resource === resource);
              return (
                <article
                  key={resource}
                  className="rounded-lg border bg-card p-4"
                >
                  <h3 className="text-sm font-semibold capitalize">
                    {resource}
                  </h3>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {group.map((p) => (
                      <li
                        key={p.key}
                        className="flex items-center justify-between gap-2"
                      >
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                          {p.action}
                        </code>
                        <span className="truncate text-muted-foreground">
                          {p.description ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}
