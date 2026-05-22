import { z } from "zod";
import { currencySchema, idSchema, moneyCentsSchema, slugSchema } from "./common";

/**
 * Validation schemas for product CRUD. Imported by both the client forms
 * (react-hook-form via @hookform/resolvers/zod) and the server actions, so
 * the same rules apply in both places.
 */

export const productStatusSchema = z.enum(["draft", "published", "archived"]);
export type ProductStatus = z.infer<typeof productStatusSchema>;

export const productKindSchema = z.enum([
  "supplement",
  "apparel",
  "equipment",
  "accessory",
  "program",
  "membership",
]);
export type ProductKind = z.infer<typeof productKindSchema>;

const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

/** Core product fields — used by both create and update. */
export const productBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  kind: productKindSchema.default("supplement"),
  status: productStatusSchema.default("draft"),
  brand: z.string().trim().max(120).optional().or(z.literal("")),
  tags: tagsSchema,
  attributes: z.record(z.unknown()).default({}),
  seoTitle: z.string().max(60).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
});
export type ProductBaseInput = z.infer<typeof productBaseSchema>;

export const productCreateSchema = productBaseSchema;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productBaseSchema.extend({
  id: idSchema,
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/** One row in the variant editor. `id` present = existing row; absent = new. */
export const variantSchema = z.object({
  id: idSchema.optional(),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
  title: z.string().trim().min(1).max(120),
  option1: z.string().trim().max(60).optional().or(z.literal("")),
  option2: z.string().trim().max(60).optional().or(z.literal("")),
  option3: z.string().trim().max(60).optional().or(z.literal("")),
  priceCents: moneyCentsSchema,
  compareAtCents: moneyCentsSchema.optional(),
  currency: currencySchema.default("PKR"),
  weightGrams: z.number().int().min(0).optional(),
  requiresShipping: z.boolean().default(true),
  taxable: z.boolean().default(true),
  inventoryQty: z.number().int().min(0).default(0),
  inventoryPolicy: z.enum(["deny", "continue"]).default("deny"),
  position: z.number().int().min(0).default(0),
});
export type VariantInput = z.infer<typeof variantSchema>;

export const variantsUpsertSchema = z.object({
  productId: idSchema,
  variants: z.array(variantSchema).min(1).max(50),
});
export type VariantsUpsertInput = z.infer<typeof variantsUpsertSchema>;

export const mediaSchema = z.object({
  id: idSchema.optional(),
  url: z.string().url().max(1000),
  alt: z.string().max(200).optional().or(z.literal("")),
  position: z.number().int().min(0).default(0),
});
export type MediaInput = z.infer<typeof mediaSchema>;

export const mediaReorderSchema = z.object({
  productId: idSchema,
  order: z.array(idSchema).max(20),
});
export type MediaReorderInput = z.infer<typeof mediaReorderSchema>;
