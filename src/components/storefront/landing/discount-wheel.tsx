"use client";

import { useEffect, useRef, useState } from "react";
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

const SESSION_KEY = "suppway:wheel-spun";
const SEGMENT_DEG = 360 / PRIZES.length;

const fmt = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const segmentPath = (startDeg: number, endDeg: number, r = 95) => {
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

  useEffect(() => {
    setSpun(getInitialSpun());
  }, []);

  const handleSpin = () => {
    if (spun || spinning || !wheelRef.current) return;
    setSpinning(true);

    const totalRotation = 1440 + Math.random() * 720;
    gsap.to(wheelRef.current, {
      rotation: totalRotation,
      svgOrigin: "100 100",
      duration: 4.5,
      ease: "power4.out",
      onComplete: () => {
        setSpinning(false);
        setSpun(true);
        try {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setShowCards(true);
      },
    });
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "16px solid #ffffff",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
            }}
          />

          <svg
            viewBox="0 0 200 200"
            className="h-64 w-64 drop-shadow-[0_25px_60px_rgba(255,59,59,0.35)] md:h-72 md:w-72"
          >
            <defs>
              <radialGradient id="wheel-gloss" cx="50%" cy="35%" r="65%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>

            <circle cx="100" cy="100" r="98" fill="#0c0c0c" />

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
                      fill={p.accent}
                      stroke="rgba(0,0,0,0.45)"
                      strokeWidth={1}
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="900"
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {p.discount}% OFF
                    </text>
                  </g>
                );
              })}
              <circle
                cx="100"
                cy="100"
                r="96"
                fill="url(#wheel-gloss)"
                pointerEvents="none"
              />
              <circle
                cx="100"
                cy="100"
                r="18"
                fill="#0c0c0c"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle cx="100" cy="100" r="6" fill="#ff3b3b" />
            </g>
          </svg>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={spun || spinning}
          className={`mt-6 inline-flex h-12 items-center gap-2 rounded-full px-7 text-xs font-bold uppercase tracking-[0.2em] transition ${
            spun
              ? "cursor-not-allowed border border-white/15 bg-white/5 text-white/40"
              : spinning
                ? "cursor-wait bg-white/15 text-white"
                : "bg-[#ff3b3b] text-white shadow-[0_10px_35px_rgba(255,59,59,0.45)] hover:bg-[#ff5252] hover:shadow-[0_12px_45px_rgba(255,59,59,0.6)]"
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

      {showCards && (
        <RewardCardsLayer onClose={() => setShowCards(false)} prizes={PRIZES} />
      )}
    </>
  );
}

const SCATTER = [
  { x: -380, y: -180, rot: -10 },
  { x: 0, y: -220, rot: 4 },
  { x: 380, y: -180, rot: 11 },
  { x: -380, y: 60, rot: 8 },
  { x: 0, y: 100, rot: -5 },
  { x: 380, y: 60, rot: -12 },
];

interface LayerProps {
  prizes: Prize[];
  onClose: () => void;
}

function RewardCardsLayer({ prizes, onClose }: LayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const add = useCartStore((s) => s.add);

  useEffect(() => {
    if (!layerRef.current) return;
    const cards = layerRef.current.querySelectorAll<HTMLDivElement>(".reward-card");
    gsap.set(cards, { opacity: 0, scale: 0, rotation: -180, x: 0, y: 0 });
    gsap.to(cards, {
      opacity: 1,
      scale: 1,
      x: (i) => SCATTER[i % SCATTER.length]!.x,
      y: (i) => SCATTER[i % SCATTER.length]!.y,
      rotation: (i) => SCATTER[i % SCATTER.length]!.rot,
      duration: 1.4,
      ease: "elastic.out(1, 0.55)",
      stagger: 0.11,
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const removeCard = (id: string, animate = true) => {
    const card = layerRef.current?.querySelector<HTMLDivElement>(
      `[data-prize-id="${id}"]`,
    );
    const finish = () => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        if (next.size >= prizes.length) onClose();
        return next;
      });
    };
    if (!animate || !card) {
      finish();
      return;
    }
    gsap.to(card, {
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
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-label="Discount rewards"
    >
      <button
        type="button"
        aria-label="Dismiss rewards"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur transition hover:bg-white/10"
      >
        <X className="h-4 w-4" />
        Close
      </button>

      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ffae00]">
          <Sparkles className="mr-1 inline h-3 w-3" />
          You won
        </p>
        <p className="mt-2 text-3xl font-black uppercase tracking-tight text-white md:text-5xl">
          {prizes.length} discount drops
        </p>
        <p className="mt-2 max-w-md text-sm text-white/60">
          Claim what you want before the session ends.
        </p>
      </div>

      {prizes.map((p, i) => {
        if (dismissed.has(p.id)) return null;
        return (
          <div
            key={p.id}
            data-prize-id={p.id}
            className="reward-card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 90 + i }}
          >
            <RewardCard
              prize={p}
              onClaim={() => handleClaim(p)}
              onDismiss={() => removeCard(p.id)}
            />
          </div>
        );
      })}
    </div>
  );
}

interface CardProps {
  prize: Prize;
  onClaim: () => void;
  onDismiss: () => void;
}

function RewardCard({ prize: p, onClaim, onDismiss }: CardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const discountedPrice = Math.round(p.originalPrice * (1 - p.discount / 100));

  return (
    <article
      className="group relative w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#0c0c0c] shadow-[0_25px_70px_rgba(0,0,0,0.65)] transition duration-300 hover:scale-[1.04] hover:border-white/30"
      style={{ boxShadow: `0 25px 70px ${p.accent}33` }}
    >
      <div className="relative h-40 overflow-hidden">
        {imgFailed ? (
          <div
            aria-hidden
            className="h-full w-full"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${p.accent}66, ${p.accent}15 60%, #181818)`,
            }}
          >
            <span
              className="flex h-full items-center justify-center text-6xl font-black"
              style={{ color: p.accent }}
            >
              {p.name.charAt(0)}
            </span>
          </div>
        ) : (
          // Plain img to skip next/image remote-host config; falls back to gradient on error.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/30 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff3b3b] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
          <Sparkles className="h-3 w-3" />
          {p.discount}% off
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white"
          aria-label={`Skip ${p.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: p.accent }}
        >
          Avail the discount
        </p>
        <h3 className="mt-2 text-xl font-black uppercase leading-tight tracking-tight text-white">
          {p.name}
        </h3>
        <p className="mt-1 truncate text-xs text-white/55">{p.flavor}</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-black tabular-nums text-white">
            {fmt(discountedPrice)}
          </span>
          <span className="text-sm text-white/40 line-through tabular-nums">
            {fmt(p.originalPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClaim}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff3b3b] text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#ff5252]"
        >
          <Plus className="h-4 w-4" />
          Add to cart
        </button>
      </div>
    </article>
  );
}
