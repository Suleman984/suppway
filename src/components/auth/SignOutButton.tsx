"use client";

import { useTransition } from "react";
import { signOut } from "@/server/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={className ?? "text-sm text-muted-foreground hover:text-foreground hover:underline"}
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
