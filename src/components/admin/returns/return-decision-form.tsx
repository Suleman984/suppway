"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, X, RefreshCcw } from "lucide-react";
import { decideReturn } from "@/server/actions/returns";

interface Props {
  requestId: string;
  type: "refund" | "exchange";
  remainingCents: number;
  currency: string;
}

type Mode = "refund" | "exchange" | "deny" | null;

export function ReturnDecisionForm({
  requestId,
  type,
  remainingCents,
  currency,
}: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [amount, setAmount] = useState((remainingCents / 100).toString());
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(outcome: "refund" | "exchange" | "deny") {
    setError(null);
    const payload: {
      id: string;
      outcome: "refund" | "exchange" | "deny";
      refundAmountCents?: number;
      adminNotes?: string | null;
    } = {
      id: requestId,
      outcome,
      adminNotes: notes.trim() || null,
    };
    if (outcome === "refund") {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Enter a refund amount.");
        return;
      }
      const cents = Math.round(n * 100);
      if (cents > remainingCents) {
        setError(`Cannot refund more than ${currency} ${(remainingCents / 100).toLocaleString("en-PK")}.`);
        return;
      }
      payload.refundAmountCents = cents;
    }
    if (outcome === "deny" && !notes.trim()) {
      setError("Add a short note so the customer knows why.");
      return;
    }
    if (
      !confirm(
        outcome === "deny"
          ? "Deny this request? The customer will be emailed."
          : outcome === "refund"
            ? `Refund ${currency} ${(payload.refundAmountCents! / 100).toLocaleString("en-PK")} to the customer?`
            : "Approve as exchange? You'll handle shipping separately.",
      )
    )
      return;
    startTransition(async () => {
      const result = await decideReturn(payload);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Decide
      </h2>
      <p className="text-xs text-muted-foreground">
        Customer asked for a <strong>{type}</strong>. You can approve as
        either path or deny.
      </p>

      <div className="flex flex-wrap gap-2">
        <ModeButton
          active={mode === "refund"}
          onClick={() => setMode("refund")}
          icon={<RefreshCcw className="h-3.5 w-3.5" />}
          tone="primary"
        >
          Approve refund
        </ModeButton>
        <ModeButton
          active={mode === "exchange"}
          onClick={() => setMode("exchange")}
          icon={<Check className="h-3.5 w-3.5" />}
          tone="primary"
        >
          Approve exchange
        </ModeButton>
        <ModeButton
          active={mode === "deny"}
          onClick={() => setMode("deny")}
          icon={<X className="h-3.5 w-3.5" />}
          tone="danger"
        >
          Deny
        </ModeButton>
      </div>

      {mode === "refund" && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Refund amount ({currency})
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max={remainingCents / 100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Max {currency} {(remainingCents / 100).toLocaleString("en-PK")} remaining.
          </p>
        </label>
      )}

      {mode && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Note to customer{mode === "deny" ? "" : " (optional)"}
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={
              mode === "deny"
                ? "Why are we declining?"
                : "Anything else the customer should know"
            }
            className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
          />
        </label>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {mode && (
        <button
          type="button"
          onClick={() => submit(mode)}
          disabled={pending}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Confirm {mode}
        </button>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  tone: "primary" | "danger";
}) {
  const base = "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition";
  const inactive =
    tone === "danger"
      ? "border border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
      : "border border-input bg-background hover:bg-accent";
  const activeCls =
    tone === "danger"
      ? "bg-destructive text-destructive-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeCls : inactive}`}
    >
      {icon}
      {children}
    </button>
  );
}
