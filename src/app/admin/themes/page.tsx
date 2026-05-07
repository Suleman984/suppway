import { ThemePicker } from "@/components/admin/ThemePicker";
import { getStoreSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Theme" };

export default async function ThemesPage() {
  const settings = await getStoreSettings();
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold">Theme</h1>
      <p className="mt-2 text-muted-foreground">
        Pick a built-in theme for your storefront, or override the primary color to match your brand.
      </p>
      <div className="mt-8">
        <ThemePicker
          current={{ activeTheme: settings.activeTheme, customBrandColor: settings.customBrandColor }}
        />
      </div>
    </div>
  );
}
