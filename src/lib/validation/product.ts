import { z } from "zod";
import { currencySchema, moneyCentsSchema, slugSchema } from "./common";

export const productCreateSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  vendor: z.string().max(120).optional(),
  productType: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const variantSchema = z.object({
  sku: z.string().max(80).optional(),
  title: z.string().min(1).max(120),
  option1: z.string().max(60).optional(),
  option2: z.string().max(60).optional(),
  option3: z.string().max(60).optional(),
  priceCents: moneyCentsSchema,
  compareAtCents: moneyCentsSchema.optional(),
  currency: currencySchema,
  weightGrams: z.number().int().min(0).optional(),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  inventoryQty: z.number().int().min(0).default(0),
  inventoryPolicy: z.enum(["deny", "continue"]).default("deny"),
});
export type VariantInput = z.infer<typeof variantSchema>;
