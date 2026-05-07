import { z } from "zod";
import { emailSchema } from "./common";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a digit");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Required"),
  next: z.string().optional(),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z.string().min(1, "Required").max(120),
  email: emailSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().default(false),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const magicLinkSchema = z.object({
  email: emailSchema,
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
