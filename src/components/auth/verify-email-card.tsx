"use client";

import Link from "next/link";
import { useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { emailSchema } from "@/lib/validations/auth";

type VerifyEmailCardProps = {
  email?: string;
};

export function VerifyEmailCard({ email = "" }: VerifyEmailCardProps) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    const parsedEmail = emailSchema.safeParse(email.trim());

    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: parsedEmail.data,
      });

      if (resendError) {
        setError(getAuthErrorMessage(resendError, "Unable to resend the confirmation email."));
        return;
      }

      setMessage("A new verification email has been sent. Please check your inbox.");
    } catch (resendFailure) {
      setError(
        resendFailure instanceof Error
          ? getAuthErrorMessage(resendFailure, "Unable to resend the confirmation email.")
          : "Unable to resend the confirmation email."
      );
    } finally {
      setIsResending(false);
    }
  }

  const displayEmail = email || "your email address";

  return (
    <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_55px_rgba(67,50,124,0.1)] sm:p-8">
      <div className="mb-7 space-y-4 text-center">
        <div className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Gen Thought Processor
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to your email address.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-center text-sm text-secondary-foreground">
        <span className="font-medium text-foreground">{displayEmail}</span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger-foreground">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl border border-[#D9ECDD] bg-[#F0FAF2] px-3 py-2 text-sm text-[#32613D] dark:border-[#385441] dark:bg-[#223329] dark:text-[#B5E0BE]">
          {message}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Sending..." : "Resend verification email"}
        </button>

        <Link
          href="/signup"
          className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent"
        >
          Change email
        </Link>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
