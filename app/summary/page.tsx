import { AppHeader } from "@/components/layout/app-header";
import { DailySummarySection } from "@/features/thoughts/workspace-sections";
import { createDailySummary } from "@/features/thoughts/daily-summary";
import type { DailySummary, DailySummaryThought } from "@/features/thoughts/thought-types";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SummaryPage() {
  const user = await requireUserSession();
  let summary: DailySummary | null = null;
  let error: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const { data, error: readError } = await supabase
      .from("thoughts")
      .select("id, heading, created_at, status, priority, archived, user_rating, system_rating")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    if (readError) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(readError.code) ? readError.code : "UNKNOWN";
      console.error("[thoughts.summary] Supabase SELECT failed", { code });
      error = "Today's summary could not be loaded. Please try again shortly.";
    } else {
      summary = createDailySummary((data ?? []) as DailySummaryThought[]);
    }
  } catch (caughtError) {
    console.error("[thoughts.summary] Unexpected SELECT failure", {
      name: caughtError instanceof Error ? caughtError.name : "UnknownError",
    });
    error = "Today's summary could not be loaded. Please try again shortly.";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={getProfileIdentity(user)} />
        <div className="mx-auto max-w-5xl pb-16">
          <h1 className="sr-only">Daily Summary</h1>
          <DailySummarySection summary={summary} error={error} />
        </div>
      </div>
    </main>
  );
}