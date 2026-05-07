import Link from "next/link";
import { redirect } from "next/navigation";
import { getStoreContext } from "@/lib/store/context";
import { getStoreSettings } from "@/lib/store/settings";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/funnels", label: "Funnels" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/themes", label: "Theme" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/settings", label: "Settings" },
];

/**
 * Admin layout. Visible only to authenticated staff. Customers get bounced
 * to their account page; logged-out users to /login.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, staff } = await getStoreContext();
  if (!user) redirect("/login?next=/admin/dashboard");
  if (!staff) redirect("/account");

  const settings = await getStoreSettings();

  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr]">
      <aside className="flex flex-col border-r bg-muted/40">
        <div className="border-b px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
          <p className="font-semibold">{settings.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{staff.roleName}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
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
