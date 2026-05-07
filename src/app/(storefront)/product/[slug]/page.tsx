import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return (
    <section className="container py-12">
      <h1 className="text-3xl font-bold">{slug}</h1>
      <p className="mt-2 text-muted-foreground">
        Wire up <code>getProductBySlug(slug)</code> and add JSON-LD Product schema via
        <code> src/lib/seo/jsonLd.ts</code>.
      </p>
    </section>
  );
}
