"use client";

import NextLink, { type LinkProps } from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Client-side store-context provider + helpers.
 *
 * Mirror of the server-side `storeLink()` in `@/lib/store/active`. The slug
 * is set once at the layout level (RSC) and read by client components via
 * `useStoreLink()`.
 */

const GLOBAL_PREFIXES = [
  "/login",
  "/signup",
  "/logout",
  "/auth/",
  "/onboarding/",
  "/api/",
  "/_next/",
];

function isGlobalPath(path: string): boolean {
  if (/^https?:\/\//i.test(path)) return true;
  if (path.startsWith("#")) return true;
  if (path === "/" || path === "") return false;
  return GLOBAL_PREFIXES.some((p) => path === p || path.startsWith(p));
}

interface StoreSlugCtx {
  slug: string;
}

const Ctx = createContext<StoreSlugCtx>({ slug: "main" });

export function StoreSlugProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ slug }), [slug]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Returns a function that prefixes a path with the active store's slug
 * (when not "main") and leaves global paths untouched.
 */
export function useStoreLink(): (path: string) => string {
  const { slug } = useContext(Ctx);
  return (path: string) => {
    if (!path.startsWith("/") && !path.startsWith("#")) path = "/" + path;
    if (isGlobalPath(path)) return path;
    if (slug === "main") return path;
    return `/s/${slug}${path === "/" ? "" : path}`;
  };
}

/**
 * Drop-in replacement for `next/link` that auto-prefixes the `href`.
 *
 *   import { StoreLink as Link } from "@/lib/store/link";
 *   <Link href="/products">…</Link>
 */
type StoreLinkProps = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    children?: ReactNode;
  };

export function StoreLink({ href, ...rest }: StoreLinkProps) {
  const link = useStoreLink();
  return <NextLink href={link(href)} {...rest} />;
}

export default StoreLink;
