import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listCategoryOptions } from "@/server/services/categories";
import {
  getAdminDiscountById,
  listProductOptions,
} from "@/server/services/discounts";
import { DiscountForm } from "@/components/admin/discounts/discount-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const d = await getAdminDiscountById(id);
  return { title: d ? `Edit · ${d.title}` : "Discount" };
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditDiscountPage({ params }: PageProps) {
  if (!(await hasPermission(PERMISSIONS.DISCOUNTS_UPDATE))) {
    redirect("/admin/discounts");
  }
  const { id } = await params;
  const [discount, products, categories] = await Promise.all([
    getAdminDiscountById(id),
    listProductOptions(),
    listCategoryOptions(),
  ]);
  if (!discount) notFound();

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to discounts
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{discount.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Used {discount.usesCount} time{discount.usesCount === 1 ? "" : "s"}
        {discount.maxUses ? ` of ${discount.maxUses}` : ""}.
      </p>
      <div className="mt-8">
        <DiscountForm
          mode="edit"
          products={products}
          categories={categories}
          initial={{
            id: discount.id,
            title: discount.title,
            description: discount.description ?? "",
            code: discount.code ?? "",
            kind: discount.kind,
            value: discount.value,
            scope: discount.scope,
            productId: discount.productId,
            categoryId: discount.categoryId,
            minSubtotalCents: discount.minSubtotalCents,
            maxUses: discount.maxUses,
            startsAt: toLocalInput(discount.startsAt),
            endsAt: toLocalInput(discount.endsAt),
            isActive: discount.isActive,
          }}
        />
      </div>
    </div>
  );
}
