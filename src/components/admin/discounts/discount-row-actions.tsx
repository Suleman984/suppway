"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import {
  deleteDiscount,
  toggleDiscountActive,
} from "@/server/actions/discounts";

export function DiscountRowActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const r = await toggleDiscountActive(id);
      if (!r.ok) setError(r.error);
    });
  }

  function onDelete() {
    if (!confirm("Delete this discount? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteDiscount(id);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
        title={isActive ? "Deactivate" : "Activate"}
        aria-label={isActive ? "Deactivate" : "Activate"}
      >
        {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        title="Delete"
        aria-label="Delete discount"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && (
        <span role="alert" className="ml-1 text-xs text-destructive" title={error}>
          !
        </span>
      )}
    </>
  );
}
