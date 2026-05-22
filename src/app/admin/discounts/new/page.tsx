import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { hasPermission } from "@/lib/rbac/check";
import { PERMISSIONS } from "@/config/permissions";
import { listCategoryOptions } from "@/server/services/categories";
import { listProductOptions } from "@/server/services/discounts";
import { DiscountForm } from "@/components/admin/discounts/discount-form";

export const metadata = { title: "New discount" };

export default async function NewDiscountPage() {
  if (!(await hasPermission(PERMISSIONS.DISCOUNTS_CREATE))) {
    redirect("/admin/discounts");
  }
  const [products, categories] = await Promise.all([
    listProductOptions(),
    listCategoryOptions(),
  ]);

  return (
    <div className="container max-w-5xl py-10">
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to discounts
      </Link>
      <h1 className="mt-3 text-3xl font-bold">New discount</h1>
      <div className="mt-8">
        <DiscountForm
          mode="create"
          products={products}
          categories={categories}
          initial={{
            title: "",
            description: "",
            code: "",
            kind: "percent",
            value: 10,
            scope: "order",
            productId: null,
            categoryId: null,
            minSubtotalCents: null,
            maxUses: null,
            startsAt: "",
            endsAt: "",
            isActive: true,
          }}
        />
      </div>
    </div>
  );
}
