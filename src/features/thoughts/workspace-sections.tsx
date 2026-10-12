import { CalendarDays } from "lucide-react";

import { ThoughtCard } from "@/features/thoughts/thought-card";
import type { DailySummary, DashboardThought } from "@/features/thoughts/thought-types";

export function DailySummarySection({
  summary,
  error,
}: {
  summary: DailySummary | null;
  error?: string;
}) {
  const metrics = summary
    ? [
        { label: "Created", value: summary.totalThoughts },
        { label: "New", value: summary.newThoughts },
        { label: "Reviewed", value: summary.reviewedThoughts },
        { label: "Important", value: summary.importantThoughts },
        { label: "Archived", value: summary.archivedThoughts },
        { label: "Needs review", value: summary.needsReviewCount },
      ]
    : [];

  return (
    <section aria-labelledby="daily-summary-heading" className="pt-7 sm:pt-8">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="size-4 text-brand-muted" />
        <h2 id="daily-summary-heading" className="text-sm font-semibold text-ink-strong">
          Daily summary
        </h2>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
          {error}
        </p>
      ) : summary ? (
        <>
          {summary.totalThoughts === 0 ? (
            <p className="mb-3 text-xs text-ink-muted">No thoughts created today.</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`rounded-2xl border border-border p-4 shadow-sm ${
                  [
                    "bg-[#F0E9FF] dark:bg-[#342D4A]",
                    "bg-[#FFE8EF] dark:bg-[#422B3C]",
                    "bg-[#FFF2D6] dark:bg-[#493C25]",
                    "bg-[#E8F0FF] dark:bg-[#29374F]",
                    "bg-accent/50",
                    "bg-card",
                  ][index]
                }`}
              >
                <p className="text-[11px] font-medium text-ink-muted">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-ink-strong">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 text-xs text-ink-muted sm:grid-cols-2">
            <span>
              Average user rating: <strong className="font-semibold text-ink-body">{summary.averageUserRating ?? "—"}</strong>
            </span>
            <span>
              Average system rating: <strong className="font-semibold text-ink-body">{summary.averageSystemRating ?? "—"}</strong>
            </span>
            <span className="min-w-0 truncate">
              Highest system rating: <strong className="font-semibold text-ink-body">
                {summary.highestSystemRatedThought
                  ? `${summary.highestSystemRatedThought.heading} (${summary.highestSystemRatedThought.rating}/10)`
                  : "—"}
              </strong>
            </span>
            <span className="min-w-0 truncate">
              Highest priority: <strong className="font-semibold text-ink-body">
                {summary.highestPriorityThought
                  ? `${summary.highestPriorityThought.heading} (${summary.highestPriorityThought.priority}/5)`
                  : "—"}
              </strong>
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs text-ink-muted">Daily summary is unavailable.</p>
      )}
    </section>
  );
}

export function RevisitSection({
  thoughts,
  error,
  returnTo,
}: {
  thoughts: DashboardThought[] | null;
  error?: string;
  returnTo: string;
}) {
  return (
    <section aria-labelledby="revisit-heading" className="pt-10 sm:pt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Make space to reconsider
          </p>
          <h2 id="revisit-heading" className="mt-1 text-xl font-semibold tracking-tight text-ink-strong">
            Revisit
          </h2>
        </div>
        <span className="text-xs text-ink-muted">Older, active thoughts to review</span>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
          {error}
        </p>
      ) : thoughts === null ? (
        <p className="text-sm text-ink-muted">Revisit suggestions are unavailable.</p>
      ) : thoughts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/45 px-5 py-5 text-sm text-ink-muted">
          No older thoughts need a revisit right now.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {thoughts.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              showReviewAction
              returnTo={returnTo}
            />
          ))}
        </div>
      )}
    </section>
  );
}