"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { Plus, Sparkles, X } from "lucide-react";
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

const SESSION_KEY = "suppway:wheel-spun";
const SEGMENT_DEG = 360 / PRIZES.length;

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
      <button
        type="button"
        onClick={handleSpin}
        disabled={spun || spinning}
        aria-label={
          spun
            ? "Discount wheel already claimed"
            : spinning
              ? "Spinning the discount wheel"
              : "Spin to win a discount"
        }
        title={
          spun ? "Already claimed" : spinning ? "Spinning…" : "Spin to win"
        }
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition ${
          spun
            ? "cursor-not-allowed opacity-40"
            : "hover:scale-110 hover:border-white/40"
        }`}
      >
        {/* Pulse ring to draw the eye when not yet spun */}
        {!spun && !spinning && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-[#ff3b3b]/60 animate-ping"
          />
        )}

        <svg
          viewBox="0 0 200 200"
          className="h-9 w-9 drop-shadow-[0_0_8px_rgba(255,59,59,0.45)]"
        >
          <defs>
            {PRIZES.map((p) => (
              <linearGradient
                key={`grad-${p.id}`}
                id={`nav-grad-${p.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={p.accent} stopOpacity="1" />
                <stop offset="100%" stopColor={p.accent} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>

          <circle
            cx="100"
            cy="100"
            r="98"
            fill="#0c0c0c"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
          />

          <g ref={wheelRef}>
            {PRIZES.map((p, i) => {
              const start = i * SEGMENT_DEG;
              const end = (i + 1) * SEGMENT_DEG;
              return (
                <path
                  key={p.id}
                  d={segmentPath(start, end, 88)}
                  fill={`url(#nav-grad-${p.id})`}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={1.5}
                />
              );
            })}
            <circle
              cx="100"
              cy="100"
              r="18"
              fill="#0c0c0c"
              stroke="#ffffff"
              strokeWidth="3"
            />
            <circle cx="100" cy="100" r="8" fill="#ff3b3b" />
          </g>
        </svg>

        {/* Tiny pointer at top */}
        <span
          aria-hidden
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "7px solid #ffffff",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
        />
      </button>

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

// Scatter positions relative to viewport center. Source is the navbar wheel
// at top-right of the viewport, so cards fall across the full hero — left,
// center, and right — avoiding the very top strip where the navbar sits.
const SCATTER = [
  { x: -560, y: -200, rot: -10 },  // top-left, just below navbar
  { x: -180, y: -240, rot: 5 },    // top-center, above headline
  { x: 240, y: -180, rot: 11 },    // top-right
  { x: -480, y: 170, rot: 8 },     // bottom-left, near stats
  { x: -120, y: 230, rot: -6 },    // bottom-center, near stats
  { x: 280, y: 140, rot: -12 },    // bottom-right
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
  const [mounted, setMounted] = useState(false);
  const add = useCartStore((s) => s.add);

  // Render via a portal to document.body so the layer's `fixed` positioning
  // is viewport-relative — DiscountWheel's parent in hero.tsx applies a
  // -translate-y-1/2 transform which would otherwise contain `fixed` and
  // pile the cards next to the wheel.
  useEffect(() => {
    setMounted(true);
  }, []);

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

      // Source is at the top of the viewport (navbar). The puck slides
      // horizontally to its column while bouncing vertically — bounce.out on
      // a long Y span gives multiple decreasing bounces as it "lands".
      // Timeline (seconds from ejectAt):
      //   0.00–1.10s  X eases to target
      //   0.00–2.05s  Y bounces from source to target (multi-bounce baked in)
      //   0.00–2.05s  Puck spins and scales up to 1
      //   2.00–2.30s  Puck shrinks/fades out
      //   1.95–2.55s  Card pops in with back.out
      const tl = gsap.timeline({ delay: ejectAt });
      tweensRef.current[i] = tl;

      tl.to(wrap, { x: tx, duration: 1.1, ease: "power2.out" }, 0);
      tl.to(wrap, { y: ty, duration: 2.05, ease: "bounce.out" }, 0);

      tl.to(
        puck,
        {
          scale: 1,
          rotation: 1320,
          duration: 2.05,
          ease: "none",
        },
        0,
      );

      tl.to(
        puck,
        {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        2.0,
      );

      tl.to(
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
        1.95,
      );
    });

    return () => {
      tweensRef.current.forEach((tl) => tl?.kill());
      tweensRef.current = [];
    };
  }, [prizes, source, mounted]);

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
      productSlug: p.id,
      name: p.name,
      flavor: p.flavor,
      qty: 1,
      price: discountedPrice,
      accent: p.accent,
    });
    removeCard(p.id);
  };

  if (!mounted) return null;

  return createPortal(
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
    </div>,
    document.body,
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
      className={`group absolute left-0 top-0 w-52 overflow-hidden rounded-2xl border border-white/15 bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.6)] will-change-transform transition-colors duration-200 ${
        interactive
          ? "pointer-events-auto hover:border-white/30"
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
