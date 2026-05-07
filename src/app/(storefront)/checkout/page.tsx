export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Checkout placeholder — call <code>getPaymentProvider</code> to render the chosen rail.
      </p>
    </section>
  );
}
