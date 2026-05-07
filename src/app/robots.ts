import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/super-admin", "/account", "/checkout", "/api", "/funnel"] },
    ],
    sitemap: `${publicEnv.appUrl}/sitemap.xml`,
  };
}
