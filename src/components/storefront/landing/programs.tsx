"use client";

import Link from "next/link";
import { useRef } from "react";
import { Check } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";

const PROGRAMS = [
  {
    name: "Foundation 8",
    weeks: 8,
    level: "Beginner",
    price: 4999,
    perks: [
      "3 sessions / week, full-body",
      "Form video for every lift",
      "WhatsApp coach access",
      "Macro & meal blueprint",
    ],
    accent: "#22c55e",
  },
  {
    name: "Hypertrophy 12",
    weeks: 12,
    level: "Intermediate",
    price: 8999,
    perks: [
      "5-day push/pull/legs split",
      "Auto-regulated volume blocks",
      "Bi-weekly check-ins",
      "Supplement stack guide",
    ],
    accent: "#ff3b3b",
    featured: true,
  },
  {
    name: "Powerbuild 16",
    weeks: 16,
    level: "Advanced",
    price: 14999,
    perks: [
      "Conjugate-style training",
      "1:1 monthly video call",
      "Competition prep option",
      "Custom diet phase",
    ],
    accent: "#00d4ff",
  },
];

export function Programs() {
  const root = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".pg-eyebrow",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    },
    {
      selector: ".pg-title",
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".pg-lead",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".pg-card",
      from: { opacity: 0, y: 60, scale: 0.94 },
      to: { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" },
      stagger: 0.12,
      batch: true,
    },
  ]);

  return (
    <section
      ref={root}
      id="programs"
      className="relative overflow-hidden bg-[#070707] py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#ff3b3b] opacity-10 blur-3xl"
      />
      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="pg-eyebrow text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            Coaching
          </p>
          <h2 className="pg-title mt-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl">
            Pick your path. We&apos;ll do the planning.
          </h2>
          <p className="pg-lead mt-5 text-lg text-white/65">
            Three protocols built around different starting points. Your stack is
            included — every program ships with a supplement plan tuned to the
            week&apos;s training load.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <div
              key={p.name}
              className={`pg-card group relative isolate flex flex-col overflow-hidden rounded-3xl border p-8 transition-[transform,border-color] duration-500 hover:-translate-y-2 ${
                p.featured
                  ? "border-[#ff3b3b]/50 bg-gradient-to-br from-[#ff3b3b] to-[#7a0000] text-white"
                  : "border-white/10 bg-white/[0.03] text-white hover:border-transparent"
              }`}
              style={
                {
                  ["--accent" as string]: p.accent,
                } as React.CSSProperties
              }
            >
              {!p.featured && (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 translate-y-full bg-[var(--accent)] transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-y-0"
                />
              )}

              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ff3b3b] shadow-lg">
                  Most popular
                </span>
              )}
              <p
                className={`text-xs font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${
                  p.featured ? "text-white/85" : "group-hover:text-white"
                }`}
                style={!p.featured ? { color: p.accent } : undefined}
              >
                {p.level}
              </p>
              <h3 className="mt-3 text-3xl font-black uppercase">{p.name}</h3>
              <p
                className={`mt-1 text-sm transition-colors duration-500 ${
                  p.featured ? "text-white/70" : "text-white/50 group-hover:text-white/85"
                }`}
              >
                {p.weeks}-week program
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-black">PKR {p.price.toLocaleString()}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 transition-colors duration-500 ${
                        p.featured ? "text-white" : "group-hover:!text-white"
                      }`}
                      style={!p.featured ? { color: p.accent } : undefined}
                      strokeWidth={3}
                    />
                    <span
                      className={`transition-colors duration-500 ${
                        p.featured ? "text-white/90" : "text-white/75 group-hover:text-white"
                      }`}
                    >
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/product/${p.name.toLowerCase().replace(/\s/g, "-")}`}
                prefetch
                className={`mt-8 inline-flex h-12 items-center justify-center rounded-full text-sm font-bold uppercase tracking-wider transition ${
                  p.featured
                    ? "bg-white text-[#ff3b3b] hover:bg-neutral-100"
                    : "bg-white text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white"
                }`}
              >
                Start {p.name.split(" ")[0]}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
