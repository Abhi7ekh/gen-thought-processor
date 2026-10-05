import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";

export default async function EvaluationPage() {
  const user = await requireUserSession();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={getProfileIdentity(user)} />
        <section className="mx-auto max-w-3xl py-9 sm:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Evaluation
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Thought-level evaluation controls remain available with each thought.
          </p>
          <Link
            href="/thoughts"
            className="mt-6 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Browse thoughts
          </Link>
        </section>
      </div>
    </main>
  );
}