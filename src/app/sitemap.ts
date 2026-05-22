import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";
import { DUMMY_PRODUCTS } from "@/lib/catalog/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.appUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/products?kind=supplement`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/products?kind=apparel`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/products?kind=equipment`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/products?kind=accessory`, changeFrequency: "weekly", priority: 0.8 },
    ...DUMMY_PRODUCTS.map((p) => ({
      url: `${base}/product/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
