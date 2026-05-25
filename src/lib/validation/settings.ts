import { z } from "zod";
import { THEME_IDS } from "@/lib/themes/registry";
import type { ThemeId } from "@/lib/themes/types";

const themeIdSchema = z.enum(THEME_IDS as [ThemeId, ...ThemeId[]]);

export const updateThemeSchema = z.object({
  activeTheme: themeIdSchema,
  customBrandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #ff7a1a")
    .optional()
    .or(z.literal("")),
});
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

export const updateStoreSettingsSchema = z.object({
  defaultLocale: z.string().min(2).max(10),
  defaultCurrency: z.string().min(3).max(3),
  instagram: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
});
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;

export const updateBrandingSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  heroHeadline: z.string().max(200).optional(),
  heroSubheadline: z.string().max(400).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(40).optional(),
  whatsappNumber: z.string().max(40).optional(),
  address: z.string().max(400).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
