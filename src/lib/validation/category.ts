import { z } from "zod";
import { idSchema, slugSchema } from "./common";

/**
 * Category validation, shared by the admin form and the server action.
 * The columns mirror `public.categories` from migration 0003.
 */

export const categoryBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().url().max(1000).optional().or(z.literal("")),
  parentId: idSchema.optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  seoTitle: z.string().max(60).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
});
export type CategoryInput = z.infer<typeof categoryBaseSchema>;

export const categoryCreateSchema = categoryBaseSchema;
export const categoryUpdateSchema = z
  .object({ id: idSchema })
  .and(categoryBaseSchema);
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
