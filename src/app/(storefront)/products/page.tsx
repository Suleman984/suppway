import type { Metadata } from "next";
import Link from "next/link";
import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { ProductCard } from "@/components/storefront/product-card";
import {
  listStorefrontProducts,
  type StorefrontProductCard,
} from "@/server/services/storefront";
import type { DummyProduct } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop all products",
  description:
    "Pharma-grade supplements, performance apparel, equipment and accessories — all in one place.",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "supplement", label: "Supplements" },
  { key: "apparel", label: "Apparel" },
  { key: "equipment", label: "Equipment" },
  { key: "accessory", label: "Accessories" },
] as const;

type SortKey = "popular" | "rating" | "price-asc" | "price-desc";
type FilterKey = (typeof FILTERS)[number]["key"];

interface Props {
  searchParams: Promise<{ kind?: string; cat?: string; sort?: string }>;
}

export default async function ProductsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeKind = (FILTERS.find((f) => f.key === sp.kind)?.key ?? "all") as FilterKey;
  const sort = (
    ["popular", "rating", "price-asc", "price-desc"] as const
  ).includes(sp.sort as SortKey)
    ? (sp.sort as SortKey)
    : "popular";

  const { items, total, fallback } = await listStorefrontProducts({
    kind: activeKind === "all" ? undefined : activeKind,
    cat: sp.cat,
    sort,
    pageSize: 60,
  });

  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <header className="border-b border-white/10 bg-[#070707]">
          <div className="container py-12 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
              Catalog
            </p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              Shop all products
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/65">
              {total} {total === 1 ? "item" : "items"} ·
              fully-dosed supplements, heavyweight apparel and gym-tested gear.
            </p>
            {fallback && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300">
                Showing the bundled demo catalog — publish products in /admin/products to see live data
              </p>
            )}
          </div>
        </header>

        <section className="container py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav
              aria-label="Filter by category"
              className="-mx-1 flex flex-wrap gap-2"
            >
              {FILTERS.map((f) => {
                const active = f.key === activeKind;
                const href = f.key === "all" ? "/products" : `/products?kind=${f.key}`;
                return (
                  <Link
                    key={f.key}
                    href={href}
                    prefetch
                    className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold uppercase tracking-wider transition ${
                      active
                        ? "border-[#ff3b3b] bg-[#ff3b3b] text-white"
                        : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </nav>
            <SortLinks activeKind={activeKind} sort={sort} />
          </div>

          {items.length === 0 ? (
            <p className="mt-16 text-center text-white/55">Nothing here yet.</p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p, i) => (
                <ProductCard
                  key={p.slug}
                  product={cardToProductCardProp(p)}
                  priority={i < 4}
                  quickAddVariantId={p.quickAddVariantId}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SortLinks({
  activeKind,
  sort,
}: {
  activeKind: FilterKey;
  sort: SortKey;
}) {
  const base = activeKind === "all" ? "" : `kind=${activeKind}&`;
  const options: { key: SortKey; label: string }[] = [
    { key: "popular", label: "Popular" },
    { key: "rating", label: "Top rated" },
    { key: "price-asc", label: "Price ↑" },
    { key: "price-desc", label: "Price ↓" },
  ];
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-bold uppercase tracking-wider text-white/45">Sort</span>
      {options.map((o) => {
        const active = sort === o.key;
        return (
          <Link
            key={o.key}
            href={`/products?${base}sort=${o.key}`}
            prefetch
            className={`rounded-full px-3 py-1.5 transition ${
              active ? "bg-white text-neutral-900" : "text-white/65 hover:text-white"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * The existing ProductCard expects a DummyProduct shape. Map our normalized
 * storefront card to that shape so we don't have to rewrite the card UI.
 */
function cardToProductCardProp(c: StorefrontProductCard): DummyProduct {
  return {
    slug: c.slug,
    name: c.name,
    kind: c.kind as DummyProduct["kind"],
    categoryLabel: c.categoryLabel,
    flavor: c.flavor,
    price: c.price,
    oldPrice: c.oldPrice,
    rating: c.rating,
    reviews: c.reviews,
    badge: c.badge as DummyProduct["badge"],
    accent: c.accent,
    short: c.short,
    description: c.short,
    highlights: [],
    images: [c.imageUrl],
    variants: [],
  };
}
