"use client";

import Link from "@/lib/store/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useReveal } from "@/lib/animations/use-reveal";
import { BRAND } from "@/lib/brand";

export function FinalCta() {
  const root = useRef<HTMLDivElement>(null);

  useReveal(root, [
    {
      selector: ".cta-eyebrow",
      from: { opacity: 0, y: 16 },
      to: { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
    },
    {
      selector: ".cta-title",
      from: { opacity: 0, y: 40, scale: 0.96 },
      to: { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" },
    },
    {
      selector: ".cta-sub",
      from: { opacity: 0, y: 20 },
      to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    },
    {
      selector: ".cta-btn",
      from: { opacity: 0, y: 16, scale: 0.95 },
      to: { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)" },
      stagger: 0.1,
    },
  ]);

  // Continuous orb drift — separate from the scroll reveal because it loops
  // forever, not just on entrance.
  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.to(".cta-bg-orb", {
        scale: 1.15,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const whatsappUrl = `https://wa.me/${BRAND.whatsapp.replace(/\D/g, "")}`;

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#ff3b3b] py-24 text-white md:py-32"
    >
      <div
        className="cta-bg-orb pointer-events-none absolute -left-40 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "#ffae00" }}
      />
      <div
        className="cta-bg-orb pointer-events-none absolute -right-40 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "#7a0000" }}
      />

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="cta-eyebrow text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            Ready when you are
          </p>
          <h2 className="cta-title mt-5 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Stop researching. Start training.
          </h2>
          <p className="cta-sub mt-6 text-lg text-white/85 md:text-xl">
            Get a free 15-min stack consult on WhatsApp. We&apos;ll build you a starter
            kit that fits your goals and your budget — no upsell pitch.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-sm font-bold uppercase tracking-wider text-[#ff3b3b] transition hover:scale-105 hover:bg-neutral-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chat on WhatsApp
            </a>
            <Link
              href="/products"
              prefetch
              className="cta-btn inline-flex h-14 items-center rounded-full border border-white/40 px-8 text-sm font-bold uppercase tracking-wider text-white transition hover:scale-105 hover:bg-white/10"
            >
              Browse store
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
