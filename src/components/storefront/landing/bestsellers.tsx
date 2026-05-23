"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Plus, Star } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";
import { formatPKR } from "@/lib/catalog/products";

export interface BestsellerProduct {
  slug: string;
  name: string;
  categoryLabel: string;
  flavor: string;
  price: number;
  oldPrice?: number;
  rating: number;
  badge?: string;
  accent: string;
  short: string;
  imageUrl: string;
}

export function Bestsellers({ products }: { products: BestsellerProduct[] }) {
  const PRODUCTS = products;
  const root = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".bs-eyebrow",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    },
    {
      selector: ".bs-title",
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".bs-cta-top",
      from: { opacity: 0, y: 16 },
      to: { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
    },
    {
      selector: ".bs-card",
      from: { opacity: 0, y: 80 },
      to: { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      stagger: 0.1,
      batch: true,
    },
  ]);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#0a0a0a] py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#00d4ff] opacity-[0.05] blur-[120px]"
      />
      <div className="container relative">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="bs-eyebrow text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
              Bestsellers
            </p>
            <h2 className="bs-title mt-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl">
              The shortcut to a stronger stack
            </h2>
          </div>
          <Link
            href="/products"
            prefetch
            className="bs-cta-top group inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 text-sm font-bold uppercase tracking-wider text-white transition hover:border-[#ff3b3b] hover:bg-[#ff3b3b]"
          >
            View all
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p, i) => (
            <article
              key={p.slug}
              className="bs-card group relative isolate flex h-[480px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-[transform,border-color] duration-500 hover:-translate-y-2 hover:border-white/30"
            >
              <Link
                href={`/product/${p.slug}`}
                prefetch
                className="relative block h-full w-full overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${p.accent}55, ${p.accent}10 60%, transparent), #0c0c0c`,
                }}
                aria-label={p.name}
              >
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  priority={i < 2}
                  className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30"
                />
                {p.badge && (
                  <span
                    className={`absolute left-4 top-4 z-20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      p.badge === "Sale"
                        ? "bg-[#ff3b3b] text-white"
                        : p.badge === "Low stock"
                          ? "bg-[#ffae00] text-neutral-900"
                          : "bg-white text-neutral-900"
                    }`}
                  >
                    {p.badge}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/85">
                    {p.categoryLabel}
                  </p>
                  <p className="mt-2 text-3xl font-black uppercase leading-none">
                    {p.name.split(" ")[0]}
                  </p>
                </div>
              </Link>

              <div className="absolute inset-x-0 bottom-0 z-20 translate-y-[calc(100%-92px)] bg-[#070707]/95 px-5 pb-5 pt-4 backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-y-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{p.name}</h3>
                    <p className="text-xs text-white/55">{p.flavor}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-[#ffae00] text-[#ffae00]" />
                    <span className="font-bold">{p.rating}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black tabular-nums">
                    {formatPKR(p.price)}
                  </span>
                  {p.oldPrice && (
                    <span className="text-xs tabular-nums text-white/35 line-through">
                      {formatPKR(p.oldPrice)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  {p.short}
                </p>

                <Link
                  href={`/product/${p.slug}`}
                  prefetch
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#ff5252]"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Quick add
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
