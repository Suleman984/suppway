"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface RevealConfig {
  /** CSS selector scoped to the ref (e.g. ".cat-card") */
  selector: string;
  /** Initial state — applied via gsap.set before paint, no flash */
  from: gsap.TweenVars;
  /** Final state — animated to when the element enters view */
  to: gsap.TweenVars;
  /** Stagger between siblings */
  stagger?: number | gsap.StaggerVars;
  /** ScrollTrigger start position */
  start?: string;
  /**
   * Use ScrollTrigger.batch — best for grids of cards. Each item animates
   * as it enters the viewport (or together if already in view at mount).
   */
  batch?: boolean;
}

/**
 * Robust scroll-reveal: hides targets synchronously after mount via
 * useLayoutEffect (no flash), then animates them in on viewport entry.
 *
 * Why useLayoutEffect: gsap.set runs before browser paint, so SSR-rendered
 * markup never appears in its visible state before the animation kicks in.
 * Combined with ScrollTrigger.refresh() at the end, content already in
 * view at first paint animates immediately rather than staying hidden.
 */
export function useReveal(
  scope: RefObject<HTMLElement | null>,
  configs: RevealConfig[],
) {
  useLayoutEffect(() => {
    if (!scope.current) return;
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      configs.forEach((cfg) => {
        const els = gsap.utils.toArray<HTMLElement>(cfg.selector);
        if (!els.length) return;

        gsap.set(els, cfg.from);

        if (cfg.batch) {
          ScrollTrigger.batch(els, {
            start: cfg.start ?? "top 88%",
            onEnter: (batch) =>
              gsap.to(batch, {
                ...cfg.to,
                stagger: cfg.stagger ?? 0.08,
                overwrite: "auto",
              }),
          });
        } else {
          gsap.to(els, {
            ...cfg.to,
            stagger: cfg.stagger ?? 0,
            scrollTrigger: {
              trigger: scope.current,
              start: cfg.start ?? "top 85%",
              once: true,
            },
          });
        }
      });

      // Recompute trigger positions once layout is settled (fonts, images).
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, scope);

    return () => ctx.revert();
    // configs is intentionally a stable ref — components pass a literal each
    // render and this hook treats it as mount-only setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
