import Link from "next/link";
import { Suspense } from "react";
import { BrainCircuit, Clock, Sun, type LucideIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import type { ThoughtDashboardQuery } from "@/features/thoughts/thought-types";
import { ThoughtCard } from "@/features/thoughts/thought-card";
import { ThoughtToolbar } from "@/features/thoughts/thought-toolbar";
import type { ProfileIdentity } from "@/lib/profile";

type ThoughtsWorkspaceProps = {
  profile: ProfileIdentity;
  thoughts: DashboardThought[] | null;
  hasMore: boolean;
  loadError?: string;
  query: ThoughtDashboardQuery;
  returnTo: string;
  previousPageHref?: string;
  nextPageHref?: string;
};

export function ThoughtsWorkspace({
  profile,
  thoughts,
  hasMore,
  loadError,
  query,
  returnTo,
  previousPageHref,
  nextPageHref,
}: ThoughtsWorkspaceProps) {
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
    <AppShell profile={profile} title="Thoughts">
      <div>
        <section className="pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
            Thought workspace
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Thoughts
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">
            Browse, organize, and revisit your captured thoughts.
          </p>
        </section>

        {loadError ? (
          <p
            role="alert"
            className="mb-6 rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground"
          >
            {loadError}
          </p>
        ) : null}

        <Suspense fallback={<ThoughtToolbarFallback />}>
          <ThoughtToolbar />
        </Suspense>
        <ThoughtFeed
          thoughts={thoughts}
          todayThoughts={todayThoughts}
          recentThoughts={recentThoughts}
          query={query}
          returnTo={returnTo}
          previousPageHref={previousPageHref}
          nextPageHref={nextPageHref}
        />
      </div>
    </AppShell>
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
  previousPageHref,
  nextPageHref,
}: {
  thoughts: DashboardThought[] | null;
  todayThoughts: DashboardThought[] | null;
  recentThoughts: DashboardThought[] | null;
  query: ThoughtDashboardQuery;
  returnTo: string;
  previousPageHref?: string;
  nextPageHref?: string;
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
      <nav aria-label="Thought pages" className="mt-6 flex items-center justify-between border-t border-border pt-4">
        {previousPageHref ? (
          <Link href={previousPageHref} rel="prev" className="text-sm font-medium text-secondary-foreground hover:underline">Previous</Link>
        ) : <span />}
        <span className="text-xs text-ink-muted">Page {query.page}</span>
        {nextPageHref ? (
          <Link href={nextPageHref} rel="next" className="text-sm font-medium text-secondary-foreground hover:underline">Next</Link>
        ) : <span />}
      </nav>
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
    <section aria-label={`${title} thoughts`} className="min-w-0">
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
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {thoughts.map((thought) => (
            <ThoughtCard key={thought.id} thought={thought} returnTo={returnTo} />
          ))}
        </div>
      )}
    </section>
  );
}
