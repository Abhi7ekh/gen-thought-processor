import { AppHeader } from "@/components/layout/app-header";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import { RevisitSection } from "@/features/thoughts/workspace-sections";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RevisitPage() {
  const user = await requireUserSession();
  let thoughts: DashboardThought[] | null = null;
  let error: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data, error: readError } = await supabase
      .from("thoughts")
      .select(
        "id, heading, elaboration, created_at, updated_at, status, priority, archived, user_rating, system_rating, system_rating_details"
      )
      .eq("user_id", user.id)
      .eq("archived", false)
      .in("status", ["new", "important"])
      .lt("created_at", todayStart.toISOString())
      .order("status", { ascending: true })
      .order("system_rating", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(6);

    if (readError) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(readError.code) ? readError.code : "UNKNOWN";
      console.error("[thoughts.revisit] Supabase SELECT failed", { code });
      error = "Revisit suggestions could not be loaded. Please try again shortly.";
    } else {
      thoughts = data ?? [];
    }
  } catch (caughtError) {
    console.error("[thoughts.revisit] Unexpected SELECT failure", {
      name: caughtError instanceof Error ? caughtError.name : "UnknownError",
    });
    error = "Revisit suggestions could not be loaded. Please try again shortly.";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={getProfileIdentity(user)} />
        <div className="mx-auto max-w-5xl pb-16">
          <h1 className="sr-only">Revisit</h1>
          <RevisitSection thoughts={thoughts} error={error} returnTo="/revisit" />
        </div>
      </div>
    </main>
  );
}