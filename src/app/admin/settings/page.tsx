import Link from "@/lib/store/link";
import { ArrowUpRight, Brush, Palette } from "lucide-react";
import { getStoreSettings } from "@/lib/store/settings";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { AccessDenied } from "@/components/admin/access-denied";
import { getStoreContext } from "@/lib/store/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  if (!(await hasPermission(PERMISSIONS.SETTINGS_VIEW))) {
    const { staff } = await getStoreContext();
    return (
      <AccessDenied
        resource="Settings"
        permission={PERMISSIONS.SETTINGS_VIEW}
        roleName={staff?.roleName}
      />
    );
  }
  const canUpdate = await hasPermission(PERMISSIONS.SETTINGS_UPDATE);

  const settings = await getStoreSettings();
  const social = settings.social ?? {};

  return (
    <div className="container max-w-4xl py-10">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Store identity, locale, currency, and social links.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/branding"
          className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-foreground/20 hover:bg-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Brush className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Branding</p>
            <p className="truncate text-xs text-muted-foreground">
              Logo, hero, SEO, contact info
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
        <Link
          href="/admin/themes"
          className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition hover:border-foreground/20 hover:bg-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Palette className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Theme</p>
            <p className="truncate text-xs text-muted-foreground">
              Storefront look and feel
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      </section>

      {canUpdate ? (
        <div className="mt-10">
          <StoreSettingsForm
            current={{
              defaultLocale: settings.defaultLocale,
              defaultCurrency: settings.defaultCurrency,
              instagram: social.instagram ?? "",
              facebook: social.facebook ?? "",
              twitter: social.twitter ?? "",
              tiktok: social.tiktok ?? "",
              youtube: social.youtube ?? "",
            }}
          />
        </div>
      ) : (
        <div className="mt-10 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
          You don&apos;t have permission to update store settings. Ask an
          administrator to grant <code>settings.update</code>.
        </div>
      )}
    </div>
  );
}
