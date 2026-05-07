"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { THEMES, type ThemeId } from "@/lib/themes";
import { updateThemeSchema, type UpdateThemeInput } from "@/lib/validation/settings";
import { updateTheme } from "@/server/actions/settings";
import { cn } from "@/lib/utils/cn";

interface Props {
  current: { activeTheme: ThemeId; customBrandColor: string | null };
}

/**
 * Theme picker. Pick one of the built-in themes and optionally override
 * the primary brand color with a custom hex. Live preview updates as the
 * selection changes (without saving until "Apply" is clicked).
 */
export function ThemePicker({ current }: Props) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const form = useForm<UpdateThemeInput>({
    resolver: zodResolver(updateThemeSchema),
    defaultValues: {
      activeTheme: current.activeTheme,
      customBrandColor: current.customBrandColor ?? "",
    },
  });
  const selectedId = form.watch("activeTheme");
  const selected = THEMES[selectedId];

  function onSubmit(values: UpdateThemeInput) {
    setServerError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateTheme(values);
      if (res.ok) setInfo(res.message ?? "Saved");
      else setServerError(res.error);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {info && <Alert variant="success">{info}</Alert>}

      <div>
        <h2 className="text-lg font-semibold">Pick a theme</h2>
        <p className="text-sm text-muted-foreground">Applies to the entire customer-facing storefront.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(THEMES).map((t) => {
            const active = selectedId === t.id;
            return (
              <label
                key={t.id}
                className={cn(
                  "cursor-pointer rounded-lg border-2 p-4 transition",
                  active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40",
                )}
              >
                <input type="radio" value={t.id} {...form.register("activeTheme")} className="sr-only" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-xs uppercase text-muted-foreground">{t.surface}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                <div className="mt-4 flex h-16 overflow-hidden rounded-md border">
                  <div className="flex-1" style={{ background: t.preview.bg }} />
                  <div className="flex-1" style={{ background: t.preview.primary }} />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Brand color override</h2>
        <p className="text-sm text-muted-foreground">
          Optional. Replaces the theme&apos;s primary color with your own hex value while keeping everything else.
        </p>
        <div className="mt-3 flex items-end gap-3">
          <FormField
            label="Hex color"
            htmlFor="customBrandColor"
            className="flex-1"
            error={form.formState.errors.customBrandColor?.message}
            hint="Leave blank to use the theme's default"
          >
            <Input id="customBrandColor" placeholder="#ff7a1a" {...form.register("customBrandColor")} />
          </FormField>
          <div
            className="h-10 w-10 rounded-md border"
            style={{
              background:
                form.watch("customBrandColor") && /^#[0-9a-fA-F]{6}$/.test(form.watch("customBrandColor") ?? "")
                  ? form.watch("customBrandColor")
                  : selected.preview.primary,
            }}
          />
        </div>
      </div>

      <Button type="submit" loading={pending}>
        Apply theme
      </Button>
    </form>
  );
}
