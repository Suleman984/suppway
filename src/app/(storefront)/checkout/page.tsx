import { SiteNavServer } from "@/components/storefront/landing/site-nav-server";
import { SiteFooter } from "@/components/storefront/landing/site-footer";
import { CheckoutPageClient } from "@/components/storefront/checkout-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Signed-in users typing their own verified auth email skip the OTP step —
  // Supabase already proved that email belongs to them.
  const signedInEmail = user?.email?.toLowerCase() ?? null;

  return (
    <>
      <SiteNavServer />
      <main className="pt-24">
        <section className="container py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Secure checkout
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            Almost there
          </h1>
          <div className="mt-10">
            <CheckoutPageClient signedInEmail={signedInEmail} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
