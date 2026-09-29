"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

const rateLimitMessage = "Too many attempts. Please wait a few minutes and try again.";

function isRateLimitError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const authError = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };
  const details = [authError.code, authError.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .replaceAll("_", " ");

  return (
    authError.status === 429 ||
    details.includes("rate limit") ||
    details.includes("too many")
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const submissionInFlight = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setError("Enter your email address before requesting a new confirmation email.");
      return;
    }

    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setMessage("A new confirmation email has been sent. Please check your inbox.");
    } catch (resendFailure) {
      setError(
        resendFailure instanceof Error
          ? resendFailure.message
          : "Unable to resend the confirmation email."
      );
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) {
      return;
    }

    submissionInFlight.current = true;

    try {
      setError("");
      setMessage("");

      if (!email.trim() || !password) {
        setError("Please enter both your email and password.");
        return;
      }

      setIsSubmitting(true);
      const supabase = createBrowserSupabaseClient();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (isRateLimitError(signInError)) {
            setError(rateLimitMessage);
          } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
            setError(
              "Your email address has not been confirmed yet. Check your inbox and resend the confirmation email if needed."
            );
          } else {
            setError(signInError.message);
          }
          return;
        }

        router.push("/");
        router.refresh();
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        setError(isRateLimitError(signUpError) ? rateLimitMessage : signUpError.message);
        return;
      }

      setMessage("Account created. Check your email to confirm sign-in.");
    } catch (submitError) {
      setError(
        isRateLimitError(submitError)
          ? rateLimitMessage
          : submitError instanceof Error
            ? submitError.message
            : "An unexpected error occurred."
      );
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          disabled={isSubmitting}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          disabled={isSubmitting}
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
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
        {isSubmitting
          ? isLogin
            ? "Signing in..."
            : "Creating account..."
          : isLogin
            ? "Sign in"
            : "Create account"}
      </button>

      {isLogin && error.toLowerCase().includes("email not confirmed") ? (
        <button
          type="button"
          onClick={handleResendConfirmation}
          disabled={isResending}
          className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Sending confirmation..." : "Resend confirmation email"}
        </button>
      ) : null}
    </form>
  );
}
