import { BrandingForm } from "@/components/admin/BrandingForm";
import { getStoreSettings } from "@/lib/store/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Branding" };

export default async function BrandingPage() {
  const settings = await getStoreSettings();
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold">Branding</h1>
      <p className="mt-2 text-muted-foreground">
        Edit your store identity. Changes go live on the storefront immediately.
      </p>
      <div className="mt-8">
        <BrandingForm
          current={{
            name: settings.name,
            tagline: settings.tagline,
            description: settings.description,
            logoUrl: settings.logoUrl ?? "",
            faviconUrl: settings.faviconUrl ?? "",
            heroImageUrl: settings.heroImageUrl ?? "",
            heroHeadline: settings.heroHeadline ?? "",
            heroSubheadline: settings.heroSubheadline ?? "",
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone ?? "",
            whatsappNumber: settings.whatsappNumber ?? "",
            address: settings.address ?? "",
            seoTitle: settings.seoTitle ?? "",
            seoDescription: settings.seoDescription ?? "",
          }}
        />
      </div>
    </div>
  );
}
