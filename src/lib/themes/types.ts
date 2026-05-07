/**
 * Theme model. A theme is a set of CSS color tokens (HSL triples, no
 * `hsl(...)` wrapper — Tailwind reads them via `hsl(var(--primary))`),
 * a typography mode, and metadata for the admin picker.
 *
 * Server components read the active theme id from store_settings, look it
 * up here, and apply it by rendering CSS variables inline on `<html>`.
 * No client JS, no FOUC.
 */
export type ThemeId = "classic" | "powerhouse" | "iron" | "pulse" | "minimal";

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  surface: "light" | "dark";
  /** A 2-color preview swatch shown in the admin picker. */
  preview: { bg: string; primary: string };
  tokens: ThemeTokens;
  /** Layout flavor toggles a few storefront component variants. */
  display: { uppercaseHeadings: boolean; tracking: "tight" | "normal" | "wide"; radius: string };
}
