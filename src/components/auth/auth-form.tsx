"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { emailSchema, loginSchema, signUpSchema } from "@/lib/validations/auth";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const submissionInFlight = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleGoogleSignIn() {
    if (submissionInFlight.current || isGoogleSubmitting) {
      return;
    }

    setError("");
    setMessage("");
    setIsGoogleSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/")}`,
        },
      });

      if (error) {
        setError(getAuthErrorMessage(error, "Unable to continue with Google right now."));
      }
    } catch (googleError) {
      setError(
        googleError instanceof Error
          ? getAuthErrorMessage(googleError, "Unable to continue with Google right now.")
          : "Unable to continue with Google right now."
      );
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    const trimmedEmail = email.trim();
    const parsedEmail = emailSchema.safeParse(trimmedEmail);

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

      setMessage("A new confirmation email has been sent. Please check your inbox.");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) {
      return;
    }

    submissionInFlight.current = true;

    try {
      setError("");
      setMessage("");

      const trimmedEmail = email.trim();

      if (mode === "login") {
        const parsed = loginSchema.safeParse({ email: trimmedEmail, password });

        if (!parsed.success) {
          const fieldErrors = parsed.error.flatten().fieldErrors;
          setError(
            fieldErrors.email?.[0] ?? fieldErrors.password?.[0] ?? "Please correct the form and try again."
          );
          return;
        }

        setIsSubmitting(true);
        const supabase = createBrowserSupabaseClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (signInError) {
          setError(getAuthErrorMessage(signInError));
          return;
        }

        router.push("/");
        router.refresh();
        return;
      }

      const parsed = signUpSchema.safeParse({
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setError(
          fieldErrors.email?.[0] ??
            fieldErrors.password?.[0] ??
            fieldErrors.confirmPassword?.[0] ??
            "Please correct the form and try again."
        );
        return;
      }

      setIsSubmitting(true);
      const supabase = createBrowserSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/")}`,
        },
      });

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError, "Something went wrong. Please try again."));
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? getAuthErrorMessage(submitError, "Something went wrong. Please try again.")
          : "Something went wrong. Please try again."
      );
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";
  const shouldShowResendPrompt =
    isLogin && error.toLowerCase().includes("verify your email") && !isSubmitting;

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
          placeholder={isLogin ? "Enter your password" : "Create a strong password"}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
        />
      </div>

      {!isLogin ? (
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            disabled={isSubmitting}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200"
          />
        </div>
      ) : null}

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

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
        <div className="h-px flex-1 bg-zinc-200" />
        <span>Or</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || isGoogleSubmitting}
        aria-label="Continue with Google"
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-700"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{isGoogleSubmitting ? "Continuing with Google..." : "Continue with Google"}</span>
      </button>

      {shouldShowResendPrompt ? (
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
