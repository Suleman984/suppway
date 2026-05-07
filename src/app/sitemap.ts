import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";

/**
 * Static sitemap. Once products + collections are populated, extend this
 * with DB-backed URLs (look up published products and category slugs).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.appUrl;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/collection/supplements`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/collection/apparel`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/collection/equipment`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/collection/programs`, changeFrequency: "weekly", priority: 0.7 },
  ];
}
