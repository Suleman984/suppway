import Link from "@/lib/store/link";
import { storeLink } from "@/lib/store/active";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getPendingReturnsCount } from "@/server/services/returns";
import { PERMISSIONS, type Permission } from "@/config/permissions";

interface NavItem {
  href: string;
  label: string;
  /** Hide this item unless the user has at least one of these permissions. */
  requires?: Permission[];
  badgeKey?: "returns";
}

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products", requires: [PERMISSIONS.PRODUCTS_VIEW] },
  { href: "/admin/categories", label: "Categories", requires: [PERMISSIONS.COLLECTIONS_MANAGE] },
  { href: "/admin/discounts", label: "Discounts", requires: [PERMISSIONS.DISCOUNTS_VIEW] },
  { href: "/admin/orders", label: "Orders", requires: [PERMISSIONS.ORDERS_VIEW] },
  { href: "/admin/returns", label: "Returns", badgeKey: "returns", requires: [PERMISSIONS.RETURNS_VIEW] },
  { href: "/admin/customers", label: "Customers", requires: [PERMISSIONS.CUSTOMERS_VIEW] },
  { href: "/admin/funnels", label: "Funnels", requires: [PERMISSIONS.FUNNELS_VIEW] },
  { href: "/admin/analytics", label: "Analytics", requires: [PERMISSIONS.ANALYTICS_VIEW] },
  { href: "/admin/employees", label: "Employees", requires: [PERMISSIONS.EMPLOYEES_VIEW] },
  { href: "/admin/roles", label: "Roles", requires: [PERMISSIONS.EMPLOYEES_VIEW] },
  { href: "/admin/themes", label: "Theme", requires: [PERMISSIONS.SETTINGS_UPDATE] },
  { href: "/admin/branding", label: "Branding", requires: [PERMISSIONS.SETTINGS_UPDATE] },
  { href: "/admin/integrations", label: "Integrations", requires: [PERMISSIONS.INTEGRATIONS_MANAGE] },
  { href: "/admin/settings", label: "Settings", requires: [PERMISSIONS.SETTINGS_VIEW] },
];

/**
 * Admin layout. Visible only to authenticated staff. Customers get bounced
 * to their account page; logged-out users to /login.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, staff } = await getStoreContext();
  if (!user) {
    const next = await storeLink("/admin/dashboard");
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  if (!staff) redirect(await storeLink("/account"));

  const [settings, pendingReturns] = await Promise.all([
    getStoreSettings(),
    getPendingReturnsCount(),
  ]);

  const badges: Record<string, number> = { returns: pendingReturns };
  const userPerms = new Set(staff.permissions);
  const visibleNav = NAV.filter(
    (item) =>
      !item.requires || item.requires.some((p) => userPerms.has(p)),
  );

  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr]">
      <aside className="flex flex-col border-r bg-muted/40">
        <div className="border-b px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
          <p className="font-semibold">{settings.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{staff.roleName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {visibleNav.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <span>{item.label}</span>
                {badge && badge > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t px-6 py-4">
          <p className="truncate text-sm font-medium">{profile?.fullName ?? profile?.email}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="overflow-y-auto">{children}</main>
    </div>
  );
}
