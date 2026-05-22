import { z } from "zod";
import { idSchema } from "./common";

/**
 * Discount validation. Mirrors the `discounts` table + check constraints
 * from migration 0009. Shared by the admin form and the server action.
 */

export const discountKindSchema = z.enum(["percent", "fixed"]);
export type DiscountKind = z.infer<typeof discountKindSchema>;

export const discountScopeSchema = z.enum(["product", "category", "order"]);
export type DiscountScope = z.infer<typeof discountScopeSchema>;

const codeSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_-]+$/i, "letters, digits, dashes and underscores only")
  .transform((s) => s.toUpperCase())
  .optional()
  .or(z.literal(""));

const isoDate = z
  .string()
  .datetime({ offset: true })
  .optional()
  .or(z.literal(""));

export const discountBaseSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(1000).optional().or(z.literal("")),
    code: codeSchema,
    kind: discountKindSchema,
    value: z.number().int().positive(),
    scope: discountScopeSchema,
    productId: idSchema.optional().nullable(),
    categoryId: idSchema.optional().nullable(),
    minSubtotalCents: z.number().int().min(0).optional().nullable(),
    maxUses: z.number().int().min(1).optional().nullable(),
    startsAt: isoDate.nullable(),
    endsAt: isoDate.nullable(),
    isActive: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "percent" && (v.value < 1 || v.value > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percent must be between 1 and 100",
      });
    }
    if (v.scope === "product" && !v.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productId"],
        message: "Pick the product this discount targets",
      });
    }
    if (v.scope === "category" && !v.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categoryId"],
        message: "Pick the category this discount targets",
      });
    }
    if (v.startsAt && v.endsAt && v.startsAt >= v.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End must be after start",
      });
    }
  });
export type DiscountInput = z.infer<typeof discountBaseSchema>;

export const discountCreateSchema = discountBaseSchema;
export const discountUpdateSchema = z
  .object({ id: idSchema })
  .and(discountBaseSchema);
export type DiscountUpdateInput = z.infer<typeof discountUpdateSchema>;
