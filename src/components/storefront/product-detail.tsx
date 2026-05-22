"use client";

import Image from "next/image";
import { useState } from "react";
import { Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { formatPKR, type DummyProduct } from "@/lib/catalog/products";
import { useCartStore } from "@/stores/cart-store";
import { ProductHero } from "./product-hero";

export function ProductDetail({ product: p }: { product: DummyProduct }) {
  const [variantId, setVariantId] = useState(
    p.variants.find((v) => v.inStock)?.id ?? p.variants[0]?.id,
  );
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const add = useCartStore((s) => s.add);
  const openCart = useCartStore((s) => s.openCart);

  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0];
  const price = variant?.price ?? p.price;
  const inStock = variant?.inStock ?? false;

  function handleAdd() {
    if (!variant || !inStock) return;
    add({
      id: `${p.slug}__${variant.id}`,
      name: p.name,
      flavor: variant.label,
      price,
      accent: p.accent,
      qty,
    });
    openCart();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      {/* Gallery */}
      <div>
        <ProductHero
          src={p.images[activeImage] ?? p.images[0]}
          alt={p.name}
          accent={p.accent}
          badge={p.badge}
        />
        {p.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {p.images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === activeImage}
                className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                  i === activeImage
                    ? "border-[#ff3b3b]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#ff3b3b]">
          {p.categoryLabel}
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
          {p.name}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-white/65">
          <span className="font-bold text-[#ffae00]">★ {p.rating}</span>
          <span>·</span>
          <span>{p.reviews} reviews</span>
        </div>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-3xl font-black tabular-nums text-white">
            {formatPKR(price)}
          </span>
          {p.oldPrice && p.oldPrice > price && (
            <span className="text-base text-white/35 line-through tabular-nums">
              {formatPKR(p.oldPrice)}
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/65">
              Out of stock
            </span>
          )}
        </div>

        <p className="mt-6 text-base leading-relaxed text-white/75">
          {p.description}
        </p>

        {/* Variant picker */}
        {p.variants.length > 0 && (
          <fieldset className="mt-8">
            <legend className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
              {p.kind === "apparel" ? "Size" : "Option"}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.variants.map((v) => {
                const active = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.inStock}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-xl border px-4 py-3 text-left text-xs transition ${
                      active
                        ? "border-[#ff3b3b] bg-[#ff3b3b]/10 text-white"
                        : "border-white/15 bg-white/[0.03] text-white/80 hover:border-white/40"
                    } ${!v.inStock ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    <span className="block font-bold">{v.label}</span>
                    <span className="mt-1 block text-[11px] tabular-nums text-white/55">
                      {formatPKR(v.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Qty + Add */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="inline-flex items-center rounded-full border border-white/15">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="inline-flex h-12 w-12 items-center justify-center text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-base font-bold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="inline-flex h-12 w-12 items-center justify-center text-white/70 transition hover:text-white"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#ff3b3b] px-8 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            <ShoppingBag className="h-4 w-4" />
            {inStock ? `Add ${qty} to cart` : "Out of stock"}
          </button>
        </div>

        <ul className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm text-white/65 sm:grid-cols-2">
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#22c55e]" /> Free shipping over PKR 5,000
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00d4ff]" /> Lab-tested · 100% authentic
          </li>
        </ul>

        {/* Highlights */}
        <div className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
            Highlights
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/85">
            {p.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: p.accent }}
                />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Macros */}
        {p.macros && (
          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
              Nutrition · per serving
            </h2>
            <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              <Stat label="Servings" value={String(p.macros.servings)} />
              <Stat label="Size" value={p.macros.servingSize} />
              <Stat label="Calories" value={String(p.macros.calories)} />
              {p.macros.protein != null && (
                <Stat label="Protein" value={`${p.macros.protein}g`} />
              )}
              {p.macros.carbs != null && (
                <Stat label="Carbs" value={`${p.macros.carbs}g`} />
              )}
              {p.macros.fat != null && (
                <Stat label="Fat" value={`${p.macros.fat}g`} />
              )}
              {p.macros.sugar != null && (
                <Stat label="Sugar" value={`${p.macros.sugar}g`} />
              )}
            </dl>
          </div>
        )}

        {/* Ingredients */}
        {p.ingredients && p.ingredients.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/55">
              {p.kind === "supplement" ? "Ingredients" : "Materials"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {p.ingredients.join(" · ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-white/45">
        {label}
      </dt>
      <dd className="mt-1 text-base font-black tabular-nums text-white">{value}</dd>
    </div>
  );
}
