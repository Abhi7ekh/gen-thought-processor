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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc,#f1f5f9_35%,#e2e8f0)] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Gen Thought Processor
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Reset your password</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your email address and we will send a secure reset link.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
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
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-600">
          <Link href="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
