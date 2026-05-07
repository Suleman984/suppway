import { z } from "zod";
import { idSchema, moneyCentsSchema, slugSchema } from "./common";

const conditionRule = z.object({
  field: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "nin"]),
  value: z.unknown(),
});

export const funnelCreateSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export const funnelStepSchema = z.object({
  funnelId: idSchema,
  slug: slugSchema,
  kind: z.enum(["landing", "checkout", "upsell", "downsell", "order_bump", "thank_you", "custom"]),
  title: z.string().min(1).max(200),
  position: z.number().int().min(0).default(0),
  variantId: idSchema.optional(),
  offerPriceCents: moneyCentsSchema.optional(),
  onAcceptStepId: idSchema.optional(),
  onDeclineStepId: idSchema.optional(),
  content: z.record(z.unknown()).default({}),
  conditions: z.array(conditionRule).default([]),
});
export type FunnelStepInput = z.infer<typeof funnelStepSchema>;
