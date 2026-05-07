import { z } from "zod";
import { currencySchema, emailSchema, phoneSchema } from "./common";

export const addressSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  company: z.string().max(120).optional(),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  province: z.string().max(120).optional(),
  country: z.string().length(2),
  postalCode: z.string().max(20).optional(),
  phone: phoneSchema.optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  email: emailSchema,
  currency: currencySchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentProvider: z.enum(["stripe", "jazzcash", "easypaisa", "safepay", "paypal"]),
  marketingOptIn: z.boolean().default(false),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
