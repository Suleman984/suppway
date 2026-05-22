"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/server/actions/categories";

export function CategoryRowActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (!confirm("Delete this category? Products assigned to it stay, but lose this label.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await deleteCategory(id);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        aria-label="Delete category"
        title="Delete"
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
