import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import { requireUserSession } from "@/lib/auth";
import { ThoughtCard } from "@/features/thoughts/thought-card";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { thoughtIdSchema } from "@/lib/validations/thought";

const returnToSchema = z
  .string()
  .max(2_048)
  .refine((value) =>
    value === "/" ||
    value.startsWith("/?") ||
    value === "/thoughts" ||
    value.startsWith("/thoughts?") ||
    value === "/revisit"
  );

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = returnToSchema.safeParse(candidate);
  return parsed.success ? parsed.data : "/";
}

export default async function ThoughtDetailPage({
  params,
  searchParams,
}: PageProps<"/thoughts/[id]">) {
  const { id } = await params;
  const parsedId = thoughtIdSchema.safeParse(id);
  if (!parsedId.success) notFound();

  const user = await requireUserSession();
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo);
  let thought: DashboardThought | null = null;
  let loadError = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("thoughts")
      .select(
        "id, heading, elaboration, created_at, updated_at, status, priority, archived, user_rating, system_rating, system_rating_details"
      )
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(error.code) ? error.code : "UNKNOWN";
      console.error("[thoughts.detail] Supabase SELECT failed", { code });
      loadError = true;
    } else {
      thought = data;
    }
  } catch (error) {
    console.error("[thoughts.detail] Unexpected SELECT failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    loadError = true;
  }

  if (!thought && !loadError) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={getProfileIdentity(user)} />
        <div className="mx-auto max-w-4xl pb-16 pt-6 sm:pt-10">
          <Link
            href={returnTo}
            className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-ink-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to thoughts
          </Link>

          {loadError ? (
            <p role="alert" className="mt-8 rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
              This thought could not be loaded. Please try again.
            </p>
          ) : thought ? (
            <div className="mt-6 border-t border-border pt-6 sm:mt-8 sm:pt-8">
              <ThoughtCard thought={thought} variant="detail" showReviewAction={!thought.archived} returnTo={returnTo} />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}