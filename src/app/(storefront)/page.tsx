import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { GsapProvider } from "@/components/storefront/gsap-provider";
import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { Hero } from "@/components/storefront/landing/hero";
import { Marquee } from "@/components/storefront/landing/marquee";
import { SupplementCategories } from "@/components/storefront/landing/supplement-categories";
import { WhyUs } from "@/components/storefront/landing/why-us";
import { Bestsellers } from "@/components/storefront/landing/bestsellers";
import { Programs } from "@/components/storefront/landing/programs";
import { Testimonials } from "@/components/storefront/landing/testimonials";
import { FinalCta } from "@/components/storefront/landing/cta";

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Pharma-grade supplements, performance apparel and coaching plans built for serious lifters in Pakistan.",
};

export default function HomePage() {
  return (
    <>
      <GsapProvider />
      <SiteNavServer />
      <main>
        <Hero />
        <Marquee />
        <SupplementCategories />
        <WhyUs />
        <Bestsellers />
        <Programs />
        <Testimonials />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
