"use client";

import Link from "next/link";
import { useRef } from "react";
import { Plus, Star } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";

interface Product {
  slug: string;
  name: string;
  category: string;
  flavor: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  gradient: string;
  short: string;
  /** Big readable mark stamped on the bottle */
  mark: string;
}

const PRODUCTS: Product[] = [
  {
    slug: "iso-whey-2kg",
    name: "Iso-Whey 2kg",
    category: "Protein",
    flavor: "Belgian Chocolate",
    price: 8499,
    oldPrice: 9999,
    rating: 4.9,
    reviews: 412,
    badge: "Bestseller",
    gradient: "linear-gradient(155deg, #ff3b3b 0%, #2a0000 100%)",
    short: "27g protein · 1g sugar · ultra-filtered isolate. Mixes clean in cold water.",
    mark: "ISO",
  },
  {
    slug: "creapure-300g",
    name: "Creapure® 300g",
    category: "Creatine",
    flavor: "Unflavored",
    price: 3299,
    rating: 4.95,
    reviews: 188,
    gradient: "linear-gradient(155deg, #00d4ff 0%, #00131c 100%)",
    short: "Pure German monohydrate. Micronised. 60 servings of 5g, no taste.",
    mark: "MONO",
  },
  {
    slug: "savage-pre",
    name: "Savage Pre-Workout",
    category: "Pre-Workout",
    flavor: "Sour Watermelon",
    price: 4799,
    oldPrice: 5499,
    rating: 4.8,
    reviews: 267,
    badge: "New",
    gradient: "linear-gradient(155deg, #ffae00 0%, #2a1c00 100%)",
    short: "L-citrulline 8g · beta-alanine 3.2g · caffeine 250mg. No proprietary blends.",
    mark: "PRE",
  },
  {
    slug: "omega3-1500",
    name: "Omega-3 1500mg",
    category: "Vitamins",
    flavor: "120 softgels",
    price: 2499,
    rating: 4.85,
    reviews: 96,
    gradient: "linear-gradient(155deg, #a855f7 0%, #15052a 100%)",
    short: "EPA + DHA. Reflux-free, lemon-coated softgels. 60-day supply.",
    mark: "OMEGA",
  },
];

export function Bestsellers() {
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
          {PRODUCTS.map((p) => (
            <article
              key={p.slug}
              className="bs-card group relative isolate flex h-[480px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-[transform,border-color] duration-500 hover:-translate-y-2 hover:border-white/30"
            >
              {/* Product hero — gradient with stamped mark */}
              <Link
                href={`/product/${p.slug}`}
                prefetch
                className="relative block h-full w-full overflow-hidden"
                style={{ background: p.gradient }}
                aria-label={p.name}
              >
                {p.badge && (
                  <span className="absolute left-4 top-4 z-20 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-900">
                    {p.badge}
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center text-[10rem] font-black uppercase leading-none tracking-tight text-white/[0.08] transition-transform duration-700 group-hover:scale-110"
                >
                  {p.mark}
                </span>
                <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
                    {p.category}
                  </p>
                  <p className="mt-2 text-3xl font-black uppercase leading-none">
                    {p.name.split(" ")[0]}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Link>

              {/* Slide-up info panel — covers the bottom on hover */}
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
                  <span className="text-xl font-black">PKR {p.price.toLocaleString()}</span>
                  {p.oldPrice && (
                    <span className="text-xs text-white/35 line-through">
                      PKR {p.oldPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-white/70">{p.short}</p>

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
