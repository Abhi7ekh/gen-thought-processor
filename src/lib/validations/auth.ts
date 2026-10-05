import { z } from "zod";

const passwordRequirementsMessage =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const passwordSchema = z
  .string()
  .min(8, passwordRequirementsMessage)
  .regex(/[A-Z]/, passwordRequirementsMessage)
  .regex(/[a-z]/, passwordRequirementsMessage)
  .regex(/[0-9]/, passwordRequirementsMessage);

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const callbackQuerySchema = z.object({
  code: z.string().min(1, "Missing authorization code."),
  next: z
    .string()
    .trim()
    .optional()
    .default("/")
    .refine(
      (value) => value === "/" || (value.startsWith("/") && !value.startsWith("//")),
      "Invalid redirect target."
    ),
});
