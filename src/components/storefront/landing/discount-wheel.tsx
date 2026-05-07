"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Gift, Plus, Sparkles, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

interface Prize {
  id: string;
  name: string;
  flavor: string;
  originalPrice: number;
  discount: number;
  accent: string;
  image: string;
}

const PRIZES: Prize[] = [
  {
    id: "wheel-whey",
    name: "Whey Isolate",
    flavor: "Chocolate Brownie · 2kg",
    originalPrice: 7499,
    discount: 25,
    accent: "#ff3b3b",
    image:
      "https://images.pexels.com/photos/4753929/pexels-photo-4753929.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wheel-creatine",
    name: "Creapure® Mono",
    flavor: "Unflavored · 500g",
    originalPrice: 4499,
    discount: 30,
    accent: "#00d4ff",
    image:
      "https://images.pexels.com/photos/4498482/pexels-photo-4498482.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wheel-pre",
    name: "Pre-Workout V2",
    flavor: "Blue Raspberry · 30 svg",
    originalPrice: 5999,
    discount: 20,
    accent: "#ffae00",
    image:
      "https://images.pexels.com/photos/4944959/pexels-photo-4944959.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wheel-bcaa",
    name: "BCAA 9000",
    flavor: "Watermelon · 30 svg",
    originalPrice: 3999,
    discount: 35,
    accent: "#22c55e",
    image:
      "https://images.pexels.com/photos/3253505/pexels-photo-3253505.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wheel-multi",
    name: "MultiVit X",
    flavor: "Daily · 60 caps",
    originalPrice: 2999,
    discount: 15,
    accent: "#a855f7",
    image:
      "https://images.pexels.com/photos/6551070/pexels-photo-6551070.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "wheel-mass",
    name: "Mass Gainer",
    flavor: "Vanilla · 5kg",
    originalPrice: 8999,
    discount: 40,
    accent: "#ff6b35",
    image:
      "https://images.pexels.com/photos/4148901/pexels-photo-4148901.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

const PANEL_BG =
  "https://images.pexels.com/photos/4498482/pexels-photo-4498482.jpeg?auto=compress&cs=tinysrgb&w=900";

const SESSION_KEY = "suppway:wheel-spun";
const SEGMENT_DEG = 360 / PRIZES.length;
const RIM_LEDS = 16;

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const segmentPath = (startDeg: number, endDeg: number, r = 92) => {
  const start = polar(100, 100, r, startDeg);
  const end = polar(100, 100, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M 100 100 L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const getInitialSpun = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

export function DiscountWheel() {
  const wheelRef = useRef<SVGGElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [spun, setSpun] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [source, setSource] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setSpun(getInitialSpun());
  }, []);

  const handleSpin = () => {
    if (spun || spinning || !wheelRef.current) return;

    // Capture the wheel's current screen center so cards eject from there.
    const svg = wheelRef.current.ownerSVGElement;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setSource({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    }

    // Cards layer mounts immediately; each puck has its own delayed timeline
    // so the wheel keeps spinning visibly while pucks are ejected.
    setShowCards(true);
    setSpinning(true);

    const finalRotation = 1800 + Math.random() * 360;
    const tl = gsap.timeline({
      onComplete: () => {
        setSpinning(false);
        setSpun(true);
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
      },
    });
    tl.to(wheelRef.current, {
      rotation: -22,
      duration: 0.45,
      ease: "power2.inOut",
      svgOrigin: "100 100",
    }).to(wheelRef.current, {
      rotation: finalRotation,
      duration: 5.6,
      ease: "power3.out",
      svgOrigin: "100 100",
    });
  };

  return (
    <>
      <div
        className="relative overflow-hidden rounded-3xl border border-white/15 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        style={{
          backgroundImage: `url(${PANEL_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/95" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#ffae00]">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Spin · Win · Save
          </p>

          <div className="relative mt-4">
            {/* Pointer */}
            <div
              aria-hidden
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "12px solid transparent",
                borderRight: "12px solid transparent",
                borderTop: "20px solid #ffffff",
                filter:
                  "drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 0 12px rgba(255,59,59,0.5))",
              }}
            />
            <div
              aria-hidden
              className="absolute left-1/2 top-0 z-10 h-3 w-3 -translate-x-1/2 -translate-y-3 rounded-full bg-[#ff3b3b] shadow-[0_0_12px_#ff3b3b]"
            />

            <svg
              viewBox="0 0 200 200"
              className="h-60 w-60 drop-shadow-[0_25px_60px_rgba(255,59,59,0.4)]"
            >
              <defs>
                <radialGradient id="wheel-gloss" cx="50%" cy="32%" r="62%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <radialGradient id="hub-grad" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#3a3a3a" />
                  <stop offset="100%" stopColor="#0c0c0c" />
                </radialGradient>
                {PRIZES.map((p) => (
                  <linearGradient
                    key={`grad-${p.id}`}
                    id={`grad-${p.id}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={p.accent} stopOpacity="1" />
                    <stop offset="100%" stopColor={p.accent} stopOpacity="0.65" />
                  </linearGradient>
                ))}
              </defs>

              {/* Outer ring */}
              <circle
                cx="100"
                cy="100"
                r="98"
                fill="#0c0c0c"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />

              {/* LED rim */}
              {Array.from({ length: RIM_LEDS }).map((_, i) => {
                const angle = (i / RIM_LEDS) * 360;
                const pos = polar(100, 100, 95, angle);
                const isHot = i % 2 === 0;
                return (
                  <circle
                    key={`led-${i}`}
                    cx={pos.x}
                    cy={pos.y}
                    r="1.6"
                    fill={isHot ? "#ffae00" : "#ffffff"}
                    opacity={isHot ? 1 : 0.55}
                    style={{
                      filter: isHot
                        ? "drop-shadow(0 0 3px #ffae00)"
                        : "drop-shadow(0 0 2px rgba(255,255,255,0.6))",
                    }}
                  />
                );
              })}

              <g ref={wheelRef}>
                {PRIZES.map((p, i) => {
                  const start = i * SEGMENT_DEG;
                  const end = (i + 1) * SEGMENT_DEG;
                  const mid = start + SEGMENT_DEG / 2;
                  const labelPos = polar(100, 100, 60, mid);
                  return (
                    <g key={p.id}>
                      <path
                        d={segmentPath(start, end)}
                        fill={`url(#grad-${p.id})`}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={1}
                      />
                      <text
                        x={labelPos.x}
                        y={labelPos.y - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${mid} ${labelPos.x} ${labelPos.y - 4})`}
                        fill="#ffffff"
                        fontSize="15"
                        fontWeight="900"
                        style={{ letterSpacing: "0.04em" }}
                      >
                        {p.discount}%
                      </text>
                      <text
                        x={labelPos.x}
                        y={labelPos.y + 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${mid} ${labelPos.x} ${labelPos.y + 8})`}
                        fill="rgba(255,255,255,0.85)"
                        fontSize="6"
                        fontWeight="700"
                        style={{ letterSpacing: "0.18em" }}
                      >
                        OFF
                      </text>
                    </g>
                  );
                })}

                {/* Spoke lines for segment dividers */}
                {PRIZES.map((_, i) => {
                  const angle = i * SEGMENT_DEG;
                  const inner = polar(100, 100, 22, angle);
                  const outer = polar(100, 100, 92, angle);
                  return (
                    <line
                      key={`spoke-${i}`}
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth="0.8"
                    />
                  );
                })}

                {/* Glossy highlight overlay */}
                <circle
                  cx="100"
                  cy="100"
                  r="92"
                  fill="url(#wheel-gloss)"
                  pointerEvents="none"
                />

                {/* Center hub */}
                <circle cx="100" cy="100" r="22" fill="url(#hub-grad)" />
                <circle
                  cx="100"
                  cy="100"
                  r="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="8"
                  fill="#ff3b3b"
                  style={{ filter: "drop-shadow(0 0 6px #ff3b3b)" }}
                />
              </g>
            </svg>
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={spun || spinning}
            className={`mt-6 inline-flex h-12 w-full max-w-[220px] items-center justify-center gap-2 rounded-full px-7 text-xs font-bold uppercase tracking-[0.2em] transition ${
              spun
                ? "cursor-not-allowed border border-white/15 bg-white/5 text-white/40"
                : spinning
                  ? "cursor-wait bg-white/15 text-white"
                  : "bg-gradient-to-r from-[#ff3b3b] to-[#ff6b35] text-white shadow-[0_10px_35px_rgba(255,59,59,0.5)] hover:shadow-[0_15px_45px_rgba(255,59,59,0.7)]"
            }`}
          >
            {spun ? (
              "Already claimed"
            ) : spinning ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Spinning…
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" />
                Spin to win
              </>
            )}
          </button>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
            1 spin per session
          </p>
        </div>
      </div>

      {showCards && source && (
        <RewardCardsLayer
          onClose={() => setShowCards(false)}
          prizes={PRIZES}
          source={source}
        />
      )}
    </>
  );
}

