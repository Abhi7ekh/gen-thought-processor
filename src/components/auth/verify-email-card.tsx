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
    <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
      <div className="mb-7 space-y-4 text-center">
        <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
          Gen Thought Processor
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Check your email</h1>
          <p className="mt-3 text-sm text-zinc-600">
            We sent a verification link to your email address.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-700">
        <span className="font-medium text-zinc-900">{displayEmail}</span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Sending..." : "Resend verification email"}
        </button>

        <Link
          href="/signup"
          className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          Change email
        </Link>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
