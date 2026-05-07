"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        placeholder="you@email.com"
        className="h-10 rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-[#ff3b3b] focus:outline-none"
      />
      <button
        type="submit"
        className="h-10 rounded-md bg-[#ff3b3b] text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#ff5252]"
      >
        {submitted ? "You're in" : "Join"}
      </button>
    </form>
  );
}
