"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const ITEMS = [
  "WHEY ISOLATE",
  "CREATINE MONO",
  "PRE-WORKOUT",
  "EAA / BCAA",
  "OMEGA-3",
  "MULTIVITAMIN",
  "MASS GAINER",
  "FAT BURNERS",
  "GLUTAMINE",
  "ZMA",
];

// Render the list four times so the track always exceeds 2× viewport even on
// ultra-wide displays — the loop animates by exactly half the track width
// (i.e. two copies), which lands on identical content for a seamless wrap.
const RENDER = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, {
        xPercent: -50,
        duration: 60,
        ease: "none",
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black py-6 text-white">
      {/* edge fade so words dissolve at the sides */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />

      <div
        ref={trackRef}
        className="flex w-max items-center gap-12 whitespace-nowrap px-6 text-sm font-bold uppercase tracking-[0.3em]"
      >
        {RENDER.map((item, idx) => (
          <span key={idx} className="flex items-center gap-12">
            <span className="text-white/85">{item}</span>
            <span className="text-[#ff3b3b]">●</span>
          </span>
        ))}
      </div>
    </div>
  );
}
