"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Menu, X, ShoppingBag } from "lucide-react";
import { BRAND } from "@/lib/brand";

const LINKS = [
  { href: "#supplements", label: "Supplements" },
  { href: "/collection/apparel", label: "Apparel" },
  { href: "/collection/equipment", label: "Equipment" },
  { href: "#programs", label: "Coaching" },
  { href: "/account", label: "Account" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.from(navRef.current, {
      y: -32,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    });
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      ref={navRef}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-black/80 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          prefetch
          className="flex items-center gap-2 text-base font-black uppercase tracking-tight text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#ff3b3b] text-sm font-black">
            S
          </span>
          <span className="hidden sm:inline">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={l.href.startsWith("/")}
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            prefetch
            aria-label="Cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3b3b] text-[10px] font-bold">
              0
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-x-0 top-16 z-40 h-[calc(100vh-4rem)] overflow-y-auto bg-[#070707] transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="container flex flex-col gap-2 py-8">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={l.href.startsWith("/")}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 py-4 text-2xl font-black uppercase tracking-tight text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
