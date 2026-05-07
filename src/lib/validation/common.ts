import { z } from "zod";

/** Reusable primitives. Imported by client forms (RHF) and Server Actions alike. */

export const idSchema = z.string().uuid();
export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, digits, and dashes only");
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(7).max(20);
export const moneyCentsSchema = z.number().int().min(0);
export const currencySchema = z.string().length(3).regex(/^[A-Z]{3}$/);
export const positiveIntSchema = z.number().int().positive();
