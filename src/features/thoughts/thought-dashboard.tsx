import { Suspense } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCheck,
  Clock,
  Layers3,
  Sparkles,
  Star,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AddThoughtDialog } from "@/features/thoughts/add-thought-dialog";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import type { ThoughtDashboardQuery } from "@/features/thoughts/thought-types";
import type { DailySummary } from "@/features/thoughts/thought-types";
import { ThoughtCard } from "@/features/thoughts/thought-card";
import { ThoughtToolbar } from "@/features/thoughts/thought-toolbar";

const workflowStages = [
  { label: "Capture" },
  { label: "Organize" },
  { label: "Evaluate" },
  { label: "Rank" },
  { label: "Revisit" },
  { label: "Develop", later: true },
  { label: "Act", later: true },
];

type ThoughtDashboardProps = {
  email: string | undefined;
  thoughts: DashboardThought[] | null;
  loadError?: string;
  query: ThoughtDashboardQuery;
  dailySummary: DailySummary | null;
  summaryError?: string;
  revisitThoughts: DashboardThought[] | null;
  revisitError?: string;
  returnTo: string;
};

export function ThoughtDashboard({
  email,
  thoughts,
  loadError,
  query,
  dailySummary,
  summaryError,
  revisitThoughts,
  revisitError,
  returnTo,
}: ThoughtDashboardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayThoughts =
    query.view === "active"
      ? thoughts?.filter((thought) => new Date(thought.created_at).toISOString().slice(0, 10) === today) ?? null
      : null;
  const recentThoughts =
    query.view === "active"
      ? thoughts?.filter((thought) => new Date(thought.created_at).toISOString().slice(0, 10) !== today) ?? null
      : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <header className="flex min-h-20.5 flex-col justify-center gap-4 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <BrainCircuit aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Gen Thought Processor
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-muted">
                Personal thought space
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="max-w-55 truncate text-xs text-ink-muted">
              {email ?? "Signed in"}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <div className="pb-16">
          <section className="flex flex-col gap-6 py-9 sm:flex-row sm:items-end sm:justify-between sm:py-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
                Your thinking desk
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Welcome back.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">
                A little space to catch what is on your mind and see it clearly.
              </p>
            </div>

            <AddThoughtDialog />
          </section>

          {loadError ? (
            <p
              role="alert"
              className="mb-6 rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground"
            >
              {loadError}
            </p>
          ) : null}

          <WorkflowSection />
          <DailySummarySection summary={dailySummary} error={summaryError} />
          <OverviewSection
            thoughts={thoughts}
            todayCount={todayThoughts?.length ?? null}
            view={query.view}
          />
          <Suspense fallback={<ThoughtToolbarFallback />}>
            <ThoughtToolbar />
          </Suspense>
          <ThoughtFeed
            thoughts={thoughts}
            todayThoughts={todayThoughts}
            recentThoughts={recentThoughts}
            query={query}
            returnTo={returnTo}
          />
          {query.view === "active" ? (
            <RevisitSection thoughts={revisitThoughts} error={revisitError} returnTo={returnTo} />
          ) : null}
        </div>
      </div>
    </main>
  );
}

