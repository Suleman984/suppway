import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { CartPageClient } from "@/components/storefront/cart-page";

export const dynamic = "force-dynamic"; // cart is per-session, never cache
export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <section className="container py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Cart
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            Your cart
          </h1>
          <div className="mt-10">
            <CartPageClient />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
