"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { updateBrandingSchema, type UpdateBrandingInput } from "@/lib/validation/settings";
import { updateBranding } from "@/server/actions/settings";

interface Props {
  current: UpdateBrandingInput;
}

export function BrandingForm({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const form = useForm<UpdateBrandingInput>({
    resolver: zodResolver(updateBrandingSchema),
    defaultValues: current,
  });

  function onSubmit(values: UpdateBrandingInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateBranding(values);
      if (res.ok) setInfo(res.message ?? "Saved");
      else {
        setServerError(res.error);
        if (res.fieldErrors) {
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            form.setError(k as keyof UpdateBrandingInput, { message: v });
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
        <h2 className="text-lg font-semibold">Identity</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Store name" htmlFor="name" error={e.name?.message} required>
            <Input id="name" {...form.register("name")} />
          </FormField>
          <FormField label="Tagline" htmlFor="tagline" error={e.tagline?.message}>
            <Input id="tagline" {...form.register("tagline")} />
          </FormField>
          <FormField label="Logo URL" htmlFor="logoUrl" error={e.logoUrl?.message} className="md:col-span-2">
            <Input id="logoUrl" placeholder="https://..." {...form.register("logoUrl")} />
          </FormField>
          <FormField label="Favicon URL" htmlFor="faviconUrl" error={e.faviconUrl?.message} className="md:col-span-2">
            <Input id="faviconUrl" placeholder="https://..." {...form.register("faviconUrl")} />
          </FormField>
          <FormField label="Description" htmlFor="description" error={e.description?.message} className="md:col-span-2">
            <Input id="description" {...form.register("description")} />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Hero (homepage)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Headline" htmlFor="heroHeadline" error={e.heroHeadline?.message} className="md:col-span-2">
            <Input id="heroHeadline" {...form.register("heroHeadline")} />
          </FormField>
          <FormField label="Subheadline" htmlFor="heroSubheadline" error={e.heroSubheadline?.message} className="md:col-span-2">
            <Input id="heroSubheadline" {...form.register("heroSubheadline")} />
          </FormField>
          <FormField label="Hero image URL" htmlFor="heroImageUrl" error={e.heroImageUrl?.message} className="md:col-span-2">
            <Input id="heroImageUrl" placeholder="https://..." {...form.register("heroImageUrl")} />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Contact</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Support email" htmlFor="contactEmail" error={e.contactEmail?.message}>
            <Input id="contactEmail" type="email" {...form.register("contactEmail")} />
          </FormField>
          <FormField label="Phone" htmlFor="contactPhone" error={e.contactPhone?.message}>
            <Input id="contactPhone" {...form.register("contactPhone")} />
          </FormField>
          <FormField label="WhatsApp" htmlFor="whatsappNumber" error={e.whatsappNumber?.message}>
            <Input id="whatsappNumber" {...form.register("whatsappNumber")} />
          </FormField>
          <FormField label="Address" htmlFor="address" error={e.address?.message}>
            <Input id="address" {...form.register("address")} />
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">SEO</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField
            label="SEO title"
            htmlFor="seoTitle"
            error={e.seoTitle?.message}
            hint="Up to 60 characters. Defaults to store name."
            className="md:col-span-2"
          >
            <Input id="seoTitle" {...form.register("seoTitle")} />
          </FormField>
          <FormField
            label="SEO description"
            htmlFor="seoDescription"
            error={e.seoDescription?.message}
            hint="Up to 160 characters."
            className="md:col-span-2"
          >
            <Input id="seoDescription" {...form.register("seoDescription")} />
          </FormField>
        </div>
      </section>

      <Button type="submit" loading={pending}>
        Save branding
      </Button>
    </form>
  );
}
