import { redirect } from "next/navigation";

import { DashboardOverview } from "@/features/thoughts/dashboard-overview";
import { getThoughtReadErrorMessage } from "@/features/thoughts/thought-query";
import type { DashboardThoughtPreview } from "@/features/thoughts/thought-types";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dashboardThoughtPageSize = 30;

const thoughtQueryKeys = [
  "search",
  "status",
  "priority",
  "userRating",
  "systemRating",
  "sort",
  "view",
  "page",
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

  let recentThoughts: DashboardThoughtPreview[] | null = null;
  let hasMore = false;
  let loadError: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("thoughts")
      .select("id, heading, elaboration, created_at, priority, user_rating, system_rating")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(0, dashboardThoughtPageSize);

    if (error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(error.code) ? error.code : "UNKNOWN";
      console.error("[thoughts.overview] Supabase SELECT failed", { code });
      loadError = getThoughtReadErrorMessage(code, error.message);
    } else {
      const rows = data ?? [];
      hasMore = rows.length > dashboardThoughtPageSize;
      recentThoughts = rows.slice(0, dashboardThoughtPageSize);
    }
  } catch (error) {
    console.error("[thoughts.overview] Unexpected SELECT failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    loadError = "Your thoughts could not be loaded. Please try again shortly.";
  }

  return (
    <DashboardOverview
      profile={getProfileIdentity(user)}
      recentThoughts={recentThoughts}
      hasMore={hasMore}
      loadError={loadError}
    />
  );
}
