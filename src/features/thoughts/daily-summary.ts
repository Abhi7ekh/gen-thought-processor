import type { DailySummary, DailySummaryThought } from "@/features/thoughts/thought-types";

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function newestFirst(left: DailySummaryThought, right: DailySummaryThought) {
  return right.created_at.localeCompare(left.created_at) || left.id.localeCompare(right.id);
}

export function createDailySummary(thoughts: DailySummaryThought[]): DailySummary {
  const userRated = thoughts.flatMap((thought) =>
    thought.user_rating === null ? [] : [thought.user_rating]
  );
  const systemRated = thoughts.flatMap((thought) =>
    thought.system_rating === null ? [] : [thought.system_rating]
  );
  const highestSystemRatedThought = thoughts
    .filter((thought) => thought.system_rating !== null)
    .sort(
      (left, right) =>
        right.system_rating! - left.system_rating! || newestFirst(left, right)
    )[0];
  const highestPriorityThought = thoughts
    .filter((thought) => thought.priority > 0)
    .sort((left, right) => right.priority - left.priority || newestFirst(left, right))[0];

  return {
    totalThoughts: thoughts.length,
    newThoughts: thoughts.filter((thought) => thought.status === "new").length,
    reviewedThoughts: thoughts.filter((thought) => thought.status === "reviewed").length,
    importantThoughts: thoughts.filter((thought) => thought.status === "important").length,
    archivedThoughts: thoughts.filter((thought) => thought.archived).length,
    averageUserRating: average(userRated),
    averageSystemRating: average(systemRated),
    highestSystemRatedThought: highestSystemRatedThought?.system_rating === null || !highestSystemRatedThought
      ? null
      : {
          id: highestSystemRatedThought.id,
          heading: highestSystemRatedThought.heading,
          rating: highestSystemRatedThought.system_rating,
        },
    highestPriorityThought: highestPriorityThought
      ? {
          id: highestPriorityThought.id,
          heading: highestPriorityThought.heading,
          priority: highestPriorityThought.priority,
        }
      : null,
    needsReviewCount: thoughts.filter((thought) => thought.status === "new" && !thought.archived).length,
  };
}