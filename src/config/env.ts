import { z } from "zod";

/**
 * Environment validation. Single-tenant deployment — STORE_NAME and friends
 * are the live store identity (the DB row in `store_settings` overrides
 * these once you edit them in the admin).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  STORE_NAME: z.string().min(1).default("Iron Forge"),
  STORE_TAGLINE: z.string().default("Fuel your strongest self"),
  STORE_DESCRIPTION: z.string().default(""),
  STORE_DEFAULT_LOCALE: z.string().default("en"),
  STORE_DEFAULT_CURRENCY: z.string().length(3).default("PKR"),
  STORE_SUPPORT_EMAIL: z.string().email().default("support@example.com"),
  STORE_LOGO_URL: z.string().default("/logo.svg"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional().default("demo"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().default("demo"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  JAZZCASH_MERCHANT_ID: z.string().optional(),
  JAZZCASH_PASSWORD: z.string().optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().optional(),
  JAZZCASH_RETURN_URL: z.string().optional(),

  EASYPAISA_STORE_ID: z.string().optional(),
  EASYPAISA_HASH_KEY: z.string().optional(),
  EASYPAISA_RETURN_URL: z.string().optional(),

  ENCRYPTION_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — check .env against .env.example");
}

export const env = parsed.data;

export const publicEnv = {
  appUrl: env.NEXT_PUBLIC_APP_URL,
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  stripePublishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  storeName: env.STORE_NAME,
  storeTagline: env.STORE_TAGLINE,
  storeLogoUrl: env.STORE_LOGO_URL,
  defaultLocale: env.STORE_DEFAULT_LOCALE,
  defaultCurrency: env.STORE_DEFAULT_CURRENCY,
} as const;

export type PublicEnv = typeof publicEnv;
