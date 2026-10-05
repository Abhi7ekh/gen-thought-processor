import { z } from "zod";

import type { ThoughtDashboardQuery } from "@/features/thoughts/thought-types";
import { thoughtStatusSchema } from "@/lib/validations/thought";

export const thoughtDashboardQuerySchema = z.object({
  search: z.string().trim().max(160).catch(""),
  status: z.union([z.literal("all"), thoughtStatusSchema]).catch("all"),
  priority: z.enum(["all", "set", "none"]).catch("all"),
  userRating: z.enum(["all", "rated", "unrated"]).catch("all"),
  systemRating: z.enum(["all", "evaluated", "not-evaluated"]).catch("all"),
  sort: z.enum(["recent", "oldest", "updated", "priority", "system-rating", "user-rating"]).catch("recent"),
  view: z.enum(["active", "archived"]).catch("active"),
});

export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getThoughtsReturnTo(query: ThoughtDashboardQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status !== "all") params.set("status", query.status);
  if (query.priority !== "all") params.set("priority", query.priority);
  if (query.userRating !== "all") params.set("userRating", query.userRating);
  if (query.systemRating !== "all") params.set("systemRating", query.systemRating);
  if (query.sort !== "recent") params.set("sort", query.sort);
  if (query.view !== "active") params.set("view", query.view);

  const serialized = params.toString();
  return serialized ? `/thoughts?${serialized}` : "/thoughts";
}

export function hasThoughtQuery(query: ThoughtDashboardQuery) {
  return Boolean(
    query.search ||
    query.status !== "all" ||
    query.priority !== "all" ||
    query.userRating !== "all" ||
    query.systemRating !== "all" ||
    query.sort !== "recent" ||
    query.view !== "active"
  );
}

export function getSearchPhrase(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\b(?:and|or|not)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function applyThoughtSort<T extends {
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

export function getThoughtReadErrorMessage(code: string, message: string) {
  if (code === "42501" || /row.level security|violates.*policy/i.test(message)) {
    return "The database denied access to your thoughts. Confirm you're signed in and try again.";
  }

  if (code.startsWith("08") || code.startsWith("53")) {
    return "Thoughts are temporarily unavailable. Please try again shortly.";
  }

  return "Your thoughts could not be loaded. Please refresh and try again.";
}