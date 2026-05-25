import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { BRAND } from "@/lib/brand";
import { SessionWatcher } from "@/components/auth/session-watcher";
import { StoreSlugProvider } from "@/lib/store/link";
import { getActiveStore } from "@/lib/store/active";

/**
 * Demo root layout — uses BRAND constants so the site renders without a
 * Supabase connection. When `store_settings` is wired up this will read
 * the live row again.
 */
export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  icons: { icon: "/favicon.ico" },
  openGraph: { siteName: BRAND.name, type: "website", locale: "en_PK" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#070707" },
    { media: "(prefers-color-scheme: dark)", color: "#070707" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeStore = await getActiveStore();
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionWatcher />
        <StoreSlugProvider slug={activeStore.slug}>
          {children}
        </StoreSlugProvider>
      </body>
    </html>
  );
}
