import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductDetail } from "@/components/storefront/product-detail";
import {
  getStorefrontProductBySlug,
  listStorefrontProducts,
} from "@/server/services/storefront";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonLd";
import type { DummyProduct } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${product.categoryLabel}`,
    description: product.short,
    openGraph: {
      title: product.name,
      description: product.short,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) notFound();

  // Related = same kind, exclude self, take first 4
  const { items: related } = await listStorefrontProducts({
    kind: product.kind,
    pageSize: 8,
  });
  const relatedCards = related
    .filter((r) => r.slug !== product.slug)
    .slice(0, 4);

  const url = `https://${BRAND.name}.com/product/${product.slug}`;
  const productLd = productJsonLd({
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    brand: BRAND.name,
    url,
    priceCents: product.price * 100,
    currency: "PKR",
    availability: product.variants.some((v) => v.inStock)
      ? "InStock"
      : "OutOfStock",
  });
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", url: `https://${BRAND.name}.com/` },
    { name: "Products", url: `https://${BRAND.name}.com/products` },
    { name: product.name, url },
  ]);

  // Adapt the DB-shaped product to the existing ProductDetail prop shape.
  const adapted: DummyProduct = {
    slug: product.slug,
    name: product.name,
    kind: product.kind as DummyProduct["kind"],
    categoryLabel: product.categoryLabel,
    flavor: product.variants[0]?.title ?? "",
    price: product.price,
    oldPrice: product.oldPrice,
    rating: product.rating,
    reviews: product.reviews,
    badge: product.badge as DummyProduct["badge"],
    accent: product.accent,
    short: product.short,
    description: product.description,
    highlights: product.highlights,
    ingredients: product.ingredients,
    macros: product.macros,
    variants: product.variants.map((v) => ({
      id: v.id,
      label: v.title,
      price: v.priceCents / 100,
      inStock: v.inStock,
    })),
    images:
      product.images.length > 0
        ? (product.images as [string, ...string[]])
        : [
            "https://images.pexels.com/photos/4046718/pexels-photo-4046718.jpeg?auto=compress&cs=tinysrgb&w=800",
          ],
  };

  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <nav
          aria-label="Breadcrumb"
          className="container flex items-center gap-2 py-6 text-xs uppercase tracking-widest text-white/55"
        >
          <Link href="/" prefetch className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" prefetch className="hover:text-white">
            Products
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-white/85">{product.name}</span>
        </nav>

        <section className="container pb-16">
          <ProductDetail product={adapted} />
        </section>

        {relatedCards.length > 0 && (
          <section className="border-t border-white/10 bg-[#080808] py-16">
            <div className="container">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  You might also like
                </h2>
                <Link
                  href="/products"
                  prefetch
                  className="text-xs font-bold uppercase tracking-widest text-white/65 hover:text-white"
                >
                  View all →
                </Link>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {relatedCards.map((p) => (
                  <ProductCard
                    key={p.slug}
                    product={{
                      slug: p.slug,
                      name: p.name,
                      kind: p.kind as DummyProduct["kind"],
                      categoryLabel: p.categoryLabel,
                      flavor: p.flavor,
                      price: p.price,
                      oldPrice: p.oldPrice,
                      rating: p.rating,
                      reviews: p.reviews,
                      badge: p.badge as DummyProduct["badge"],
                      accent: p.accent,
                      short: p.short,
                      description: p.short,
                      highlights: [],
                      images: [p.imageUrl],
                      variants: [],
                    }}
                    quickAddVariantId={p.quickAddVariantId}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}
