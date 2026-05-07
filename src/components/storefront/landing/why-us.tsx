"use client";

import { useRef } from "react";
import { Beaker, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";

const PILLARS = [
  {
    n: "01",
    icon: Beaker,
    title: "Lab-tested every batch",
    body: "Independent COA on every supplement run. Heavy metals, microbial, label-claim — all third-party verified. We publish the results.",
    accent: "#ff3b3b",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "Banned-substance free",
    body: "Informed-Sport aligned manufacturing. Safe for tested athletes, clean enough for your kids' protein shake. Zero compromise.",
    accent: "#00d4ff",
  },
  {
    n: "03",
    icon: Truck,
    title: "Same-day Lahore dispatch",
    body: "Order before 4 PM, your shaker tub is on the road by 6. 1–3 day delivery nationwide. Free shipping over PKR 5,000.",
    accent: "#ffae00",
  },
  {
    n: "04",
    icon: BadgeCheck,
    title: "30-day money back",
    body: "Doesn't fit your stack? Open it, try it, send it back — full refund, no awkward emails, no restocking fee.",
    accent: "#a855f7",
  },
];

export function WhyUs() {
  const root = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".why-eyebrow",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    },
    {
      selector: ".why-title",
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".why-lead",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".pillar-row",
      from: { opacity: 0, x: -60 },
      to: { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" },
      stagger: 0.12,
      batch: true,
    },
    {
      selector: ".pillar-line",
      from: { scaleX: 0, transformOrigin: "left center" },
      to: { scaleX: 1, duration: 1.1, ease: "power3.out" },
      stagger: 0.12,
      batch: true,
    },
  ]);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] via-[#070707] to-[#0a0a0a] py-20 text-white md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-[#ff3b3b] opacity-[0.06] blur-[120px]"
      />
      <div className="container relative">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Sticky title column */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <p className="why-eyebrow text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
              Why us
            </p>
            <h2 className="why-title mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
              We sell what we use ourselves.
            </h2>
            <p className="why-lead mt-6 max-w-md text-lg text-white/65">
              Every product is in a coach&apos;s locker or a member&apos;s gym bag. If it
              doesn&apos;t earn its spot in our own training, we don&apos;t list it.
            </p>
          </div>

          {/* Numbered pillars — editorial layout, no card boxes */}
          <ol className="lg:col-span-7">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.n} className="group">
                  <div className="pillar-row grid grid-cols-[auto_1fr] items-start gap-6 py-8 md:gap-10 md:py-10">
                    <span
                      className="text-5xl font-black leading-none tabular-nums transition-colors duration-500 md:text-6xl"
                      style={{ color: `${p.accent}80` }}
                    >
                      {p.n}
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <Icon
                          className="h-5 w-5"
                          style={{ color: p.accent }}
                          strokeWidth={2.5}
                        />
                        <h3 className="text-xl font-black uppercase tracking-tight md:text-2xl">
                          {p.title}
                        </h3>
                      </div>
                      <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
                        {p.body}
                      </p>
                    </div>
                  </div>
                  <div
                    className="pillar-line h-px w-full origin-left"
                    style={{
                      background: `linear-gradient(to right, ${p.accent}, transparent)`,
                    }}
                  />
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
