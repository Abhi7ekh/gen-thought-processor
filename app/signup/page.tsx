import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function SignUpPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Gen Thought Processor
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Start collecting and refining the ideas that matter most.
            </p>
          </div>
        </div>

        <AuthForm mode="signup" />

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
