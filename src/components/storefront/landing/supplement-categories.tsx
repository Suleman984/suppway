"use client";

import Link from "@/lib/store/link";
import { useRef } from "react";
import { ArrowUpRight, Dumbbell, FlaskConical, Flame, Pill, Wheat, Zap } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";

interface Category {
  slug: string;
  name: string;
  blurb: string;
  icon: typeof Dumbbell;
  accent: string;
  /** Headline number that lives on the card front */
  stat: string;
  /** Label for the stat */
  statLabel: string;
}

const CATEGORIES: Category[] = [
  {
    slug: "protein",
    name: "Protein",
    blurb: "Whey isolate, casein and plant-based blends. 24–30g per serve, no soy fillers, mixes clean in cold water.",
    icon: Dumbbell,
    accent: "#ff3b3b",
    stat: "27g",
    statLabel: "protein per scoop",
  },
  {
    slug: "creatine",
    name: "Creatine",
    blurb: "Creapure® monohydrate — the most studied supplement in sports science. 5g daily, 60-day tub, micronised.",
    icon: FlaskConical,
    accent: "#00d4ff",
    stat: "5g",
    statLabel: "daily dose, 60 servings",
  },
  {
    slug: "pre-workout",
    name: "Pre-Workout",
    blurb: "L-citrulline 8g, beta-alanine 3.2g, caffeine 250mg. Fully dosed, transparent label, no proprietary blends.",
    icon: Zap,
    accent: "#ffae00",
    stat: "250mg",
    statLabel: "caffeine — clean energy",
  },
  {
    slug: "fat-burners",
    name: "Fat Burners",
    blurb: "Stim and stim-free options. Green tea catechins, L-carnitine, no banned compounds, no shaky overdose blends.",
    icon: Flame,
    accent: "#ff6b35",
    stat: "0",
    statLabel: "banned substances",
  },
  {
    slug: "vitamins",
    name: "Vitamins",
    blurb: "Multivitamins, Omega-3 1500mg, Vitamin D3+K2, ZMA. Daily insurance for hard trainers.",
    icon: Pill,
    accent: "#a855f7",
    stat: "12",
    statLabel: "daily essentials",
  },
  {
    slug: "mass-gainers",
    name: "Mass Gainers",
    blurb: "Clean-calorie blends for hardgainers. 600–1200 kcal per serve from real oats, whey and MCT — no junk sugar.",
    icon: Wheat,
    accent: "#22c55e",
    stat: "1200",
    statLabel: "kcal per serve",
  },
];

export function SupplementCategories() {
  const root = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".cat-eyebrow",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    },
    {
      selector: ".cat-title",
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".cat-lead",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".cat-card",
      from: { opacity: 0, y: 60 },
      to: { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      stagger: { each: 0.08, from: "start" },
      batch: true,
    },
  ]);

  return (
    <section
      ref={root}
      id="supplements"
      className="relative overflow-hidden bg-[#070707] py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="container relative">
        <div className="max-w-3xl">
          <p className="cat-eyebrow text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Supplements
          </p>
          <h2 className="cat-title mt-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl">
            Built around what actually works
          </h2>
          <p className="cat-lead mt-5 text-lg text-white/65">
            Six core categories. Hover any card to see the spec. Every product is
            third-party tested for purity and potency, with full label
            transparency — no proprietary blends.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <FlipCard key={c.slug} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlipCard({ category: c }: { category: Category }) {
  const Icon = c.icon;

  return (
    <div className="cat-card group h-[320px]" style={{ perspective: "1200px" }}>
      <div
        className="relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
      >
        {/* FRONT */}
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm [backface-visibility:hidden]">
          <span
            aria-hidden
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-15 blur-2xl"
            style={{ background: c.accent }}
          />
          <div className="relative flex items-start justify-between">
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: `${c.accent}26`, color: c.accent }}
            >
              <Icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              0{CATEGORIES.indexOf(c) + 1}
            </span>
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">
              Category
            </p>
            <h3 className="mt-2 text-3xl font-black uppercase leading-none tracking-tight">
              {c.name}
            </h3>
            <div className="mt-5 flex items-baseline gap-3 border-t border-white/10 pt-4">
              <span className="text-3xl font-black" style={{ color: c.accent }}>
                {c.stat}
              </span>
              <span className="text-xs uppercase tracking-wider text-white/55">
                {c.statLabel}
              </span>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl p-7 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            background: `linear-gradient(140deg, ${c.accent} 0%, rgba(0,0,0,0.85) 100%)`,
          }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
              {c.name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/95">{c.blurb}</p>
          </div>
          <Link
            href={`/products?kind=supplement&cat=${c.slug}`}
            prefetch
            className="group/cta inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-widest text-neutral-900 transition hover:bg-neutral-100"
          >
            Shop {c.name}
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover/cta:rotate-45"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
