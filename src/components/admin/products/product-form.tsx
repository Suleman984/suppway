"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProduct,
  updateProduct,
  type ActionResult,
} from "@/server/actions/products";
import type { ProductKind, ProductStatus } from "@/lib/validation/product";

interface InitialValues {
  id?: string;
  slug: string;
  title: string;
  description: string;
  kind: ProductKind;
  status: ProductStatus;
  brand: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

interface Props {
  mode: "create" | "edit";
  initial: InitialValues;
}

const KINDS: { value: ProductKind; label: string }[] = [
  { value: "supplement", label: "Supplement" },
  { value: "apparel", label: "Apparel" },
  { value: "equipment", label: "Equipment" },
  { value: "accessory", label: "Accessory" },
  { value: "program", label: "Program" },
  { value: "membership", label: "Membership" },
];

const STATUSES: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Hidden from the storefront." },
  { value: "published", label: "Published", hint: "Live on the storefront." },
  { value: "archived", label: "Archived", hint: "Hidden + excluded from search." },
];

export function ProductForm({ mode, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<InitialValues>(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
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
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      attributes: {},
    };

    startTransition(async () => {
      let result: ActionResult<{ id: string }> | ActionResult;
      if (mode === "create") {
        result = await createProduct(payload);
      } else {
        result = await updateProduct({ ...payload, id: initial.id });
      }

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (mode === "create" && "data" in result && result.data) {
        router.push(`/admin/products/${result.data.id}`);
      } else {
        setSavedAt(new Date());
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Section title="Basics">
          <Field label="Title" error={fieldErrors.title}>
            <Input
              value={state.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="e.g. Iso-Whey Pure"
              required
            />
          </Field>
          <Field
            label="Slug"
            hint="Lowercase letters, digits and dashes. This becomes the storefront URL."
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
              placeholder="iso-whey-pure-2kg"
              required
            />
          </Field>
          <Field label="Description" error={fieldErrors.description}>
            <textarea
              value={state.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={6}
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What's in the bottle, who it's for, what it does…"
            />
          </Field>
        </Section>

        <Section title="Organization">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind">
              <select
                value={state.kind}
                onChange={(e) => patch("kind", e.target.value as ProductKind)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <Input
                value={state.brand}
                onChange={(e) => patch("brand", e.target.value)}
                placeholder="e.g. Suppway"
              />
            </Field>
          </div>
          <Field
            label="Tags"
            hint="Comma-separated. Used for search and filtering."
          >
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="whey, isolate, chocolate"
            />
          </Field>
        </Section>

        <Section title="SEO">
          <Field
            label="SEO title"
            hint="Shown in search results. Max 60 characters."
            error={fieldErrors.seoTitle}
          >
            <Input
              value={state.seoTitle}
              onChange={(e) => patch("seoTitle", e.target.value)}
              maxLength={60}
              placeholder={state.title || "Defaults to product title"}
            />
            <CharCount value={state.seoTitle} max={60} />
          </Field>
          <Field
            label="Meta description"
            hint="One-line summary for search engines. Max 160 characters."
            error={fieldErrors.seoDescription}
          >
            <textarea
              value={state.seoDescription}
              onChange={(e) => patch("seoDescription", e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <CharCount value={state.seoDescription} max={160} />
          </Field>
        </Section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
        <Section title="Status">
          <div className="space-y-2">
            {STATUSES.map((s) => (
              <label
                key={s.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                  state.status === s.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={state.status === s.value}
                  onChange={() => patch("status", s.value)}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <div className="rounded-lg border bg-card p-4">
          <Button type="submit" disabled={pending} className="w-full gap-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
          <Link
            href="/admin/products"
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
        <span className="mb-1.5 mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      )}
      {error && (
        <span className="mb-1.5 mt-0.5 block text-xs text-destructive">{error}</span>
      )}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  return (
    <p
      className={`mt-1 text-right text-[11px] tabular-nums ${
        len > max * 0.9 ? "text-amber-600" : "text-muted-foreground"
      }`}
    >
      {len} / {max}
    </p>
  );
}
