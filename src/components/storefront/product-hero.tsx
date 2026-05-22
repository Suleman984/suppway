"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

// Lazy — three.js (~150kb gz) is split into its own chunk and only loaded
// on the PDP, after the page is interactive.
const ProductHeroFx = dynamic(
  () => import("./product-hero-fx").then((m) => m.ProductHeroFx),
  { ssr: false },
);

interface Props {
  src: string;
  alt: string;
  accent: string;
  badge?: string;
}

/**
 * PDP hero image with a subtle 3D mouse-tilt and a WebGL particle ambience.
 * Both effects are deliberately quiet — the tilt amplitude is ~6° max and
 * the particles fade up only slightly on hover.
 */
export function ProductHero({ src, alt, accent, badge }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Max ~6deg tilt — gentle, not vertigo-inducing.
    el.style.setProperty("--tilt-x", `${(-py * 6).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(px * 6).toFixed(2)}deg`);
    el.style.setProperty("--glare-x", `${(px * 100 + 50).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${(py * 100 + 50).toFixed(1)}%`);
  }

  function handleLeave() {
    const el = boxRef.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    setHover(false);
  }

  return (
    <div
      className="relative aspect-square w-full"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={boxRef}
        onPointerMove={handleMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={handleLeave}
        className="group relative h-full w-full overflow-hidden rounded-3xl border border-white/10 transition-transform duration-300 ease-out will-change-transform"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${accent}44, ${accent}10 60%, transparent), #0c0c0c`,
          transform:
            "rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <ProductHeroFx accent={accent} hovered={hover} />

        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width:1024px) 55vw, 100vw"
          priority
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          style={{ transform: "translateZ(40px)" }}
        />

        {/* Soft glare that tracks the cursor — sits above image, below badge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--glare-x,50%) var(--glare-y,50%), rgba(255,255,255,0.18), transparent 40%)",
            mixBlendMode: "screen",
          }}
        />

        {badge && (
          <span
            className="absolute left-5 top-5 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-900"
            style={{ transform: "translateZ(60px)" }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
