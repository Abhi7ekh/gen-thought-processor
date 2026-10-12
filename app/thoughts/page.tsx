import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ThoughtsWorkspace } from "@/features/thoughts/thought-dashboard";
import type { DashboardThought, ThoughtDashboardQuery } from "@/features/thoughts/thought-types";
import {
  applyThoughtSort,
  firstSearchParam,
  getSearchPhrase,
  getThoughtReadErrorMessage,
  getThoughtsReturnTo,
  THOUGHTS_PAGE_SIZE,
  thoughtDashboardQuerySchema,
} from "@/features/thoughts/thought-query";

export default async function ThoughtsPage({
  searchParams,
}: PageProps<"/thoughts">) {
  const user = await requireUserSession();
  const rawParams = await searchParams;
  const query = thoughtDashboardQuerySchema.parse({
    page: firstSearchParam(rawParams.page),
    search: firstSearchParam(rawParams.search),
    status: firstSearchParam(rawParams.status),
    priority: firstSearchParam(rawParams.priority),
    userRating: firstSearchParam(rawParams.userRating),
    systemRating: firstSearchParam(rawParams.systemRating),
    sort: firstSearchParam(rawParams.sort),
    view: firstSearchParam(rawParams.view),
  }) satisfies ThoughtDashboardQuery;

  let thoughts: DashboardThought[] | null = null;
  let hasMore = false;
  let loadError: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
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

    const offset = (query.page - 1) * THOUGHTS_PAGE_SIZE;
    const result = await applyThoughtSort(request, query.sort).range(offset, offset + THOUGHTS_PAGE_SIZE);
    if (result.error) {
      const code = /^[A-Z0-9_-]{1,32}$/i.test(result.error.code) ? result.error.code : "UNKNOWN";
      console.error("[thoughts.index] Supabase SELECT failed", { code });
      loadError = getThoughtReadErrorMessage(code, result.error.message);
    } else {
      const rows = result.data ?? [];
      hasMore = rows.length > THOUGHTS_PAGE_SIZE;
      thoughts = rows.slice(0, THOUGHTS_PAGE_SIZE);
    }
  } catch (error) {
    console.error("[thoughts.index] Unexpected SELECT failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    loadError = "Your thoughts could not be loaded. Please try again shortly.";
  }

  return (
    <ThoughtsWorkspace
      profile={getProfileIdentity(user)}
      thoughts={thoughts}
      hasMore={hasMore}
      loadError={loadError}
      query={query}
      returnTo={getThoughtsReturnTo(query)}
      previousPageHref={query.page > 1 ? getThoughtsReturnTo({ ...query, page: query.page - 1 }) : undefined}
      nextPageHref={hasMore ? getThoughtsReturnTo({ ...query, page: query.page + 1 }) : undefined}
    />
  );
}
