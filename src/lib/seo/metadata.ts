import type { Metadata } from "next";
import { publicEnv } from "@/config/env";

interface PageMeta {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Helper for per-page generateMetadata: produces canonical URL, OG tags,
 * Twitter card, and robot rules in a single call.
 */
export function buildMetadata(meta: PageMeta): Metadata {
  const url = meta.path ? `${publicEnv.appUrl}${meta.path}` : undefined;
  return {
    title: meta.title,
    description: meta.description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      images: meta.image ? [meta.image] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: meta.image ? [meta.image] : undefined,
    },
    robots: meta.noIndex ? { index: false, follow: false } : undefined,
  };
}
