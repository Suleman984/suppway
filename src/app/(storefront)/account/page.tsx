export const dynamic = "force-dynamic";

export const metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">My account</h1>
      <p className="mt-2 text-muted-foreground">Order history, addresses, payment methods.</p>
    </section>
  );
}
