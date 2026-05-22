"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  deleteProduct,
  togglePublish,
} from "@/server/actions/products";

interface Props {
  productId: string;
  status: "draft" | "published" | "archived";
  canDelete: boolean;
  canPublish: boolean;
}

export function ProductRowActions({
  productId,
  status,
  canDelete,
  canPublish,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTogglePublish() {
    setError(null);
    startTransition(async () => {
      const r = await togglePublish(productId);
      if (!r.ok) setError(r.error);
    });
  }

  function onDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteProduct(productId);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <>
      {canPublish && (
        <button
          type="button"
          onClick={onTogglePublish}
          disabled={pending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          title={status === "published" ? "Unpublish" : "Publish"}
          aria-label={status === "published" ? "Unpublish" : "Publish"}
        >
          {status === "published" ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          title="Delete"
          aria-label="Delete product"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {error && (
        <span
          role="alert"
          className="ml-2 text-xs text-destructive"
          title={error}
        >
          !
        </span>
      )}
    </>
  );
}
