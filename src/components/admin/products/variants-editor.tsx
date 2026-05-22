"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertVariants } from "@/server/actions/products";

export interface VariantRow {
  id?: string;
  sku: string;
  title: string;
  option1: string;
  option2: string;
  option3: string;
  priceCents: number;
  compareAtCents?: number;
  currency: string;
  inventoryQty: number;
  inventoryPolicy: "deny" | "continue";
  position: number;
}

interface Props {
  productId: string;
  initial: VariantRow[];
}

function blankVariant(position: number): VariantRow {
  return {
    title: "Default",
    sku: "",
    option1: "",
    option2: "",
    option3: "",
    priceCents: 0,
    currency: "PKR",
    inventoryQty: 0,
    inventoryPolicy: "deny",
    position,
  };
}

export function VariantsEditor({ productId, initial }: Props) {
  const [rows, setRows] = useState<VariantRow[]>(
    initial.length > 0 ? initial : [blankVariant(0)],
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function update(i: number, patch: Partial<VariantRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function add() {
    setRows((r) => [...r, blankVariant(r.length)]);
  }

  function remove(i: number) {
    setRows((r) => {
      if (r.length <= 1) return r;
      return r.filter((_, idx) => idx !== i).map((row, idx) => ({ ...row, position: idx }));
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const payload = {
        productId,
        variants: rows.map((r, i) => ({
          ...r,
          sku: r.sku || undefined,
          option1: r.option1 || undefined,
          option2: r.option2 || undefined,
          option3: r.option3 || undefined,
          position: i,
        })),
      };
      const result = await upsertVariants(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedAt(new Date());
    });
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Variants
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One row per buyable option (size, flavor, bundle, etc).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add variant
        </Button>
      </header>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-2 py-2 text-left">Title</th>
              <th className="px-2 py-2 text-left">SKU</th>
              <th className="px-2 py-2 text-left">Option 1</th>
              <th className="px-2 py-2 text-left">Option 2</th>
              <th className="px-2 py-2 text-right">Price (cents)</th>
              <th className="px-2 py-2 text-right">Compare-at</th>
              <th className="px-2 py-2 text-right">Inventory</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id ?? `new-${i}`} className="border-t">
                <td className="px-2 py-1.5">
                  <Input
                    value={row.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="2kg · Chocolate"
                    className="h-9"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.sku}
                    onChange={(e) => update(i, { sku: e.target.value })}
                    placeholder="ISO-WHEY-2KG"
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.option1}
                    onChange={(e) => update(i, { option1: e.target.value })}
                    placeholder="Chocolate"
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.option2}
                    onChange={(e) => update(i, { option2: e.target.value })}
                    placeholder="2kg"
                    className="h-9"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.priceCents}
                    onChange={(e) =>
                      update(i, { priceCents: Number(e.target.value) || 0 })
                    }
                    className="h-9 text-right tabular-nums"
                    required
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.compareAtCents ?? ""}
                    onChange={(e) =>
                      update(i, {
                        compareAtCents: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="—"
                    className="h-9 text-right tabular-nums"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.inventoryQty}
                    onChange={(e) =>
                      update(i, { inventoryQty: Number(e.target.value) || 0 })
                    }
                    className="h-9 text-right tabular-nums"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={rows.length === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    aria-label="Remove variant"
                    title="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {error && (
          <span role="alert" className="text-xs text-destructive">
            {error}
          </span>
        )}
        {savedAt && !error && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
        <Button type="button" onClick={save} disabled={pending} className="gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save variants
        </Button>
      </div>
    </section>
  );
}
