import Link from "@/lib/store/link";
import { storeLink } from "@/lib/store/active";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { getAdminProductById } from "@/server/services/products";
import { ProductForm } from "@/components/admin/products/product-form";
import { VariantsEditor } from "@/components/admin/products/variants-editor";
import { MediaManager } from "@/components/admin/products/media-manager";
import type { ProductKind, ProductStatus } from "@/lib/validation/product";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);
  return { title: product ? `Edit · ${product.title}` : "Product" };
}

export default async function EditProductPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.PRODUCTS_UPDATE))) {
    redirect(await storeLink("/admin/products"));
  }

  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) notFound();

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to products
      </Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold">{product.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            /{product.slug} · last updated{" "}
            {product.publishedAt
              ? new Date(product.publishedAt).toLocaleString()
              : "—"}
          </p>
        </div>
        {product.status === "published" && (
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View live
          </Link>
        )}
      </header>

      <div className="mt-8 space-y-8">
        <ProductForm
          mode="edit"
          initial={{
            id: product.id,
            slug: product.slug,
            title: product.title,
            description: product.description ?? "",
            kind: product.kind as ProductKind,
            status: product.status as ProductStatus,
            brand: product.brand ?? "",
            tags: product.tags,
            seoTitle: product.seoTitle ?? "",
            seoDescription: product.seoDescription ?? "",
          }}
        />

        <VariantsEditor
          productId={product.id}
          initial={product.variants.map((v) => ({
            id: v.id,
            sku: v.sku ?? "",
            title: v.title,
            option1: v.option1 ?? "",
            option2: v.option2 ?? "",
            option3: v.option3 ?? "",
            priceCents: v.priceCents,
            compareAtCents: v.compareAtCents ?? undefined,
            currency: v.currency,
            inventoryQty: v.inventoryQty,
            inventoryPolicy: v.inventoryPolicy,
            position: v.position,
          }))}
        />

        <MediaManager
          productId={product.id}
          initial={product.media.map((m) => ({
            id: m.id,
            url: m.url,
            alt: m.alt,
            position: m.position,
          }))}
        />
      </div>
    </div>
  );
}
