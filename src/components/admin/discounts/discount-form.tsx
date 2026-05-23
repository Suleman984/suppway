"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDiscount,
  updateDiscount,
  type ActionResult,
} from "@/server/actions/discounts";
import type {
  DiscountKind,
  DiscountScope,
} from "@/lib/validation/discount";

interface InitialValues {
  id?: string;
  title: string;
  description: string;
  code: string;
  kind: DiscountKind;
  value: number;
  scope: DiscountScope;
  productId: string | null;
  categoryId: string | null;
  minSubtotalCents: number | null;
  maxUses: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface Option {
  id: string;
  title: string;
}

interface Props {
  mode: "create" | "edit";
  initial: InitialValues;
  products: Option[];
  categories: Option[];
}

const SCOPE_OPTIONS: { value: DiscountScope; label: string; hint: string }[] = [
  { value: "order", label: "Whole order", hint: "Applies to the cart subtotal" },
  { value: "product", label: "Specific product", hint: "Applies to one product only" },
  { value: "category", label: "Whole category", hint: "Applies to every product in a category" },
];

export function DiscountForm({ mode, initial, products, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function patch<K extends keyof InitialValues>(
    key: K,
    value: InitialValues[K],
  ) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      ...state,
      code: state.code.trim() || undefined,
      description: state.description || undefined,
      productId: state.scope === "product" ? state.productId : null,
      categoryId: state.scope === "category" ? state.categoryId : null,
      startsAt: state.startsAt
        ? new Date(state.startsAt).toISOString()
        : undefined,
      endsAt: state.endsAt ? new Date(state.endsAt).toISOString() : undefined,
    };

    startTransition(async () => {
      const result: ActionResult<{ id: string }> | ActionResult =
        mode === "create"
          ? await createDiscount(payload)
          : await updateDiscount({ ...payload, id: initial.id });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (mode === "create" && "data" in result && result.data) {
        router.push(`/admin/discounts/${result.data.id}`);
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
          <Field label="Title" hint="Internal name. Customers don't see this." error={fieldErrors.title}>
            <Input
              value={state.title}
              onChange={(e) => patch("title", e.target.value)}
              required
              placeholder="Eid 20% off whey"
            />
          </Field>
          <Field
            label="Coupon code"
            hint="Leave empty for an auto-applied discount. Customers will enter this code at checkout."
            error={fieldErrors.code}
          >
            <Input
              value={state.code}
              onChange={(e) =>
                patch(
                  "code",
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_-]/g, ""),
                )
              }
              placeholder="EID20"
            />
          </Field>
          <Field label="Internal description (optional)">
            <textarea
              value={state.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Notes for your team"
            />
          </Field>
        </Section>

        <Section title="Discount">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <Field label="Type">
              <select
                value={state.kind}
                onChange={(e) => patch("kind", e.target.value as DiscountKind)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </Field>
            <Field
              label={
                state.kind === "percent" ? "Percent (1–100)" : "Amount (Rs.)"
              }
              hint={
                state.kind === "fixed"
                  ? "Discount amount in rupees. Decimals allowed."
                  : undefined
              }
              error={fieldErrors.value}
            >
              <Input
                type="number"
                min={state.kind === "percent" ? 1 : 0.01}
                step={state.kind === "percent" ? 1 : 0.01}
                max={state.kind === "percent" ? 100 : undefined}
                value={
                  state.kind === "percent"
                    ? state.value
                    : (state.value / 100).toString()
                }
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (!Number.isFinite(raw)) return;
                  patch(
                    "value",
                    state.kind === "percent"
                      ? Math.max(1, Math.round(raw))
                      : Math.max(1, Math.round(raw * 100)),
                  );
                }}
                required
              />
            </Field>
          </div>

          <Field label="Applies to" hint="Where the discount is calculated.">
            <div className="grid gap-2 sm:grid-cols-3">
              {SCOPE_OPTIONS.map((s) => (
                <label
                  key={s.value}
                  className={`cursor-pointer rounded-md border p-3 text-sm ${
                    state.scope === s.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value={s.value}
                    checked={state.scope === s.value}
                    onChange={() => patch("scope", s.value)}
                    className="sr-only"
                  />
                  <span className="block font-medium">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.hint}</span>
                </label>
              ))}
            </div>
          </Field>

          {state.scope === "product" && (
            <Field label="Product" error={fieldErrors.productId}>
              <select
                value={state.productId ?? ""}
                onChange={(e) => patch("productId", e.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                required
              >
                <option value="">— Pick a product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {state.scope === "category" && (
            <Field label="Category" error={fieldErrors.categoryId}>
              <select
                value={state.categoryId ?? ""}
                onChange={(e) => patch("categoryId", e.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                required
              >
                <option value="">— Pick a category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Section>

        <Section title="Limits">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Minimum subtotal (Rs.)"
              hint="Optional. Cart must be at least this much."
            >
              <Input
                type="number"
                min={0}
                step={0.01}
                value={
                  state.minSubtotalCents == null
                    ? ""
                    : (state.minSubtotalCents / 100).toString()
                }
                onChange={(e) =>
                  patch(
                    "minSubtotalCents",
                    e.target.value
                      ? Math.round(Number(e.target.value) * 100)
                      : null,
                  )
                }
                placeholder="—"
              />
            </Field>
            <Field
              label="Max total uses"
              hint="Optional. Caps how many times this can be applied across the store."
            >
              <Input
                type="number"
                min={1}
                value={state.maxUses ?? ""}
                onChange={(e) =>
                  patch(
                    "maxUses",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="—"
              />
            </Field>
            <Field label="Starts at (optional)">
              <Input
                type="datetime-local"
                value={state.startsAt}
                onChange={(e) => patch("startsAt", e.target.value)}
              />
            </Field>
            <Field label="Ends at (optional)" error={fieldErrors.endsAt}>
              <Input
                type="datetime-local"
                value={state.endsAt}
                onChange={(e) => patch("endsAt", e.target.value)}
              />
            </Field>
          </div>
        </Section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={state.isActive}
              onChange={(e) => patch("isActive", e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">
              <span className="block font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">
                Even active discounts only apply within their date window.
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
            {mode === "create" ? "Create discount" : "Save changes"}
          </Button>
          <Link
            href="/admin/discounts"
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
