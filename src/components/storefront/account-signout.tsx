"use client";

import { useState, useTransition } from "react";
import { LogOut, MonitorX } from "lucide-react";
import { signOut, signOutEverywhere } from "@/server/actions/auth";

/**
 * Customer-facing logout controls. "Sign out" terminates the current
 * session only (other devices stay signed in). "Sign out everywhere"
 * revokes every refresh token for this user — useful if they think a
 * device was compromised.
 */
export function AccountSignOut() {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-white">Sessions</p>
        <p className="mt-0.5 text-xs text-white/55">
          Sign out of this device, or every device this account is signed
          into.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => startTransition(() => signOut())}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
        {confirming ? (
          <div className="flex items-center gap-2 rounded-full border border-[#ff3b3b]/40 bg-[#ff3b3b]/10 px-2 text-xs">
            <span className="text-white/85">Sign out of every device?</span>
            <button
              type="button"
              onClick={() => startTransition(() => signOutEverywhere())}
              disabled={pending}
              className="rounded-full bg-[#ff3b3b] px-3 py-1.5 font-bold uppercase tracking-wider text-white hover:bg-[#ff5252] disabled:opacity-50"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-full px-2 py-1.5 text-white/65 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 px-4 text-xs font-bold uppercase tracking-wider text-[#ff3b3b] transition hover:bg-[#ff3b3b]/20 disabled:opacity-50"
          >
            <MonitorX className="h-3.5 w-3.5" />
            Sign out everywhere
          </button>
        )}
      </div>
    </div>
  );
}
