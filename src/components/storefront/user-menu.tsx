"use client";

import Link from "@/lib/store/link";
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

export interface MenuUser {
  id: string;
  email: string | null;
  isStaff: boolean;
}

interface MenuState {
  loading: boolean;
  user: MenuUser | null;
}

/**
 * Auth-aware user widget for the storefront nav. Logged out → "Sign in".
 * Logged in → avatar + dropdown (account, admin link if staff, sign out).
 *
 * Initial state comes from the server (`initialUser` prop) because the
 * Supabase auth cookies are httpOnly and the browser-side client can't
 * read them. The browser client is still used to *subscribe* to
 * onAuthStateChange so the menu reacts to cross-tab sign-out and to
 * sign-in events that happen after first paint — but the source of
 * truth for the initial render is the server.
 */
export function UserMenu({ initialUser = null }: { initialUser?: MenuUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<MenuState>({
    loading: false,
    user: initialUser,
  });
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // We trust the server-rendered prop for the *current* user identity.
      // Auth events just mean "something changed" — bounce a refresh so
      // the server re-renders this component with fresh initial state.
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        // Optimistic local update so the avatar/menu flips immediately
        // (without waiting for the router refresh round-trip).
        if (event === "SIGNED_OUT") {
          setState({ loading: false, user: null });
        }
        router.refresh();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Whenever the server hands us a new `initialUser` (after a router
  // refresh triggered by SessionWatcher / UserMenu itself), adopt it.
  useEffect(() => {
    setState({ loading: false, user: initialUser });
  }, [initialUser]);

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

  const initial = state.user.email?.charAt(0).toUpperCase() ?? "U";

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
            {state.user.isStaff && (
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
            {state.user.isStaff && (
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
