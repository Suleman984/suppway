import { getStorefrontBestsellers } from "@/server/services/storefront";
import { Bestsellers, type BestsellerProduct } from "./bestsellers";

/**
 * Server-fed wrapper around the animated Bestsellers section. Pulls the
 * top 4 published products from the DB (with a dummy-catalog fallback for
 * fresh installs) and hands them to the client component.
 */
export async function BestsellersServer() {
  const rows = await getStorefrontBestsellers(4);
  const products: BestsellerProduct[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    categoryLabel: r.categoryLabel,
    flavor: r.flavor,
    price: r.price,
    oldPrice: r.oldPrice,
    rating: r.rating,
    badge: r.badge,
    accent: r.accent,
    short: r.short,
    imageUrl: r.imageUrl,
  }));
  return <Bestsellers products={products} />;
}
