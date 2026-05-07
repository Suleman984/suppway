import type { Theme } from "./types";

/**
 * Render a theme by emitting a `<style>` block that sets the CSS variables
 * scoped to a specific selector. The storefront layout wraps its content
 * in `<div data-theme="...">` and renders this component once at the top
 * of the tree — no client JS, no FOUC, switchable at request time.
 *
 * Custom brand-color override can replace `--primary` (and ring) without
 * leaving the chosen theme.
 */
export function ThemeStyle({
  theme,
  customBrandColor,
}: {
  theme: Theme;
  customBrandColor?: string | null;
}) {
  const t = theme.tokens;
  const primary = customBrandColor ? hexToHsl(customBrandColor) ?? t.primary : t.primary;
  const ring = customBrandColor ? hexToHsl(customBrandColor) ?? t.ring : t.ring;

  const css = `
[data-theme="${theme.id}"] {
  --background: ${t.background};
  --foreground: ${t.foreground};
  --card: ${t.card};
  --card-foreground: ${t.cardForeground};
  --primary: ${primary};
  --primary-foreground: ${t.primaryForeground};
  --secondary: ${t.secondary};
  --secondary-foreground: ${t.secondaryForeground};
  --muted: ${t.muted};
  --muted-foreground: ${t.mutedForeground};
  --accent: ${t.accent};
  --accent-foreground: ${t.accentForeground};
  --destructive: ${t.destructive};
  --destructive-foreground: ${t.destructiveForeground};
  --border: ${t.border};
  --input: ${t.input};
  --ring: ${ring};
  --radius: ${theme.display.radius};
  color-scheme: ${theme.surface};
}
`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/** Convert "#rrggbb" to "h s% l%" (the format Tailwind expects). */
function hexToHsl(hex: string): string | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const num = parseInt(m[1]!, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
