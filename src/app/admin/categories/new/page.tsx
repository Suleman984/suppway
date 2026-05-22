import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listCategoryOptions } from "@/server/services/categories";
import { CategoryForm } from "@/components/admin/categories/category-form";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  if (!(await hasPermission(PERMISSIONS.COLLECTIONS_MANAGE))) {
    redirect("/admin/categories");
  }
  const parents = await listCategoryOptions();

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to categories
      </Link>
      <h1 className="mt-3 text-3xl font-bold">New category</h1>
      <div className="mt-8">
        <CategoryForm
          mode="create"
          parents={parents}
          initial={{
            slug: "",
            title: "",
            description: "",
            imageUrl: "",
            parentId: null,
            sortOrder: 0,
            isPublished: true,
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </div>
    </div>
  );
}
