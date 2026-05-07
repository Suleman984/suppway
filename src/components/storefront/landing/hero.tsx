"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { BRAND } from "@/lib/brand";
import { Counter } from "./counter";
import { ParticleText } from "./particle-text";

/**
 * Hero with looping Pexels gym video as background. The video is
 * muted/playsInline/autoplay so it plays inline on iOS, and the video
 * itself is the only network-heavy asset on first paint — the rest of
 * the section is inline SVG + text. A multi-stage GSAP timeline drives
 * the headline reveal, sub, CTAs, and stats; once the video metadata
 * loads we fade the layer in for a smoother first impression.
 */
export function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const headline = "BUILD THE BODY THE WORK DEMANDS";

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { opacity: 0, y: 16, duration: 0.6 })
        .from(
          ".hero-letter",
          {
            opacity: 0,
            y: 80,
            rotateX: -60,
            transformPerspective: 800,
            duration: 0.8,
            stagger: 0.025,
          },
          "-=0.2",
        )
        .from(".hero-sub", { opacity: 0, y: 20, duration: 0.7 }, "-=0.4")
        .from(".hero-cta", { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 }, "-=0.3")
        .from(".hero-scroll", { opacity: 0, duration: 0.6 }, "-=0.2");

      gsap.to(".hero-orb-a", {
        x: 80,
        y: -40,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onCanPlay = () => setVideoReady(true);
    v.addEventListener("loadeddata", onCanPlay);
    if (v.readyState >= 2) setVideoReady(true);
    return () => v.removeEventListener("loadeddata", onCanPlay);
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-black text-white"
    >
      {/* Video layer */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-50" : "opacity-0"
        }`}
      >
        <source
          src="https://videos.pexels.com/video-files/4367572/4367572-hd_1280_720_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark gradient + vignette overlays — keep text legible against any frame */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/85 via-black/55 to-black/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="hero-orb-a pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #ff3b3b 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="container relative z-10 py-24 md:py-32">
        <p className="hero-eyebrow inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff3b3b]">
          <span className="h-px w-8 bg-[#ff3b3b]" /> {BRAND.name}
        </p>

        <h1
          aria-label={headline}
          className="mt-6 max-w-5xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl lg:text-[5.75rem]"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
        >
          {headline.split(" ").map((word, wi) => (
            <span key={wi} className="mr-[0.25em] inline-block whitespace-nowrap">
              {word.split("").map((ch, ci) => (
                <span key={ci} className="hero-letter inline-block">
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-8 max-w-2xl text-lg text-white/75 md:text-xl">
          Pharma-grade supplements, performance apparel and a coaching system
          built on 12 years of training real lifters in {BRAND.city}. No fluff,
          no fairy dust — just protocols that move the bar.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/collection/supplements"
            prefetch
            className="hero-cta group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-full bg-[#ff3b3b] px-8 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252]"
          >
            <span className="relative z-10">Shop Supplements</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <Link
            href="#programs"
            prefetch
            className="hero-cta inline-flex h-14 items-center rounded-full border border-white/30 bg-white/5 px-8 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition hover:border-white hover:bg-white/15"
          >
            Coaching plans
          </Link>
        </div>

        <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/15 pt-8">
          <div className="hero-stat">
            <dt className="flex items-baseline text-3xl font-black text-white md:text-4xl">
              <Counter to={12} duration={1.8} />
              <ParticleText
                className="ml-1 text-base font-bold text-white/70"
                delay={1.5}
                duration={0.55}
              >
                yrs
              </ParticleText>
            </dt>
            <dd className="mt-1 text-xs uppercase tracking-wider text-white/60">
              <ParticleText delay={1.55} duration={0.55}>
                coaching lifters
              </ParticleText>
            </dd>
          </div>
          <div className="hero-stat">
            <dt className="flex items-baseline text-3xl font-black text-white md:text-4xl">
              <Counter to={240} duration={2.2} thousands />
              <ParticleText
                className="ml-0.5 text-[#ff3b3b]"
                delay={1.3}
                duration={0.55}
              >
                +
              </ParticleText>
            </dt>
            <dd className="mt-1 text-xs uppercase tracking-wider text-white/60">
              <ParticleText delay={1.35} duration={0.55}>
                active members
              </ParticleText>
            </dd>
          </div>
          <div className="hero-stat">
            <dt className="flex items-baseline text-3xl font-black text-white md:text-4xl">
              <Counter to={4.9} decimals={1} duration={2} />
              <ParticleText
                className="ml-1 text-[#ffae00]"
                delay={1.1}
                duration={0.55}
              >
                ★
              </ParticleText>
            </dt>
            <dd className="mt-1 text-xs uppercase tracking-wider text-white/60">
              <ParticleText delay={1.15} duration={0.55}>
                supplement rating
              </ParticleText>
            </dd>
          </div>
        </dl>
      </div>

      <div
        aria-hidden
        className="hero-scroll absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/50"
      >
        <span className="h-8 w-px animate-pulse bg-white/40" />
        scroll
      </div>
    </section>
  );
}
