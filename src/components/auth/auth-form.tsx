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

    submissionInFlight.current = true;
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
        setError(getAuthErrorMessage(error, "Google sign-in is unavailable right now."));
      }
    } catch (googleError) {
      setError(
        googleError instanceof Error
          ? getAuthErrorMessage(googleError, "Google sign-in is unavailable right now.")
          : "Google sign-in is unavailable right now."
      );
    } finally {
      submissionInFlight.current = false;
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
        <label htmlFor="email" className="text-sm font-medium text-secondary-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          disabled={isSubmitting || isGoogleSubmitting}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-secondary-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          disabled={isSubmitting || isGoogleSubmitting}
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isLogin ? "Enter your password" : "Create a strong password"}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
        />
      </div>

      {!isLogin ? (
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-secondary-foreground">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            disabled={isSubmitting || isGoogleSubmitting}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            className="w-full rounded-xl border border-input bg-background px-3.5 py-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </div>
      ) : null}

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
        disabled={isSubmitting || isGoogleSubmitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? isLogin
            ? "Signing in..."
            : "Creating account..."
          : isLogin
            ? "Sign in"
            : "Create account"}
      </button>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>Or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || isGoogleSubmitting}
        aria-label="Continue with Google"
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-secondary-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{isGoogleSubmitting ? "Continuing with Google..." : "Continue with Google"}</span>
      </button>

      {shouldShowResendPrompt ? (
        <button
          type="button"
          onClick={handleResendConfirmation}
          disabled={isResending}
          className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Sending confirmation..." : "Resend confirmation email"}
        </button>
      ) : null}
    </form>
  );
}
