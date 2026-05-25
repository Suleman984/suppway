"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createReturnRequest } from "@/server/actions/returns";

interface Props {
  orderId: string;
  orderNumber: string;
  userId: string;
}

const REASONS = [
  "Damaged",
  "Wrong item",
  "Wrong size",
  "Changed my mind",
  "Other",
];

interface UploadedFile {
  path: string;
  name: string;
  mimeType: string;
  previewUrl: string;
}

export function ReturnRequestForm({ orderId, orderNumber, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"refund" | "exchange">("refund");
  const [reason, setReason] = useState<string>(REASONS[0]!);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();
    const next: UploadedFile[] = [...files];
    for (const file of Array.from(picked)) {
      if (next.length >= 6) {
        setError("You can attach up to 6 photos.");
        break;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is over 10 MB.`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      // Path prefix MUST start with auth.uid() — the storage policy
      // enforces this on insert.
      const path = `${userId}/${orderId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("return-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(`Upload failed for ${file.name}: ${upErr.message}`);
        continue;
      }
      next.push({
        path,
        name: file.name,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setFiles(next);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function removeFile(idx: number) {
    const f = files[idx];
    if (!f) return;
    const supabase = createClient();
    await supabase.storage.from("return-attachments").remove([f.path]);
    setFiles(files.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startSubmit(async () => {
      const result = await createReturnRequest({
        orderId,
        type,
        reason,
        message: message.trim(),
        attachmentPaths: files.map((f) => ({
          path: f.path,
          mimeType: f.mimeType,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        "Request submitted. Our team will reach out by email shortly.",
      );
      setFiles([]);
      setMessage("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
          Something wrong with this order?
        </h2>
        <p className="mt-2 text-xs text-white/65">
          Request a refund or exchange. We&apos;ll reply by email within 1
          business day.
        </p>
        {success && (
          <p className="mt-3 rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-2 text-xs text-[#22c55e]">
            {success}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-white/20 bg-white/5 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
        >
          Request refund or exchange
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
          Request refund or exchange · #{orderNumber}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-white/55 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
            What do you want?
          </span>
          <div className="flex gap-2">
            {(["refund", "exchange"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  type === t
                    ? "border-[#ff3b3b] bg-[#ff3b3b]/15 text-white"
                    : "border-white/15 bg-black/30 text-white/70 hover:border-white/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
            Reason
          </span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white focus:border-[#ff3b3b] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/30"
          >
            {REASONS.map((r) => (
              <option key={r} value={r} className="bg-zinc-900">
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">
          Tell us what happened ({message.trim().length}/20 min)
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={20}
          maxLength={2000}
          rows={4}
          placeholder="The shirt arrived with a tear on the left sleeve…"
          className="rounded-md border border-white/15 bg-black/40 p-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff3b3b] focus:outline-none focus:ring-2 focus:ring-[#ff3b3b]/30"
          required
        />
      </label>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">
          Photos (optional, up to 6)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={f.path}
              className="relative h-20 w-20 overflow-hidden rounded-md border border-white/15 bg-black/40"
            >
              {/* Local preview from object URL — no public URL needed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl}
                alt={f.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-black/80 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {files.length < 6 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-white/30 bg-black/30 text-[10px] font-bold uppercase tracking-widest text-white/55 hover:border-white/60 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Add
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 px-3 py-2 text-xs text-[#ff3b3b]"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/65 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploading || message.trim().length < 20}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff3b3b] px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff5252] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Submit request
        </button>
      </div>
    </form>
  );
}
