"use client";

import Link from "next/link";
import { useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { requestPasswordResetSchema } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = requestPasswordResetSchema.safeParse({ email: email.trim() });

    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Please enter a valid email address.");
      setMessage("");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });

      if (resetError) {
        setError(getAuthErrorMessage(resetError, "We couldn't send the reset email. Please try again."));
        return;
      }

      setMessage("Check your email for a password reset link.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? getAuthErrorMessage(submitError, "We couldn't send the reset email. Please try again.")
          : "We couldn't send the reset email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_55px_rgba(67,50,124,0.1)] sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Gen Thought Processor
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reset your password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email address and we will send a secure reset link.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-secondary-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger-foreground">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-xl border border-[#D9ECDD] bg-[#F0FAF2] px-3 py-2 text-sm text-[#32613D] dark:border-[#385441] dark:bg-[#223329] dark:text-[#B5E0BE]">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-brand-muted underline-offset-4 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
