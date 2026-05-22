import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "./newsletter-form";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?kind=supplement", label: "Supplements" },
      { href: "/products?kind=apparel", label: "Apparel" },
      { href: "/products?kind=equipment", label: "Equipment" },
      { href: "/products?kind=accessory", label: "Accessories" },
    ],
  },
  {
    title: "Train",
    links: [
      { href: "/#programs", label: "Coaching plans" },
      { href: "/products?sort=rating", label: "Top rated" },
      { href: "/products?sort=price-asc", label: "Best value" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/account", label: "My account" },
      { href: "/cart", label: "Cart" },
      { href: "/checkout", label: "Checkout" },
      { href: "#", label: "Shipping & returns" },
      { href: "#", label: "Contact us" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070707] text-white">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 text-base font-black uppercase">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#ff3b3b] text-sm font-black">
                S
              </span>
              {BRAND.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/60">{BRAND.tagline}</p>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Get in touch
            </p>
            <p className="mt-2 text-sm text-white/80">{BRAND.email}</p>
            <p className="text-sm text-white/80">WhatsApp · {BRAND.whatsapp}</p>
            <p className="mt-1 text-sm text-white/60">{BRAND.city}</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      prefetch={l.href.startsWith("/")}
                      className="text-sm text-white/80 transition hover:text-[#ff3b3b]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Newsletter</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href={BRAND.social.instagram} className="hover:text-white">
              Instagram
            </a>
            <a href={BRAND.social.youtube} className="hover:text-white">
              YouTube
            </a>
            <a href={BRAND.social.tiktok} className="hover:text-white">
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
