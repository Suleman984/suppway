"use client";

import Link from "@/lib/store/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { GoogleButton } from "./GoogleButton";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { signInWithMagicLink, signInWithPassword } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [magicPending, startMagicTransition] = useTransition();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });

  function onSubmit(values: SignInInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await signInWithPassword(values);
      // On success the action calls redirect(); we never reach this branch.
      if (res && !res.ok) {
        setServerError(res.error);
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof SignInInput, { message: v });
          }
        }
      }
    });
  }

  function sendMagicLink() {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "Enter your email first" });
      return;
    }
    setServerError(null);
    setInfo(null);
    startMagicTransition(async () => {
      const res = await signInWithMagicLink({ email, next });
      if (res.ok) setInfo(res.message ?? "Check your inbox.");
      else setServerError(res.error);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...form.register("email")}
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={form.formState.errors.password?.message} required>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </FormField>

      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={sendMagicLink} className="text-primary hover:underline" disabled={magicPending}>
          {magicPending ? "Sending…" : "Email me a sign-in link"}
        </button>
        <Link href="/forgot-password" className="text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <GoogleButton next={next} />
    </form>
  );
}
