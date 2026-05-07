"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface RevealProps {
  children: ReactNode;
  /** Stagger child elements (uses direct children) */
  stagger?: boolean;
  /** Delay before the animation begins, in seconds */
  delay?: number;
  /** Direction the content travels from */
  from?: "up" | "down" | "left" | "right";
  /** Duration in seconds */
  duration?: number;
  className?: string;
  as?: "div" | "section" | "ul" | "header" | "footer";
}

/**
 * Wrap any server-rendered block to fade + slide it in on scroll. Keeps
 * the children pure SSR — only the animation hook ships to the client.
 * If JS fails to load, content remains visible because we set the final
 * state via gsap.set() on mount, not in CSS.
 */
export function Reveal({
  children,
  stagger = false,
  delay = 0,
  from = "up",
  duration = 0.8,
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const offset = 40;
    const fromVars: gsap.TweenVars = { opacity: 0 };
    if (from === "up") fromVars.y = offset;
    if (from === "down") fromVars.y = -offset;
    if (from === "left") fromVars.x = offset;
    if (from === "right") fromVars.x = -offset;

    const targets = stagger
      ? Array.from(ref.current.children) as HTMLElement[]
      : [ref.current];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        fromVars,
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    }, ref);

    return () => ctx.revert();
  }, [stagger, delay, from, duration]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
