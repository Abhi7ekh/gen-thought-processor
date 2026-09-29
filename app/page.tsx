import { z } from "zod";

import { requireUserSession } from "@/lib/auth";
import { createDailySummary } from "@/features/thoughts/daily-summary";
import { ThoughtDashboard } from "@/features/thoughts/thought-dashboard";
import type {
  DailySummary,
  DailySummaryThought,
  DashboardThought,
  ThoughtDashboardQuery,
} from "@/features/thoughts/thought-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { thoughtStatusSchema } from "@/lib/validations/thought";

const dashboardQuerySchema = z.object({
  search: z.string().trim().max(160).catch(""),
  status: z.union([z.literal("all"), thoughtStatusSchema]).catch("all"),
  priority: z.enum(["all", "set", "none"]).catch("all"),
  userRating: z.enum(["all", "rated", "unrated"]).catch("all"),
  systemRating: z.enum(["all", "evaluated", "not-evaluated"]).catch("all"),
  sort: z.enum(["recent", "oldest", "updated", "priority", "system-rating", "user-rating"]).catch("recent"),
  view: z.enum(["active", "archived"]).catch("active"),
});

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getDashboardReturnTo(query: ThoughtDashboardQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status !== "all") params.set("status", query.status);
  if (query.priority !== "all") params.set("priority", query.priority);
  if (query.userRating !== "all") params.set("userRating", query.userRating);
  if (query.systemRating !== "all") params.set("systemRating", query.systemRating);
  if (query.sort !== "recent") params.set("sort", query.sort);
  if (query.view !== "active") params.set("view", query.view);

  const serialized = params.toString();
  return serialized ? `/?${serialized}` : "/";
}

function getSearchPhrase(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\b(?:and|or|not)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function applyThoughtSort<T extends {
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => T;
}>(query: T, sort: ThoughtDashboardQuery["sort"]) {
  switch (sort) {
    case "oldest":
      return query.order("created_at", { ascending: true }).order("id", { ascending: true });
    case "updated":
      return query
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
    case "priority":
      return query
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
    case "system-rating":
      return query
        .order("system_rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
    case "user-rating":
      return query
        .order("user_rating", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
    case "recent":
    default:
      return query
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
  }
}

function getThoughtReadErrorMessage(code: string, message: string) {
  if (code === "42501" || /row.level security|violates.*policy/i.test(message)) {
    return "The database denied access to your thoughts. Confirm you're signed in and try again.";
  }

  if (code.startsWith("08") || code.startsWith("53")) {
    return "Thoughts are temporarily unavailable. Please try again shortly.";
  }

  return "Your thoughts could not be loaded. Please refresh and try again.";
}

export default async function HomePage({
  searchParams,
}: PageProps<"/">) {
  const user = await requireUserSession();
  const rawParams = await searchParams;
  const query = dashboardQuerySchema.parse({
    search: firstSearchParam(rawParams.search),
    status: firstSearchParam(rawParams.status),
    priority: firstSearchParam(rawParams.priority),
    userRating: firstSearchParam(rawParams.userRating),
    systemRating: firstSearchParam(rawParams.systemRating),
    sort: firstSearchParam(rawParams.sort),
    view: firstSearchParam(rawParams.view),
  }) satisfies ThoughtDashboardQuery;
  let thoughts: DashboardThought[] | null = null;
  let loadError: string | undefined;
  let dailySummary: DailySummary | null = null;
  let summaryError: string | undefined;
  let revisitThoughts: DashboardThought[] | null = null;
  let revisitError: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    let request = supabase
      .from("thoughts")
      .select(
        "id, heading, elaboration, created_at, updated_at, status, priority, archived, user_rating, system_rating, system_rating_details"
      )
      .eq("user_id", user.id)
      .eq("archived", query.view === "archived");

    if (query.status !== "all") request = request.eq("status", query.status);
    if (query.priority === "set") request = request.gt("priority", 0);
    if (query.priority === "none") request = request.eq("priority", 0);
    if (query.userRating === "rated") request = request.not("user_rating", "is", null);
    if (query.userRating === "unrated") request = request.is("user_rating", null);
    if (query.systemRating === "evaluated") request = request.not("system_rating", "is", null);
    if (query.systemRating === "not-evaluated") request = request.is("system_rating", null);

    const searchPhrase = getSearchPhrase(query.search);
    if (searchPhrase) {
      request = request.or(
        `heading.wfts(english).${searchPhrase},elaboration.wfts(english).${searchPhrase}`
      );
    }

    const dailyRequest = supabase
      .from("thoughts")
      .select("id, heading, created_at, status, priority, archived, user_rating, system_rating")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    const revisitRequest = supabase
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

    const [feedResult, dailyResult, revisitResult] = await Promise.all([
      applyThoughtSort(request, query.sort),
      dailyRequest,
      revisitRequest,
    ]);

    if (feedResult.error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(feedResult.error.code) ? feedResult.error.code : "UNKNOWN";
      console.error("[thoughts.dashboard] Supabase SELECT failed", { code });
      loadError = getThoughtReadErrorMessage(code, feedResult.error.message);
    } else {
      thoughts = feedResult.data ?? [];
    }

    if (dailyResult.error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(dailyResult.error.code) ? dailyResult.error.code : "UNKNOWN";
      console.error("[thoughts.summary] Supabase SELECT failed", { code });
      summaryError = "Today's summary could not be loaded. Please try again shortly.";
    } else {
      dailySummary = createDailySummary((dailyResult.data ?? []) as DailySummaryThought[]);
    }

    if (revisitResult.error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(revisitResult.error.code) ? revisitResult.error.code : "UNKNOWN";
      console.error("[thoughts.revisit] Supabase SELECT failed", { code });
      revisitError = "Revisit suggestions could not be loaded. Please try again shortly.";
    } else {
      revisitThoughts = revisitResult.data ?? [];
    }
  } catch (error) {
    console.error("[thoughts.dashboard] Unexpected SELECT failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    loadError = "Your thoughts could not be loaded. Please try again shortly.";
    summaryError = "Today's summary could not be loaded. Please try again shortly.";
    revisitError = "Revisit suggestions could not be loaded. Please try again shortly.";
  }

  return (
    <ThoughtDashboard
      email={user.email}
      thoughts={thoughts}
      loadError={loadError}
      query={query}
      returnTo={getDashboardReturnTo(query)}
      dailySummary={dailySummary}
      summaryError={summaryError}
      revisitThoughts={revisitThoughts}
      revisitError={revisitError}
    />
  );
}
