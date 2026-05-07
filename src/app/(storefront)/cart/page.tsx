export const dynamic = "force-dynamic"; // cart is per-session, never cache

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <p className="mt-2 text-muted-foreground">Cart UI placeholder.</p>
    </section>
  );
}
