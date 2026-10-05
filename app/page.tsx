import { redirect } from "next/navigation";

import { DashboardOverview } from "@/features/thoughts/dashboard-overview";
import { getThoughtReadErrorMessage } from "@/features/thoughts/thought-query";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const thoughtQueryKeys = [
  "search",
  "status",
  "priority",
  "userRating",
  "systemRating",
  "sort",
  "view",
];

export default async function HomePage({
  searchParams,
}: PageProps<"/">) {
  const user = await requireUserSession();
  const rawParams = await searchParams;
  const legacyQuery = new URLSearchParams();

  for (const key of thoughtQueryKeys) {
    const value = rawParams[key];
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue) legacyQuery.set(key, firstValue);
  }

  const serializedQuery = legacyQuery.toString();
  if (serializedQuery) redirect(`/thoughts?${serializedQuery}`);

  let thoughts: Pick<DashboardThought, "created_at" | "status" | "priority">[] | null = null;
  let loadError: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("thoughts")
      .select("created_at, status, priority")
      .eq("user_id", user.id)
      .eq("archived", false);

    if (error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(error.code) ? error.code : "UNKNOWN";
      console.error("[thoughts.overview] Supabase SELECT failed", { code });
      loadError = getThoughtReadErrorMessage(code, error.message);
    } else {
      thoughts = data ?? [];
    }
  } catch (error) {
    console.error("[thoughts.overview] Unexpected SELECT failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    loadError = "Your thoughts could not be loaded. Please try again shortly.";
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = thoughts?.filter(
    (thought) => new Date(thought.created_at).toISOString().slice(0, 10) === today
  ).length ?? null;

  return (
    <DashboardOverview
      profile={getProfileIdentity(user)}
      thoughts={thoughts}
      todayCount={todayCount}
      loadError={loadError}
    />
  );
}
