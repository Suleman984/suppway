"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { GoogleButton } from "./GoogleButton";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { signUpWithPassword } from "@/server/actions/auth";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", marketingOptIn: false },
  });

  function onSubmit(values: SignUpInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await signUpWithPassword(values);
      if (res && !res.ok) {
        setServerError(res.error);
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof SignUpInput, { message: v });
          }
        }
      } else if (res?.ok && res.message) {
        setInfo(res.message);
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <FormField label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message} required>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
      </FormField>

      <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint="At least 8 characters with a letter and a digit"
        required
      >
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </FormField>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("marketingOptIn")} className="h-4 w-4 rounded border-input" />
        <span className="text-muted-foreground">Send me product updates</span>
      </label>

      <Button type="submit" className="w-full" loading={pending}>
        Create account
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <GoogleButton />
    </form>
  );
}
