"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  /** Format the count with thousands separators */
  thousands?: boolean;
  className?: string;
}

/**
 * Animates a number from 0 to `to` when it scrolls into view. Uses a
 * single GSAP tween over a plain object — `onUpdate` writes to
 * textContent so React doesn't re-render every frame (cheap, smooth).
 *
 * For stats already in view at first paint (hero), ScrollTrigger fires
 * on init with `once: true`.
 */
export function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 2,
  thousands = false,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const obj = { v: 0 };
    const format = (n: number) => {
      const fixed = n.toFixed(decimals);
      if (!thousands) return `${prefix}${fixed}${suffix}`;
      const [int = "0", dec] = fixed.split(".");
      const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${prefix}${dec ? `${withCommas}.${dec}` : withCommas}${suffix}`;
    };

    if (ref.current) ref.current.textContent = format(0);

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        v: to,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(obj.v);
        },
        scrollTrigger: {
          trigger: ref.current,
          start: "top 95%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [to, decimals, prefix, suffix, duration, thousands]);

  return <span ref={ref} className={className} />;
}
