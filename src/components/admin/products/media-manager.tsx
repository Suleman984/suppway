"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/server/actions/products";

export interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

interface Props {
  productId: string;
  initial: MediaItem[];
}

export function MediaManager({ productId, initial }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);

    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("productId", productId);
        fd.append("file", file);
        const result = await uploadProductImage(fd);
        if (!result.ok) {
          setError(result.error);
          continue;
        }
        setItems((prev) => [
          ...prev,
          {
            id: result.data!.id,
            url: result.data!.url,
            alt: null,
            position: prev.length,
          },
        ]);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this image?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProductImage({ id, productId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== id));
    });
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Images
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPG / PNG / WebP / AVIF, up to 5 MB each. First image is the hero.
          </p>
        </div>
        <button
          type="button"
          onClick={onPick}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={onFileChange}
        />
      </header>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.length === 0 && (
          <p className="col-span-full rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            No images yet. Upload one to get started.
          </p>
        )}
        {items.map((m, i) => (
          <div
            key={m.id}
            className="group relative overflow-hidden rounded-md border bg-muted"
          >
            <div className="aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt ?? ""}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-foreground shadow">
                Hero
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(m.id)}
              disabled={pending}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
              aria-label="Remove image"
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
