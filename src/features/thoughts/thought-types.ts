import type { Database } from "@/lib/supabase/database.types";

export type DashboardThought = Pick<
  Database["public"]["Tables"]["thoughts"]["Row"],
  | "id"
  | "heading"
  | "elaboration"
  | "created_at"
  | "updated_at"
  | "status"
  | "priority"
  | "archived"
  | "user_rating"
  | "system_rating"
  | "system_rating_details"
>;

export type ThoughtDashboardQuery = {
  search: string;
  status: "all" | DashboardThought["status"];
  priority: "all" | "set" | "none";
  userRating: "all" | "rated" | "unrated";
  systemRating: "all" | "evaluated" | "not-evaluated";
  sort: "recent" | "oldest" | "updated" | "priority" | "system-rating" | "user-rating";
  view: "active" | "archived";
};

export type DailySummaryThought = Pick<
  DashboardThought,
  | "id"
  | "heading"
  | "created_at"
  | "status"
  | "priority"
  | "archived"
  | "user_rating"
  | "system_rating"
>;

export type DailySummary = {
  totalThoughts: number;
  newThoughts: number;
  reviewedThoughts: number;
  importantThoughts: number;
  archivedThoughts: number;
  averageUserRating: number | null;
  averageSystemRating: number | null;
  highestSystemRatedThought: { id: string; heading: string; rating: number } | null;
  highestPriorityThought: { id: string; heading: string; priority: number } | null;
  needsReviewCount: number;
};