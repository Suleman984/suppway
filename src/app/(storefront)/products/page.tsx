export const revalidate = 60;
export const metadata = { title: "Shop all products" };

export default function ProductsListPage() {
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">All products</h1>
      <p className="mt-2 text-muted-foreground">
        Wire up <code>getProducts()</code> in <code>src/server/services/products.ts</code> to render
        the catalog from Supabase.
      </p>
    </section>
  );
}
