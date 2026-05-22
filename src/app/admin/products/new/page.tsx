import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { ProductForm } from "@/components/admin/products/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  if (!(await hasPermission(PERMISSIONS.PRODUCTS_CREATE))) {
    redirect("/admin/products");
  }
  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to products
      </Link>
      <h1 className="mt-3 text-3xl font-bold">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save first to unlock variants and image upload.
      </p>
      <div className="mt-8">
        <ProductForm
          mode="create"
          initial={{
            slug: "",
            title: "",
            description: "",
            kind: "supplement",
            status: "draft",
            brand: "",
            tags: [],
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </div>
    </div>
  );
}
