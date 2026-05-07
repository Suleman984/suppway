/**
 * JSON-LD builders. Render the returned object inside a
 * <script type="application/ld+json"> tag in the corresponding page.
 *
 * Search engines use these structured data hints for rich results
 * (price, availability, breadcrumbs, organization). Keep the shape
 * aligned with schema.org reference.
 */

interface ProductLd {
  name: string;
  description?: string;
  image?: string[];
  sku?: string;
  brand?: string;
  url: string;
  priceCents: number;
  currency: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
}

export function productJsonLd(p: ProductLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.image,
    sku: p.sku,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: p.currency,
      price: (p.priceCents / 100).toFixed(2),
      availability: `https://schema.org/${p.availability}`,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationJsonLd(opts: { name: string; url: string; logo?: string; sameAs?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
    logo: opts.logo,
    sameAs: opts.sameAs,
  };
}
