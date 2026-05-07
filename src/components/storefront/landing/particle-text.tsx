"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  // Spiral-only: polar interpolation state
  cx?: number;
  cy?: number;
  startAngle?: number;
  startRadius?: number;
  totalAngle?: number;
  targetRadius?: number;
  progress?: number;
}

interface Props {
  children: ReactNode;
  className?: string;
  /** Seconds before the particle wave starts. Use to chain multiple texts. */
  delay?: number;
  /** How long each particle takes to reach its target. */
  duration?: number;
  /** Entry style. "right" sweeps in from off-canvas right; "spiral" orbits the center and converges. */
  enter?: "right" | "spiral";
}

/**
 * Generic particle text — the actual rendered text element drives layout
 * and is the final crisp state. On mount we paint a same-sized canvas over
 * it, sample the rasterised text into pixel targets, animate particles in
 * (linear right→left wave or orbital spiral), then cross-fade to the real
 * (antialiased) text once the swarm has settled. Color, font and
 * letter-spacing are inherited via getComputedStyle.
 */
export function ParticleText({
  children,
  className = "",
  delay = 0,
  duration = 1.0,
  enter = "right",
}: Props) {
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
    const letterSpacing =
      cs.letterSpacing && cs.letterSpacing !== "normal"
        ? cs.letterSpacing
        : "0px";
    const color = cs.color || "#ffffff";

    let text = textEl.textContent || "";
    if (cs.textTransform === "uppercase") text = text.toUpperCase();
    else if (cs.textTransform === "lowercase") text = text.toLowerCase();

    // Spiral mode pads the canvas so particles can orbit outside the text
    // bounds before spiraling inward.
    const pad = enter === "spiral" ? Math.max(W, H) * 1.5 + 24 : 0;
    const cW = W + pad * 2;
    const cH = H + pad * 2;
    const sw = cW * dpr;
    const sh = cH * dpr;

    const off = document.createElement("canvas");
    off.width = sw;
    off.height = sh;
    const oc = off.getContext("2d");
    if (!oc) return;
    oc.scale(dpr, dpr);
    oc.font = font;
    oc.textBaseline = "top";
    oc.fillStyle = color;
    if ("letterSpacing" in oc) {
      (oc as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
        letterSpacing;
    }

    const metrics = oc.measureText(text);
    const fontSizePx = parseFloat(cs.fontSize);
    const ascent = metrics.actualBoundingBoxAscent || fontSizePx * 0.85;
    const descent = metrics.actualBoundingBoxDescent || fontSizePx * 0.2;
    const innerY0 = Math.max(0, (H - (ascent + descent)) / 2);
    oc.fillText(text, pad, pad + innerY0);

    const data = oc.getImageData(0, 0, sw, sh).data;
    const targets: { x: number; y: number }[] = [];
    const step = 2;
    for (let y = 0; y < sh; y += step) {
      for (let x = 0; x < sw; x += step) {
        if ((data[(y * sw + x) * 4 + 3] ?? 0) > 128) {
          targets.push({ x: x / dpr, y: y / dpr });
        }
      }
    }

    canvas.style.width = cW + "px";
    canvas.style.height = cH + "px";
    canvas.style.left = -pad + "px";
    canvas.style.top = -pad + "px";
    canvas.width = sw;
    canvas.height = sh;
    ctx.scale(dpr, dpr);

    let particles: Particle[];
    const stagger = duration * 0.4;

    if (enter === "spiral") {
      const cx = cW / 2;
      const cy = cH / 2;
      const orbitRadius = Math.max(W, H) * 1.5 + 20;
      particles = targets.map((t) => {
        const startAngle = Math.random() * Math.PI * 2;
        const startRadius = orbitRadius + Math.random() * 15;
        const turns = 1 + Math.random() * 0.6;
        const targetAngle = Math.atan2(t.y - cy, t.x - cx);
        const targetRadius = Math.hypot(t.x - cx, t.y - cy);
        let deltaAngle = targetAngle - startAngle;
        // Force counter-clockwise rotation for visual consistency.
        while (deltaAngle < 0) deltaAngle += 2 * Math.PI;
        const totalAngle = deltaAngle + turns * 2 * Math.PI;
        return {
          cx,
          cy,
          startAngle,
          startRadius,
          totalAngle,
          targetRadius,
          progress: 0,
          x: cx + Math.cos(startAngle) * startRadius,
          y: cy + Math.sin(startAngle) * startRadius,
          tx: t.x,
          ty: t.y,
        };
      });

      particles.forEach((p) => {
        const d = delay + Math.random() * stagger;
        gsap.to(p, {
          progress: 1,
          duration,
          ease: "power3.inOut",
          delay: d,
          onUpdate: () => {
            const t = p.progress ?? 0;
            const angle = (p.startAngle ?? 0) + (p.totalAngle ?? 0) * t;
            const r0 = p.startRadius ?? 0;
            const r1 = p.targetRadius ?? 0;
            const radius = r0 + (r1 - r0) * t;
            p.x = (p.cx ?? 0) + Math.cos(angle) * radius;
            p.y = (p.cy ?? 0) + Math.sin(angle) * radius;
          },
        });
      });
    } else {
      particles = targets.map((t) => ({
        x: cW + 30 + Math.random() * 240,
        y: t.y + (Math.random() - 0.5) * H * 1.4,
        tx: t.x,
        ty: t.y,
      }));

      particles.forEach((p) => {
        const d = delay + (1 - p.tx / cW) * stagger + Math.random() * stagger * 0.4;
        gsap.to(p, {
          x: p.tx,
          y: p.ty,
          duration,
          ease: "power3.out",
          delay: d,
        });
      });
    }

    // No cross-fade — at formation end we redraw the canvas with antialiased
    // fillText at the exact position the particles converged to. This avoids
    // any vertical jump from swapping to a separate HTML text element.
    let stop = false;
    const formEnd = (delay + duration + stagger) * 1000;
    const stopTimer = window.setTimeout(() => {
      stop = true;
    }, formEnd);

    const drawFinalText = () => {
      ctx.clearRect(0, 0, cW, cH);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          letterSpacing;
      }
      ctx.fillText(text, pad, pad + innerY0);
    };

    const pxSize = 1 / dpr;
    let raf = 0;
    const render = () => {
      if (stop) {
        drawFinalText();
        return;
      }
      ctx.clearRect(0, 0, cW, cH);
      ctx.fillStyle = color;
      const half = pxSize / 2;
      for (const p of particles) {
        ctx.fillRect(p.x - half, p.y - half, pxSize, pxSize);
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stopTimer);
      gsap.killTweensOf(particles);
    };
  }, [delay, duration, enter]);

  return (
    <span className={`relative inline-block leading-none ${className}`}>
      <span ref={textRef} style={{ opacity: 0 }}>
        {children}
      </span>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute"
        aria-hidden
      />
    </span>
  );
}
