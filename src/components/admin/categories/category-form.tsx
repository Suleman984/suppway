"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from "@/server/actions/categories";
import type { CategoryOption } from "@/server/services/categories";

interface InitialValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  sortOrder: number;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
}

interface Props {
  mode: "create" | "edit";
  initial: InitialValues;
  parents: CategoryOption[];
}

export function CategoryForm({ mode, initial, parents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function patch<K extends keyof InitialValues>(key: K, value: InitialValues[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      ...state,
      parentId: state.parentId || null,
    };

    startTransition(async () => {
      const result: ActionResult<{ id: string }> | ActionResult =
        mode === "create"
          ? await createCategory(payload)
          : await updateCategory({ ...payload, id: initial.id });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (mode === "create" && "data" in result && result.data) {
        router.push(`/admin/categories/${result.data.id}`);
      } else {
        setSavedAt(new Date());
        router.refresh();
      }
    });
  }

  const otherParents = parents.filter((p) => p.id !== initial.id);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Section title="Basics">
          <Field label="Title" error={fieldErrors.title}>
            <Input
              value={state.title}
              onChange={(e) => patch("title", e.target.value)}
              required
              placeholder="e.g. Protein"
            />
          </Field>
          <Field
            label="Slug"
            hint="Lowercase letters, digits, and dashes. Used in URLs."
            error={fieldErrors.slug}
          >
            <Input
              value={state.slug}
              onChange={(e) =>
                patch(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                )
              }
              required
              placeholder="protein"
            />
          </Field>
          <Field label="Description" error={fieldErrors.description}>
            <textarea
              value={state.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="What products live in this category and why."
            />
          </Field>
          <Field
            label="Image URL"
            hint="Optional. Hero image shown on the category landing page."
          >
            <Input
              value={state.imageUrl}
              onChange={(e) => patch("imageUrl", e.target.value)}
              type="url"
              placeholder="https://…"
            />
          </Field>
        </Section>

        <Section title="Hierarchy">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Parent category" hint="Leave empty for a top-level category.">
              <select
                value={state.parentId ?? ""}
                onChange={(e) => patch("parentId", e.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">— Top level —</option>
                {otherParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort order" hint="Lower numbers show first.">
              <Input
                type="number"
                min={0}
                value={state.sortOrder}
                onChange={(e) =>
                  patch("sortOrder", Number(e.target.value) || 0)
                }
              />
            </Field>
          </div>
        </Section>

        <Section title="SEO">
          <Field
            label="SEO title"
            hint="Defaults to the category title."
            error={fieldErrors.seoTitle}
          >
            <Input
              value={state.seoTitle}
              onChange={(e) => patch("seoTitle", e.target.value)}
              maxLength={60}
            />
          </Field>
          <Field
            label="Meta description"
            error={fieldErrors.seoDescription}
          >
            <textarea
              value={state.seoDescription}
              onChange={(e) => patch("seoDescription", e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </Field>
        </Section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Visibility
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={state.isPublished}
              onChange={(e) => patch("isPublished", e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">
              <span className="block font-medium">Published</span>
              <span className="block text-xs text-muted-foreground">
                Visible to customers when unchecked it stays hidden.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
          <Link
            href="/admin/categories"
            className="mt-2 block text-center text-xs text-muted-foreground hover:underline"
          >
            Cancel
          </Link>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}
          {savedAt && !error && (
            <p className="mt-3 text-center text-xs text-emerald-600 dark:text-emerald-400">
              Saved {savedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      {hint && !error && (
        <span className="mb-1.5 mt-0.5 block text-xs text-muted-foreground">
          {hint}
        </span>
      )}
      {error && (
        <span className="mb-1.5 mt-0.5 block text-xs text-destructive">
          {error}
        </span>
      )}
      <div className="mt-1">{children}</div>
    </label>
  );
}
