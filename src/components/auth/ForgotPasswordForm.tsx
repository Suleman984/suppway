"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { forgotPassword } from "@/server/actions/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await forgotPassword(values);
      if (res.ok) {
        setInfo(res.message ?? "Check your inbox.");
        form.reset();
      } else {
        setServerError(res.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </FormField>

      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
