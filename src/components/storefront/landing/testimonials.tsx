"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Quote, Star } from "lucide-react";
import { useReveal } from "@/lib/animations/use-reveal";

const REVIEWS = [
  {
    quote:
      "Switched from imported whey to the Iso-Whey six months ago. Better recovery, no bloat, half the price. The label tells you exactly what's in it.",
    name: "Hamza R.",
    role: "Powerlifter · 3-yr member",
    accent: "#ff3b3b",
    avatar: "HR",
  },
  {
    quote:
      "Hypertrophy 12 added 4kg of lean mass in my off-season. The check-ins kept me honest — best money I've spent on training, ever.",
    name: "Sana K.",
    role: "Bikini competitor",
    accent: "#00d4ff",
    avatar: "SK",
  },
  {
    quote:
      "I'm 47 and back to bench-pressing my own bodyweight. Foundation 8 made me re-learn the basics without wrecking my shoulders.",
    name: "Bilal A.",
    role: "Returning lifter",
    accent: "#ffae00",
    avatar: "BA",
  },
  {
    quote:
      "Pre-Workout actually does what it says — clean focus, no jitters, no crash. I've stopped looking at imported brands altogether.",
    name: "Ayesha M.",
    role: "Crossfit athlete",
    accent: "#a855f7",
    avatar: "AM",
  },
  {
    quote:
      "Coaches reply on WhatsApp the same day. That alone is worth the program fee. The training plan is honestly a bonus.",
    name: "Faraz N.",
    role: "Weekend warrior",
    accent: "#22c55e",
    avatar: "FN",
  },
];

// Render the reviews four times so the track always exceeds 2× viewport even
// on ultra-wide displays — the loop animates by exactly half the track width,
// landing on identical content for a seamless wrap.
const RENDER = [...REVIEWS, ...REVIEWS, ...REVIEWS, ...REVIEWS];

export function Testimonials() {
  const root = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".tm-eyebrow",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    },
    {
      selector: ".tm-title",
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
  ]);

  // Single-track infinite marquee — content is repeated enough times that
  // animating xPercent by -50% lands on identical content. Pauses on hover.
  useEffect(() => {
    if (!trackRef.current) return;
    const ctx = gsap.context(() => {
      const tween = gsap.to(trackRef.current, {
        xPercent: -50,
        duration: 100,
        ease: "none",
        repeat: -1,
      });

      const wrap = root.current?.querySelector(".tm-marquee");
      const onEnter = () => tween.timeScale(0.15);
      const onLeave = () => tween.timeScale(1);
      wrap?.addEventListener("mouseenter", onEnter);
      wrap?.addEventListener("mouseleave", onLeave);
      return () => {
        wrap?.removeEventListener("mouseenter", onEnter);
        wrap?.removeEventListener("mouseleave", onLeave);
      };
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-gradient-to-b from-[#070707] via-[#0a0a0a] to-[#070707] py-20 text-white md:py-28"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="tm-eyebrow inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
            <Star className="h-3 w-3 fill-[#ffae00] text-[#ffae00]" />
            4.9 / 5 · 1,200+ reviews
          </p>
          <h2 className="tm-title mt-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl">
            What real lifters say
          </h2>
        </div>
      </div>

      {/* Marquee row */}
      <div className="tm-marquee relative mt-14 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#070707] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#070707] to-transparent" />

        <div ref={trackRef} className="flex w-max gap-6 px-3">
          {RENDER.map((r, idx) => (
            <figure
              key={idx}
              className="relative w-[360px] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur md:w-[420px]"
            >
              <span
                aria-hidden
                className="absolute -left-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: r.accent }}
              />
              <Quote
                className="relative h-7 w-7"
                style={{ color: r.accent }}
                strokeWidth={2.5}
              />
              <blockquote className="relative mt-4 text-base leading-relaxed text-white/85">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="relative mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                  style={{ background: `${r.accent}26`, color: r.accent }}
                >
                  {r.avatar}
                </span>
                <div>
                  <p className="text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-white/55">{r.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
