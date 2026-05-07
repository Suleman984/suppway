/**
 * Storefront layout. Demo build — kept as a thin passthrough so the
 * landing page can render its own nav/footer (and operate without a
 * Supabase connection). When the catalog goes live this will read
 * `store_settings` again and host the shared shell.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#070707] text-white">{children}</div>;
}
