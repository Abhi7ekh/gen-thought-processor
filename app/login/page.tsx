import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-[0_18px_55px_rgba(67,50,124,0.1)] sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="inline-flex items-center rounded-full border border-border bg-accent px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Gen Thought Processor
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue with your thought workflow.
            </p>
          </div>
        </div>

        <AuthForm mode="login" />

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/forgot-password" className="font-medium text-brand-muted underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p>
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-brand-muted underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
