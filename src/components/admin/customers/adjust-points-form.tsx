"use client";

import { useState, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { adjustCustomerPoints } from "@/server/actions/customers";

interface Props {
  customerId: string;
  hasLogin: boolean;
}

export function AdjustPointsForm({ customerId, hasLogin }: Props) {
  const [delta, setDelta] = useState(100);
  const [direction, setDirection] = useState<"add" | "deduct">("add");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!hasLogin) {
    return (
      <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Points can only be granted to customers with a login account. This
        customer hasn&apos;t signed up yet.
      </p>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const signedDelta = direction === "add" ? Math.abs(delta) : -Math.abs(delta);
    startTransition(async () => {
      const r = await adjustCustomerPoints({
        customerId,
        delta: signedDelta,
        note: note || undefined,
      });
      if (!r.ok) setError(r.error);
      else {
        setInfo(r.message ?? "Saved");
        setNote("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="inline-flex rounded-md border">
          <button
            type="button"
            onClick={() => setDirection("add")}
            className={`inline-flex h-10 items-center gap-1 px-3 text-xs font-medium ${
              direction === "add"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Grant
          </button>
          <button
            type="button"
            onClick={() => setDirection("deduct")}
            className={`inline-flex h-10 items-center gap-1 px-3 text-xs font-medium ${
              direction === "deduct"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Minus className="h-3.5 w-3.5" /> Deduct
          </button>
        </div>
        <input
          type="number"
          min={1}
          value={delta}
          onChange={(e) => setDelta(Math.max(1, Number(e.target.value) || 0))}
          className="h-10 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason (optional)"
          maxLength={200}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Apply
        </button>
      </div>
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          {info}
        </p>
      )}
    </form>
  );
}
