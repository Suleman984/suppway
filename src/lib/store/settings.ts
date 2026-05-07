import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/config/env";
import type { ThemeId } from "@/lib/themes/types";

/**
 * The store_settings singleton is read on every server-rendered page so we
 * cache it per-request. It also drives the theme — pull this once near
 * the top of the layout tree and pass branding/theme down.
 *
 * If the row is missing for any reason the env defaults take over so the
 * site always renders.
 */
export interface StoreSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  contactEmail: string;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  activeTheme: ThemeId;
  customBrandColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  defaultLocale: string;
  defaultCurrency: string;
  seoTitle: string | null;
  seoDescription: string | null;
  social: Record<string, string>;
  flags: Record<string, unknown>;
}

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = createAdminClient();
  const { data } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
  return mapRow(data);
});

function mapRow(row: Record<string, unknown> | null): StoreSettings {
  return {
    id: (row?.id as string) ?? "00000000-0000-0000-0000-000000000000",
    name: (row?.name as string) ?? publicEnv.storeName,
    tagline: (row?.tagline as string) ?? publicEnv.storeTagline,
    description: (row?.description as string) ?? "",
    contactEmail: (row?.contact_email as string) ?? "",
    contactPhone: (row?.contact_phone as string) ?? null,
    whatsappNumber: (row?.whatsapp_number as string) ?? null,
    address: (row?.address as string) ?? null,
    activeTheme: (row?.active_theme as ThemeId) ?? "classic",
    customBrandColor: (row?.custom_brand_color as string) ?? null,
    logoUrl: (row?.logo_url as string) ?? publicEnv.storeLogoUrl,
    faviconUrl: (row?.favicon_url as string) ?? null,
    heroImageUrl: (row?.hero_image_url as string) ?? null,
    heroHeadline: (row?.hero_headline as string) ?? null,
    heroSubheadline: (row?.hero_subheadline as string) ?? null,
    defaultLocale: (row?.default_locale as string) ?? publicEnv.defaultLocale,
    defaultCurrency: (row?.default_currency as string) ?? publicEnv.defaultCurrency,
    seoTitle: (row?.seo_title as string) ?? null,
    seoDescription: (row?.seo_description as string) ?? null,
    social: (row?.social as Record<string, string>) ?? {},
    flags: (row?.flags as Record<string, unknown>) ?? {},
  };
}
