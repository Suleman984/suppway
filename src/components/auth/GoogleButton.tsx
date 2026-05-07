"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/server/actions/auth";

export function GoogleButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await signInWithGoogle(next);
      if (res.ok && "url" in res && res.url) {
        window.location.href = res.url;
        return;
      }
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={onClick} loading={pending}>
        <GoogleIcon />
        Continue with Google
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.35 11.1H12v3.78h5.32c-.23 1.49-1.7 4.36-5.32 4.36-3.2 0-5.81-2.65-5.81-5.92S8.8 7.4 12 7.4c1.83 0 3.05.78 3.75 1.45l2.55-2.46C16.7 4.95 14.55 4 12 4 6.92 4 2.85 8.07 2.85 13.32S6.92 22.64 12 22.64c6.92 0 9.5-4.85 9.5-7.94 0-.53-.06-.93-.15-1.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
