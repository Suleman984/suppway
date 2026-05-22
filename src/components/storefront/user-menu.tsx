"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/server/actions/auth";

interface MenuState {
  loading: boolean;
  user: { id: string; email: string | null } | null;
  isStaff: boolean;
}

/**
 * Auth-aware user widget for the storefront nav. Logged out → "Sign in".
 * Logged in → avatar + dropdown (account, admin link if staff, sign out).
 *
 * Loads the user via the browser client, then subscribes to
 * onAuthStateChange so the menu stays accurate without a hard refresh
 * — covers cross-tab sign-out, token refresh failures, and re-auth.
 */
export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<MenuState>({
    loading: true,
    user: null,
    isStaff: false,
  });
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setState({ loading: false, user: null, isStaff: false });
        return;
      }
      const { data: staff } = await supabase
        .from("staff")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (cancelled) return;
      setState({
        loading: false,
        user: { id: user.id, email: user.email ?? null },
        isStaff: Boolean(staff),
      });
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Any sign-in or sign-out — even from another tab — invalidates the
      // current server-rendered tree, so we refresh and re-read the user.
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        load();
        router.refresh();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    startTransition(async () => {
      await signOut();
    });
  }

  // Skeleton while we resolve auth state — invisible button reserves
  // the layout slot so the navbar doesn't reflow when state arrives.
  if (state.loading) {
    return (
      <div
        aria-hidden
        className="h-10 w-10 animate-pulse rounded-full border border-white/10 bg-white/5"
      />
    );
  }

  if (!state.user) {
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link
        href={`/login${next}`}
        prefetch
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 px-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </Link>
    );
  }

  const initial =
    state.user.email?.charAt(0).toUpperCase() ??
    state.user.email?.charAt(0).toUpperCase() ??
    "U";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#ff3b3b]/20 text-sm font-black text-white transition hover:bg-[#ff3b3b]/35"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-bold">
              {state.user.email ?? "Account"}
            </p>
            {state.isStaff && (
              <span className="mt-2 inline-flex rounded-full bg-[#ff3b3b]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#ff3b3b]">
                Staff
              </span>
            )}
          </div>
          <nav className="flex flex-col py-1.5 text-sm">
            <MenuLink
              href="/account"
              icon={<UserIcon className="h-4 w-4" />}
              label="My account"
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href="/account?tab=orders"
              icon={<Package className="h-4 w-4" />}
              label="Orders"
              onClick={() => setOpen(false)}
            />
            {state.isStaff && (
              <MenuLink
                href="/admin/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Admin dashboard"
                onClick={() => setOpen(false)}
              />
            )}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={pending}
              className="flex items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-white/85 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              {pending ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      prefetch
      role="menuitem"
      className="flex items-center gap-3 px-4 py-2.5 text-white/85 transition hover:bg-white/5 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
