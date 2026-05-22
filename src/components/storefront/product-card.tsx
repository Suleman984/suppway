import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPKR, type DummyProduct } from "@/lib/catalog/products";
import { QuickAddButton } from "./quick-add-button";

interface Props {
  product: DummyProduct;
  /** First card on the page can opt-in to LCP priority */
  priority?: boolean;
  /** Sizes attr for next/image. Default tuned for 1/2/3/4-col grids. */
  sizes?: string;
}

export function ProductCard({
  product: p,
  priority = false,
  sizes = "(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw",
}: Props) {
  return (
    <article className="group relative isolate flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-white/30">
      <Link
        href={`/product/${p.slug}`}
        prefetch
        className="relative block aspect-[4/5] overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${p.accent}33, ${p.accent}10 60%, transparent), #0c0c0c`,
        }}
        aria-label={p.name}
      >
        <Image
          src={p.images[0]}
          alt={p.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {p.badge && (
          <span
            className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur ${
              p.badge === "Sale"
                ? "bg-[#ff3b3b] text-white"
                : p.badge === "Low stock"
                  ? "bg-[#ffae00] text-neutral-900"
                  : "bg-white text-neutral-900"
            }`}
          >
            {p.badge}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
            {p.categoryLabel}
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-white">
              <Link href={`/product/${p.slug}`} prefetch className="hover:text-[#ff3b3b]">
                {p.name}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-xs text-white/55">{p.flavor}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-white/70">
            <Star className="h-3.5 w-3.5 fill-[#ffae00] text-[#ffae00]" />
            <span className="font-bold tabular-nums">{p.rating}</span>
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-white tabular-nums">
            {formatPKR(p.price)}
          </span>
          {p.oldPrice && (
            <span className="text-xs text-white/35 line-through tabular-nums">
              {formatPKR(p.oldPrice)}
            </span>
          )}
        </div>

        <QuickAddButton
          item={{
            id: p.slug,
            name: p.name,
            flavor: p.flavor,
            price: p.price,
            accent: p.accent,
          }}
        />
      </div>
    </article>
  );
}