function WorkflowSection() {
  return (
    <section
      aria-labelledby="workflow-heading"
      className="border-y border-border py-5 sm:py-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-brand-muted" />
          <h2 id="workflow-heading" className="text-sm font-semibold text-ink-strong">
            The thought loop
          </h2>
        </div>
        <p className="text-xs text-ink-muted">A model for moving an idea forward</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:items-center sm:justify-between sm:gap-3">
        {workflowStages.map((stage, index) => (
          <div key={stage.label} className="flex shrink-0 items-center gap-2.5">
            <div
              className={`flex items-center gap-2 ${stage.later ? "text-ink-muted" : "text-ink-body"}`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  stage.later
                    ? "border-dashed border-border text-ink-muted"
                    : "border-border bg-surface-tint text-brand-mid"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-xs font-medium sm:text-sm">{stage.label}</span>
              {stage.later ? (
                <span className="rounded border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
                  Later
                </span>
              ) : null}
            </div>
            {index < workflowStages.length - 1 ? (
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-muted"
                strokeWidth={1.7}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewSection({
  thoughts,
  todayCount,
  view,
}: {
  thoughts: DashboardThought[] | null;
  todayCount: number | null;
  view: ThoughtDashboardQuery["view"];
}) {
  const overviewItems = [
    { label: "Today", detail: "captured today", value: todayCount, icon: Sun },
    {
      label: "Total thoughts",
      detail: "active in your space",
      value: thoughts?.length ?? null,
      icon: Layers3,
    },
    {
      label: "To review",
      detail: "ready for a first review",
      value: thoughts?.filter((thought) => thought.status === "new").length ?? null,
      icon: CheckCheck,
    },
    {
      label: "Priority",
      detail: "with priority set",
      value: thoughts?.filter((thought) => thought.priority > 0).length ?? null,
      icon: Star,
    },
  ];

  return (
    <section aria-labelledby="overview-heading" className="pt-8 sm:pt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="overview-heading" className="text-sm font-semibold text-ink-strong">
          Overview
        </h2>
        <span className="text-xs text-ink-muted">
          {view === "active" ? "Active view" : "Archived view"}
        </span>
      </div>

      <div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
        {overviewItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`min-h-29 py-4 sm:py-5 ${
                index % 2 === 0 ? "pr-4 sm:pr-6" : "pl-4 sm:pl-6"
              } ${
                index > 1 ? "border-t border-line-subtle sm:border-t-0" : ""
              } ${index > 0 ? "sm:border-l sm:border-line-subtle sm:pl-6" : ""}`}
            >
              <div className="flex items-center gap-2 text-ink-muted">
                <Icon aria-hidden="true" className="size-3.5 text-brand-mid" strokeWidth={1.8} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-strong">
                {item.value ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ThoughtToolbarFallback() {
  return (
    <section aria-label="Thought search and filters" className="pt-8 sm:pt-10">
      <div className="h-11 rounded-lg border border-border bg-card/80" />
      <div className="mt-3 h-11 rounded-lg border border-border bg-card/80" />
    </section>
  );
}

function ThoughtFeed({
  thoughts,
  todayThoughts,
  recentThoughts,
  query,
  returnTo,
}: {
  thoughts: DashboardThought[] | null;
  todayThoughts: DashboardThought[] | null;
  recentThoughts: DashboardThought[] | null;
  query: ThoughtDashboardQuery;
  returnTo: string;
}) {
  const noResultsMessage = getNoResultsMessage(query);

  return (
    <section aria-labelledby="thought-feed-heading" className="pt-10 sm:pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Your collection
          </p>
          <h2
            id="thought-feed-heading"
            className="mt-1 text-xl font-semibold tracking-tight text-ink-strong"
          >
            {query.view === "active" ? "Thought feed" : "Archived thoughts"}
          </h2>
        </div>
        <span className="text-xs text-ink-muted">
          {query.view === "active" ? "Today and recently captured" : "Archived from your active thoughts"}
        </span>
      </div>

      {thoughts === null || thoughts.length === 0 ? (
        <div className="mt-4 flex min-h-39 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/45 px-5 py-6 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-tint text-ring">
            <BrainCircuit aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-sm font-medium text-ink-body">
            {thoughts === null ? "Thoughts could not be loaded" : noResultsMessage}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-ink-muted">
            {thoughts === null ? "Refresh the page and try again." : "Try adjusting or clearing the current search and filters."}
          </p>
        </div>
      ) : query.view === "archived" ? (
        <ThoughtFeedSection
          title="Archived"
          detail="Restore a thought from its actions to return it to the active view"
          icon={Clock}
          thoughts={thoughts}
          emptyMessage={noResultsMessage}
          returnTo={returnTo}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          <ThoughtFeedSection
            title="Today"
            detail="A focused view of today's thoughts"
            icon={Sun}
            thoughts={todayThoughts}
            emptyMessage="No thoughts captured today"
            returnTo={returnTo}
          />
          <ThoughtFeedSection
            title="Recent"
            detail="The latest additions to your space"
            icon={Clock}
            thoughts={recentThoughts}
            emptyMessage="No earlier thoughts"
            returnTo={returnTo}
          />
        </div>
      )}
    </section>
  );
}

function getNoResultsMessage(query: ThoughtDashboardQuery) {
  const hasFilters =
    query.status !== "all" ||
    query.priority !== "all" ||
    query.userRating !== "all" ||
    query.systemRating !== "all";

  if (query.search && hasFilters) return "No thoughts match this search and these filters";
  if (query.search) return "No matching thoughts";
  if (hasFilters) return "No thoughts match these filters";
  return query.view === "archived" ? "No archived thoughts" : "No thoughts yet";
}

type ThoughtFeedSectionProps = {
  title: string;
  detail: string;
  icon: LucideIcon;
  thoughts: DashboardThought[] | null;
  emptyMessage: string;
  returnTo: string;
};

function ThoughtFeedSection({
  title,
  detail,
  icon: Icon,
  thoughts,
  emptyMessage,
  returnTo,
}: ThoughtFeedSectionProps) {
  return (
    <section aria-label={`${title} thoughts`} className="min-w-0 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-strong">{title}</h3>
          <p className="mt-1 text-xs text-ink-muted">{detail}</p>
        </div>
        <Icon aria-hidden="true" className="size-4 text-brand-mid" strokeWidth={1.8} />
      </div>

      {thoughts === null ? (
        <div className="mt-4 flex min-h-39 items-center justify-center rounded-lg border border-dashed border-border bg-card/45 px-5 py-6 text-center">
          <p className="text-sm text-muted-foreground">Thoughts could not be loaded.</p>
        </div>
      ) : thoughts.length === 0 ? (
        <div className="mt-4 flex min-h-39 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/45 px-5 py-6 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-tint text-ring">
            <BrainCircuit aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </div>
          <p className="mt-3 text-sm font-medium text-ink-body">{emptyMessage}</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-ink-muted">
            Saved thoughts will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-3">
          {thoughts.map((thought) => (
            <ThoughtCard key={thought.id} thought={thought} returnTo={returnTo} />
          ))}
        </div>
      )}
    </section>
  );
}

function DailySummarySection({
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
          <div className="grid grid-cols-2 border-y border-border sm:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`py-3 ${index % 2 === 1 ? "pl-4" : "pr-4"} ${
                  index > 1 ? "border-t border-line-subtle sm:border-t-0" : ""
                } ${index > 0 ? "sm:border-l sm:border-line-subtle sm:pl-4" : ""}`}
              >
                <p className="text-[11px] font-medium text-ink-muted">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-ink-strong">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-ink-muted sm:flex-row sm:gap-6">
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

function RevisitSection({
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
        <div className="border-t border-border">
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