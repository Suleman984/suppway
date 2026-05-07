"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { resetPassword } from "@/server/actions/auth";

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const res = await resetPassword(values);
      if (res && !res.ok) setServerError(res.error);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert variant="destructive">{serverError}</Alert>}

      <FormField
        label="New password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint="At least 8 characters with a letter and a digit"
        required
      >
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
        required
      >
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>

      <Button type="submit" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
