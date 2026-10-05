"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  revalidatePath("/");
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const parsed = requestPasswordResetSchema.safeParse({ email });

  if (!parsed.success) {
    const emailError = parsed.error.flatten().fieldErrors.email?.[0];
    return {
      success: false,
      message: emailError ?? "Please enter a valid email address.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return {
      success: false,
      message: getAuthErrorMessage(
        error,
        "We couldn't send the reset email. Please try again."
      ),
    };
  }

  return {
    success: true,
    message: "Check your email for a password reset link.",
  };
}

export async function completePasswordReset(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      message:
        fieldErrors.password?.[0] ??
        fieldErrors.confirmPassword?.[0] ??
        "Please correct your password fields.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      message: getAuthErrorMessage(
        error,
        "We couldn't update your password. Please try again."
      ),
    };
  }

  revalidatePath("/");
  redirect("/login");
}
