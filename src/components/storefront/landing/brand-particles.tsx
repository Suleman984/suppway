"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { BRAND } from "@/lib/brand";

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
}

/**
 * Particle wordmark — the actual text element drives layout and is the final
 * crisp state; on mount we paint a same-sized canvas over it, sample the
 * text into pixel targets, fly particles in from the right, then cross-fade
 * the canvas out and the real text in once the swarm has settled.
 */
export function BrandParticles({ className = "" }: { className?: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const textEl = textRef.current;
    const canvas = canvasRef.current;
    if (!textEl || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const rect = textEl.getBoundingClientRect();
    const W = Math.ceil(rect.width);
    const H = Math.ceil(rect.height);
    if (W === 0 || H === 0) return;

    const cs = getComputedStyle(textEl);
    const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const letterSpacing = cs.letterSpacing && cs.letterSpacing !== "normal" ? cs.letterSpacing : "0px";
    const text = (textEl.textContent || "").toUpperCase();

    // Sample the text at device-pixel density for sharp particle targets.
    const sw = W * dpr;
    const sh = H * dpr;
    const off = document.createElement("canvas");
    off.width = sw;
    off.height = sh;
    const oc = off.getContext("2d");
    if (!oc) return;
    oc.scale(dpr, dpr);
    oc.font = font;
    oc.textBaseline = "top";
    oc.fillStyle = "#ffffff";
    // letterSpacing on CanvasRenderingContext2D is supported in modern engines.
    if ("letterSpacing" in oc) {
      (oc as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        letterSpacing;
    }
    const metrics = oc.measureText(text);
    const fontSizePx = parseFloat(cs.fontSize);
    const ascent = metrics.actualBoundingBoxAscent || fontSizePx * 0.85;
    const descent = metrics.actualBoundingBoxDescent || fontSizePx * 0.2;
    const y0 = Math.max(0, (H - (ascent + descent)) / 2);
    oc.fillText(text, 0, y0);

    const data = oc.getImageData(0, 0, sw, sh).data;
    const targets: { x: number; y: number }[] = [];
    const step = 2; // sample every 2 device pixels — fine grain at 2× DPR
    for (let y = 0; y < sh; y += step) {
      for (let x = 0; x < sw; x += step) {
        if ((data[(y * sw + x) * 4 + 3] ?? 0) > 128) {
          targets.push({ x: x / dpr, y: y / dpr });
        }
      }
    }

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = sw;
    canvas.height = sh;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = targets.map((t) => ({
      x: W + 30 + Math.random() * 240,
      y: t.y + (Math.random() - 0.5) * H * 1.4,
      tx: t.x,
      ty: t.y,
    }));

    const FORM_DURATION = 1.1;
    const MAX_DELAY = 0.5;

    particles.forEach((p) => {
      const delay = (1 - p.tx / W) * 0.35 + Math.random() * 0.15;
      gsap.to(p, {
        x: p.tx,
        y: p.ty,
        duration: FORM_DURATION,
        ease: "power3.out",
        delay,
      });
    });

    // Cross-fade to the real (antialiased) text once particles have settled.
    let stop = false;
    const fadeStart = FORM_DURATION + MAX_DELAY - 0.05;
    gsap.to(canvas, {
      opacity: 0,
      duration: 0.45,
      delay: fadeStart,
      ease: "power2.out",
      onComplete: () => {
        stop = true;
      },
    });
    gsap.to(textEl, {
      opacity: 1,
      duration: 0.45,
      delay: fadeStart,
      ease: "power2.out",
    });

    const particleSize = 1 / dpr; // ~1 device pixel — crisp dots in flight
    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#ffffff";
      const half = particleSize / 2;
      for (const p of particles) {
        ctx.fillRect(p.x - half, p.y - half, particleSize, particleSize);
      }
      if (!stop) raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      gsap.killTweensOf(particles);
      gsap.killTweensOf(canvas);
      gsap.killTweensOf(textEl);
    };
  }, []);

  return (
    <span className={`relative inline-block leading-none ${className}`}>
      <span ref={textRef} style={{ opacity: 0 }}>
        {BRAND.name}
      </span>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute left-0 top-0"
        aria-hidden
      />
    </span>
  );
}
