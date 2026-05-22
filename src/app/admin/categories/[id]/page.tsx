import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import {
  getAdminCategoryById,
  listCategoryOptions,
} from "@/server/services/categories";
import { CategoryForm } from "@/components/admin/categories/category-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = await getAdminCategoryById(id);
  return { title: c ? `Edit · ${c.title}` : "Category" };
}

export default async function EditCategoryPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.COLLECTIONS_MANAGE))) {
    redirect("/admin/categories");
  }
  const { id } = await params;
  const [category, parents] = await Promise.all([
    getAdminCategoryById(id),
    listCategoryOptions(),
  ]);
  if (!category) notFound();

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to categories
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{category.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">/{category.slug}</p>
      <div className="mt-8">
        <CategoryForm
          mode="edit"
          parents={parents}
          initial={{
            id: category.id,
            slug: category.slug,
            title: category.title,
            description: category.description ?? "",
            imageUrl: category.imageUrl ?? "",
            parentId: category.parentId,
            sortOrder: category.sortOrder,
            isPublished: category.isPublished,
            seoTitle: category.seoTitle ?? "",
            seoDescription: category.seoDescription ?? "",
          }}
        />
      </div>
    </div>
  );
}
