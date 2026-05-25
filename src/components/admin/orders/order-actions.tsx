"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  cancelOrder,
  fulfillOrder,
  markOrderPaid,
  refundOrder,
} from "@/server/actions/orders";

interface Props {
  orderId: string;
  status: string;
  permissions: {
    update: boolean;
    cancel: boolean;
    refund: boolean;
  };
  /**
   * `default` — used on the order detail page, shows the partial-refund
   * form and status/error banners inline.
   * `compact` — used on the orders list rows, shows only the simple
   * one-click actions (paid, fulfill, cancel) with no inline form or
   * banner. Refund happens on the detail page where the form lives.
   */
  variant?: "default" | "compact";
  /** Order total + already-refunded — used to default the refund amount. */
  totalCents?: number;
  refundedCents?: number;
  currency?: string;
}

type ActionFn = () => Promise<{ ok: boolean; error?: string; message?: string }>;

export function OrderActions({
  orderId,
  status,
  permissions,
  variant = "default",
  totalCents = 0,
  refundedCents = 0,
  currency = "PKR",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);

  function run(fn: ActionFn) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Action failed");
      else if (r.message) setInfo(r.message);
    });
  }

  const isCanceled = status === "canceled";
  const isRefunded = status === "refunded";
  const canMarkPaid =
    permissions.update && (status === "pending" || status === "failed");
  const canFulfill = permissions.update && status === "paid";
  const canCancel =
    permissions.cancel && (status === "pending" || status === "paid");
  const canRefund =
    permissions.refund &&
    (status === "paid" ||
      status === "fulfilled" ||
      status === "partially_refunded");

  const compact = variant === "compact";
  const remaining = Math.max(0, totalCents - refundedCents);

  return (
    <div className={compact ? "" : "space-y-3"}>
      <div className="flex flex-wrap gap-2">
        {canMarkPaid && (
          <ActionButton
            onClick={() => run(() => markOrderPaid({ id: orderId }))}
            icon={<Wallet className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="primary"
            compact={compact}
          >
            {compact ? "Paid" : "Mark paid"}
          </ActionButton>
        )}
        {canFulfill && (
          <ActionButton
            onClick={() => run(() => fulfillOrder({ id: orderId }))}
            icon={<Truck className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="primary"
            compact={compact}
          >
            {compact ? "Fulfill" : "Mark fulfilled"}
          </ActionButton>
        )}
        {canCancel && (
          <ActionButton
            onClick={() => {
              if (!confirm("Cancel this order? Inventory will be restocked and the customer notified.")) return;
              run(() => cancelOrder({ id: orderId }));
            }}
            icon={<XCircle className="h-3.5 w-3.5" />}
            disabled={pending}
            compact={compact}
          >
            Cancel
          </ActionButton>
        )}
        {canRefund && !compact && (
          <ActionButton
            onClick={() => setRefundOpen((v) => !v)}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="danger"
          >
            {refundOpen ? "Close refund" : "Refund"}
          </ActionButton>
        )}
        {!compact && (isCanceled || isRefunded) && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            No further actions
          </span>
        )}
        {!compact && pending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
          </span>
        )}
      </div>

      {refundOpen && canRefund && !compact && (
        <RefundForm
          remaining={remaining}
          currency={currency}
          pending={pending}
          onSubmit={(amountCents, reason) => {
            run(() => refundOrder({ id: orderId, amountCents, reason }));
            setRefundOpen(false);
          }}
        />
      )}

      {!compact && error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {!compact && info && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          {info}
        </p>
      )}
      {compact && error && (
        <p
          role="alert"
          className="mt-1 truncate text-[11px] text-destructive"
          title={error}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function RefundForm({
  remaining,
  currency,
  pending,
  onSubmit,
}: {
  remaining: number;
  currency: string;
  pending: boolean;
  onSubmit: (amountCents: number, reason: string | null) => void;
}) {
  const [amount, setAmount] = useState((remaining / 100).toString());
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    const cents = Math.round(n * 100);
    if (cents > remaining) return;
    if (
      !confirm(
        `Refund ${currency} ${(cents / 100).toLocaleString("en-PK")}? Loyalty points will reverse proportionally.`,
      )
    )
      return;
    onSubmit(cents, reason.trim() || null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
    >
      <p className="text-xs text-muted-foreground">
        Remaining refundable:{" "}
        <span className="font-bold text-foreground">
          {currency} {(remaining / 100).toLocaleString("en-PK")}
        </span>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-muted-foreground">
            Amount ({currency})
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max={remaining / 100}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-muted-foreground">
            Reason (optional, shown to customer)
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="e.g. Damaged item"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !amount}
          className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Issue refund
        </button>
      </div>
    </form>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
  disabled,
  tone = "default",
  compact = false,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
  compact?: boolean;
}) {
  const cls =
    tone === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : tone === "danger"
        ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
        : "border border-input bg-background hover:bg-accent";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md font-medium transition disabled:opacity-50 ${
        compact ? "h-7 px-2 text-[11px]" : "h-9 px-3 text-xs"
      } ${cls}`}
    >
      {icon}
      {children}
    </button>
  );
}