// Scatter positions relative to viewport center (the wheel sits on the right
// at lg+, so all targets stay on the left/center side). Calibrated for
// 1024px+ viewports.
const SCATTER = [
  { x: -560, y: -260, rot: -8 },  // top-left, near eyebrow
  { x: -200, y: -300, rot: 5 },   // above headline
  { x: -610, y: -40, rot: 11 },   // beside headline, far left
  { x: -260, y: -30, rot: -4 },   // beside headline
  { x: -490, y: 220, rot: 7 },    // above stats area
  { x: -160, y: 250, rot: -10 },  // near stats
];

// Each card is ejected from the wheel partway through the spin, not all at
// the end. Sums to ~6s — the spin's total duration — so the last puck lands
// just as the wheel stops.
const EJECT_TIMES = [0.7, 1.2, 1.7, 2.2, 2.7, 3.2];

interface LayerProps {
  prizes: Prize[];
  onClose: () => void;
  source: { x: number; y: number };
}

function RewardCardsLayer({ prizes, onClose, source }: LayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const puckRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tweensRef = useRef<gsap.core.Timeline[]>([]);
  const [landed, setLanded] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const VW = window.innerWidth;
    const VH = window.innerHeight;

    prizes.forEach((p, i) => {
      const wrap = wrapRefs.current[i];
      const puck = puckRefs.current[i];
      const card = cardRefs.current[i];
      if (!wrap || !puck || !card) return;

      const s = SCATTER[i % SCATTER.length]!;
      const tx = VW / 2 + s.x;
      const ty = VH / 2 + s.y;
      const ejectAt = EJECT_TIMES[i] ?? 0.7 + i * 0.5;

      // Initial state — both elements parked at the wheel center, puck small
      // and visible, card invisible.
      gsap.set(wrap, { x: source.x, y: source.y, force3D: true });
      gsap.set(puck, {
        xPercent: -50,
        yPercent: -50,
        scale: 0.2,
        rotation: 0,
        opacity: 1,
      });
      gsap.set(card, {
        xPercent: -50,
        yPercent: -50,
        scale: 0,
        opacity: 0,
        rotation: s.rot - 30,
      });

      const tl = gsap.timeline({ delay: ejectAt });
      tweensRef.current[i] = tl;

      // 1. Eject — puck flies in an arc; X reaches target while Y overshoots
      //    upward (so the subsequent drop has gravity).
      tl.to(
        wrap,
        {
          x: tx,
          duration: 0.95,
          ease: "power2.out",
        },
        0,
      )
        .to(
          wrap,
          {
            y: ty - 110,
            duration: 0.5,
            ease: "power2.out",
          },
          0,
        )
        .to(
          puck,
          {
            scale: 1,
            rotation: 720,
            duration: 0.95,
            ease: "power2.out",
          },
          0,
        );

      // 2. Drop with multi-bounce — bounce.out gives 4 bounces of decreasing
      //    amplitude. Puck keeps rotating during the bounces.
      tl.to(wrap, {
        y: ty,
        duration: 1.5,
        ease: "bounce.out",
      }).to(
        puck,
        {
          rotation: "+=580",
          duration: 1.5,
          ease: "none",
        },
        "<",
      );

      // 3. Morph — puck shrinks out as the rectangular card pops in at the
      //    same point with a back ease.
      tl.to(puck, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      })
        .to(
          card,
          {
            scale: 1,
            opacity: 1,
            rotation: s.rot,
            duration: 0.6,
            ease: "back.out(1.5)",
            onStart: () => {
              setLanded((prev) => {
                if (prev.has(p.id)) return prev;
                const next = new Set(prev);
                next.add(p.id);
                return next;
              });
            },
          },
          "<-0.1",
        );
    });

    return () => {
      tweensRef.current.forEach((tl) => tl?.kill());
      tweensRef.current = [];
    };
  }, [prizes, source]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const removeCard = (id: string, animate = true) => {
    const i = prizes.findIndex((p) => p.id === id);
    const wrap = wrapRefs.current[i];
    const finish = () => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        if (next.size >= prizes.length) onClose();
        return next;
      });
    };
    if (!animate || !wrap) {
      finish();
      return;
    }
    gsap.to(wrap, {
      scale: 0,
      opacity: 0,
      rotation: "+=120",
      duration: 0.45,
      ease: "back.in(1.6)",
      onComplete: finish,
    });
  };

  const handleClaim = (p: Prize) => {
    const discountedPrice = Math.round(p.originalPrice * (1 - p.discount / 100));
    add({
      id: p.id,
      name: p.name,
      flavor: p.flavor,
      qty: 1,
      price: discountedPrice,
      accent: p.accent,
    });
    removeCard(p.id);
  };

  return (
    <div
      ref={layerRef}
      className="pointer-events-none fixed inset-0 z-[80]"
      role="dialog"
      aria-label="Discount rewards"
    >
      <button
        type="button"
        onClick={onClose}
        className="pointer-events-auto absolute right-6 top-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur transition hover:bg-black/60"
      >
        <X className="h-4 w-4" />
        Close
      </button>

      {prizes.map((p, i) => {
        if (dismissed.has(p.id)) return null;
        const hasLanded = landed.has(p.id);
        return (
          <div
            key={p.id}
            ref={(el) => {
              wrapRefs.current[i] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ zIndex: 90 + i }}
          >
            <Puck
              ref={(el) => {
                puckRefs.current[i] = el;
              }}
              prize={p}
            />
            <RewardCard
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              prize={p}
              interactive={hasLanded}
              onClaim={() => handleClaim(p)}
              onDismiss={() => removeCard(p.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

const Puck = forwardRef<HTMLDivElement, { prize: Prize }>(function Puck(
  { prize: p },
  ref,
) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 h-20 w-20 will-change-transform"
      style={{
        filter: `drop-shadow(0 10px 18px ${p.accent}88) drop-shadow(0 0 14px ${p.accent}66)`,
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/80"
        style={{ boxShadow: `0 0 0 4px ${p.accent}55` }}
      >
        {imgFailed ? (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${p.accent}cc, ${p.accent}33 70%, #181818)`,
            }}
          >
            <span className="text-3xl font-black text-white">
              {p.name.charAt(0)}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c]/80 via-transparent to-transparent" />
        <span className="absolute inset-x-0 bottom-0 bg-[#ff3b3b] py-0.5 text-center text-[9px] font-black uppercase tracking-[0.15em] text-white">
          {p.discount}% off
        </span>
      </div>
    </div>
  );
});

interface CardProps {
  prize: Prize;
  interactive?: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

const RewardCard = forwardRef<HTMLDivElement, CardProps>(function RewardCard(
  { prize: p, interactive = true, onClaim, onDismiss },
  ref,
) {
  const [imgFailed, setImgFailed] = useState(false);
  const discountedPrice = Math.round(p.originalPrice * (1 - p.discount / 100));

  return (
    <article
      ref={ref}
      className={`group absolute left-0 top-0 w-52 overflow-hidden rounded-2xl border border-white/15 bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.6)] will-change-transform transition-[transform,border-color] duration-300 ${
        interactive
          ? "pointer-events-auto hover:scale-[1.06] hover:border-white/30"
          : "pointer-events-none"
      }`}
      style={{ boxShadow: `0 20px 50px ${p.accent}33` }}
    >
      <div className="relative h-28 overflow-hidden">
        {imgFailed ? (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${p.accent}66, ${p.accent}15 60%, #181818)`,
            }}
          >
            <span
              className="text-5xl font-black"
              style={{ color: p.accent }}
            >
              {p.name.charAt(0)}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-transparent" />
        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-[#ff3b3b] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white shadow-md">
          <Sparkles className="h-2.5 w-2.5" />
          {p.discount}% off
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white"
          aria-label={`Skip ${p.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-4">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.25em]"
          style={{ color: p.accent }}
        >
          Avail the discount
        </p>
        <h3 className="mt-1.5 text-sm font-black uppercase leading-tight tracking-tight text-white">
          {p.name}
        </h3>
        <p className="mt-0.5 truncate text-[10px] text-white/55">{p.flavor}</p>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-lg font-black tabular-nums text-white">
            {fmt(discountedPrice)}
          </span>
          <span className="text-[10px] text-white/40 line-through tabular-nums">
            {fmt(p.originalPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClaim}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[#ff3b3b] text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#ff5252]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to cart
        </button>
      </div>
    </article>
  );
});
