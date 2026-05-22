import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { SiteNav } from "@/components/storefront/landing/site-nav";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductDetail } from "@/components/storefront/product-detail";
import {
  DUMMY_PRODUCTS,
  getDummyProductBySlug,
} from "@/lib/catalog/products";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonLd";

export const revalidate = 60;

export function generateStaticParams() {
  return DUMMY_PRODUCTS.map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getDummyProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${product.categoryLabel}`,
    description: product.short,
    openGraph: {
      title: product.name,
      description: product.short,
      images: [{ url: product.images[0] }],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getDummyProductBySlug(slug);
  if (!product) notFound();

  const related = DUMMY_PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.kind === product.kind,
  ).slice(0, 4);

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

  return (
    <>
      <SiteNav />
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
          <ProductDetail product={product} />
        </section>

        {related.length > 0 && (
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
                {related.map((p) => (
                  <ProductCard key={p.slug} product={p} />
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
