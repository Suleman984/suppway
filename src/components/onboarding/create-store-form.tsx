"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createStore } from "@/server/actions/stores";

export function CreateStoreForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGenericError(null);
    startTransition(async () => {
      const result = await createStore({ slug: slug || autoSlug(name), name });
      if (!result.ok) {
        setGenericError(result.error);
        setErrors(result.fieldErrors ?? {});
        return;
      }
      router.push(`/s/${result.data.slug}/admin/dashboard`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Store name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) setSlug(autoSlug(e.target.value));
          }}
          required
          maxLength={80}
          placeholder="Fitness Arena"
          className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name}</p>
        )}
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Slug
        </span>
        <div className="mt-1 flex items-center rounded-md border border-input bg-background">
          <span className="px-3 text-sm text-muted-foreground">/s/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(autoSlug(e.target.value))}
            required
            maxLength={32}
            placeholder="fitness-arena"
            className="h-11 flex-1 bg-transparent pr-3 text-sm focus:outline-none"
          />
        </div>
        {errors.slug && (
          <p className="mt-1 text-xs text-destructive">{errors.slug}</p>
        )}
      </label>

      {genericError && !Object.keys(errors).length && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {genericError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !name || !slug}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-bold uppercase tracking-wider text-background hover:opacity-90 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create store
      </button>
    </form>
  );
}
