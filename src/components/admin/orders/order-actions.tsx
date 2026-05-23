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
}

export function OrderActions({ orderId, status, permissions }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function run(name: string, fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
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
  const canMarkPaid = permissions.update && (status === "pending" || status === "failed");
  const canFulfill = permissions.update && status === "paid";
  const canCancel =
    permissions.cancel && (status === "pending" || status === "paid");
  const canRefund =
    permissions.refund && (status === "paid" || status === "fulfilled" || status === "partially_refunded");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canMarkPaid && (
          <ActionButton
            onClick={() => run("paid", () => markOrderPaid(orderId))}
            icon={<Wallet className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="primary"
          >
            Mark paid
          </ActionButton>
        )}
        {canFulfill && (
          <ActionButton
            onClick={() => run("fulfill", () => fulfillOrder(orderId))}
            icon={<Truck className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="primary"
          >
            Mark fulfilled
          </ActionButton>
        )}
        {canCancel && (
          <ActionButton
            onClick={() => {
              if (!confirm("Cancel this order?")) return;
              run("cancel", () => cancelOrder(orderId));
            }}
            icon={<XCircle className="h-3.5 w-3.5" />}
            disabled={pending}
          >
            Cancel
          </ActionButton>
        )}
        {canRefund && (
          <ActionButton
            onClick={() => {
              if (!confirm("Refund this order? Loyalty points will reverse.")) return;
              run("refund", () => refundOrder(orderId));
            }}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            disabled={pending}
            tone="danger"
          >
            Refund
          </ActionButton>
        )}
        {(isCanceled || isRefunded) && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            No further actions
          </span>
        )}
        {pending && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
          </span>
        )}
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
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
  disabled,
  tone = "default",
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
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
      className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition disabled:opacity-50 ${cls}`}
    >
      {icon}
      {children}
    </button>
  );
}
