"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import {
  updateStoreSettingsSchema,
  type UpdateStoreSettingsInput,
} from "@/lib/validation/settings";
import { updateStoreSettings } from "@/server/actions/settings";

interface Props {
  current: UpdateStoreSettingsInput;
}

export function StoreSettingsForm({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const form = useForm<UpdateStoreSettingsInput>({
    resolver: zodResolver(updateStoreSettingsSchema),
    defaultValues: current,
  });

  function onSubmit(values: UpdateStoreSettingsInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateStoreSettings(values);
      if (res.ok) setInfo(res.message ?? "Saved");
      else {
        setServerError(res.error);
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof UpdateStoreSettingsInput, {
              message: v,
            });
          }
        }
      }
    });
  }

  const e = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <section>
        <h2 className="text-lg font-semibold">Locale &amp; currency</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defaults used across the storefront, emails, and reports.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField
            label="Default locale"
            htmlFor="defaultLocale"
            error={e.defaultLocale?.message}
            hint="e.g. en-PK"
            required
          >
            <Input
              id="defaultLocale"
              placeholder="en-PK"
              {...form.register("defaultLocale")}
            />
          </FormField>
          <FormField
            label="Default currency"
            htmlFor="defaultCurrency"
            error={e.defaultCurrency?.message}
            hint="ISO 4217 code (e.g. PKR, USD)"
            required
          >
            <Input
              id="defaultCurrency"
              placeholder="PKR"
              maxLength={3}
              {...form.register("defaultCurrency")}
            />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Social links</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Used in the storefront footer and Open Graph data. Leave blank to
          hide.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField
            label="Instagram"
            htmlFor="instagram"
            error={e.instagram?.message}
          >
            <Input
              id="instagram"
              placeholder="https://instagram.com/yourstore"
              {...form.register("instagram")}
            />
          </FormField>
          <FormField
            label="Facebook"
            htmlFor="facebook"
            error={e.facebook?.message}
          >
            <Input
              id="facebook"
              placeholder="https://facebook.com/yourstore"
              {...form.register("facebook")}
            />
          </FormField>
          <FormField
            label="TikTok"
            htmlFor="tiktok"
            error={e.tiktok?.message}
          >
            <Input
              id="tiktok"
              placeholder="https://tiktok.com/@yourstore"
              {...form.register("tiktok")}
            />
          </FormField>
          <FormField
            label="YouTube"
            htmlFor="youtube"
            error={e.youtube?.message}
          >
            <Input
              id="youtube"
              placeholder="https://youtube.com/@yourstore"
              {...form.register("youtube")}
            />
          </FormField>
          <FormField
            label="X / Twitter"
            htmlFor="twitter"
            error={e.twitter?.message}
            className="md:col-span-2"
          >
            <Input
              id="twitter"
              placeholder="https://x.com/yourstore"
              {...form.register("twitter")}
            />
          </FormField>
        </div>
      </section>

      <Button type="submit" loading={pending}>
        Save settings
      </Button>
    </form>
  );
}
