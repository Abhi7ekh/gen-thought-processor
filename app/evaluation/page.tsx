import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ThoughtCard } from "@/features/thoughts/thought-card";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EvaluationPage() {
  const user = await requireUserSession();
  let thoughts: DashboardThought[] | null = null;
  let error: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error: readError } = await supabase
      .from("thoughts")
      .select(
        "id, heading, elaboration, created_at, updated_at, status, priority, archived, user_rating, system_rating, system_rating_details"
      )
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(20);

    if (readError) {
      console.error("[thoughts.evaluation-page] Supabase SELECT failed", {
        code: /^[A-Z0-9_-]{1,32}$/i.test(readError.code) ? readError.code : "UNKNOWN",
      });
      error = "Evaluation thoughts could not be loaded. Please try again shortly.";
    } else {
      thoughts = data ?? [];
    }
  } catch (caughtError) {
    console.error("[thoughts.evaluation-page] Unexpected SELECT failure", {
      name: caughtError instanceof Error ? caughtError.name : "UnknownError",
    });
    error = "Evaluation thoughts could not be loaded. Please try again shortly.";
  }

  return (
    <AppShell profile={getProfileIdentity(user)} title="Evaluation">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-accent/35 p-5 sm:p-6">
          <p className="text-sm leading-6 text-ink-soft">
            Evaluate a thought with the existing local rubric, review its dimension scores, and save the result.
            These scores are heuristic and are not AI-generated.
          </p>
          <Link
            href="/thoughts"
            className="mt-4 inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            Browse all thoughts
          </Link>
        </section>
        {error ? (
          <p role="alert" className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
            {error}
          </p>
        ) : thoughts?.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {thoughts.map((thought) => (
              <article key={thought.id} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <ThoughtCard thought={thought} returnTo="/evaluation" />
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-accent/25 px-5 py-10 text-center text-sm text-muted-foreground">
            {thoughts === null
              ? "Evaluation thoughts are unavailable."
              : "No active thoughts are available to evaluate."}
          </div>
        )}
      </div>
    </AppShell>
  );
}