"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowUpRight, Check, LoaderCircle, MessageSquareText, Plus, X } from "lucide-react";

import { loadMoreDashboardThoughts, saveThought } from "@/actions/thoughts";
import type { DashboardThought } from "@/features/thoughts/thought-types";

type DashboardThoughtPreview = Pick<
  DashboardThought,
  "id" | "heading" | "elaboration" | "created_at" | "priority" | "user_rating" | "system_rating"
>;

type DashboardCaptureWorkspaceProps = {
  initialThoughts: DashboardThoughtPreview[] | null;
  initialHasMore: boolean;
};

const headingLimit = 200;
const elaborationLimit = 20_000;

function subscribeToTimeZone() {
  return () => {};
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function dateKey(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateHeading(key: string) {
  const date = new Date(`${key}T12:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export function DashboardCaptureWorkspace({
  initialThoughts,
  initialHasMore,
}: DashboardCaptureWorkspaceProps) {
  const [thoughts, setThoughts] = useState(initialThoughts ?? []);
  const [databaseLoadedCount, setDatabaseLoadedCount] = useState(initialThoughts?.length ?? 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [heading, setHeading] = useState("");
  const [elaboration, setElaboration] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    getBrowserTimeZone,
    () => "UTC"
  );
  const timeFormatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);
  const submissionInFlight = useRef(false);

  useEffect(() => {
    if (isCaptureOpen) headingRef.current?.focus();
  }, [isCaptureOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current || !formRef.current) return;

    submissionInFlight.current = true;
    setIsSaving(true);
    setError("");
    setStatusMessage("");

    try {
      const result = await saveThought(new FormData(formRef.current));
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setThoughts((current) => [
        result.thought,
        ...current.filter((thought) => thought.id !== result.thought.id),
      ]);
      setDatabaseLoadedCount((current) => current + 1);
      formRef.current.reset();
      setHeading("");
      setElaboration("");
      setIsCaptureOpen(false);
      setStatusMessage("Thought saved and added to your list.");
    } catch {
      setError("Your thought could not be saved. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSaving(false);
    }
  }

  function cancelCapture() {
    if (submissionInFlight.current) return;
    formRef.current?.reset();
    setHeading("");
    setElaboration("");
    setError("");
    setIsCaptureOpen(false);
  }

  async function handleLoadMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setError("");

    try {
      const result = await loadMoreDashboardThoughts(databaseLoadedCount);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setThoughts((current) => {
        const knownIds = new Set(current.map((thought) => thought.id));
        return [...current, ...result.thoughts.filter((thought) => !knownIds.has(thought.id))];
      });
      setDatabaseLoadedCount((current) => current + result.thoughts.length);
      setHasMore(result.hasMore);
    } catch {
      setError("Older thoughts could not be loaded. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const groups = new Map<string, DashboardThoughtPreview[]>();
  for (const thought of thoughts) {
    const key = dateKey(thought.created_at, timeZone);
    const group = groups.get(key);
    if (group) group.push(thought);
    else groups.set(key, [thought]);
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[26px] border border-[#E7E0FF] bg-[#F0E9FF] p-5 dark:border-[#4B426A] dark:bg-[#322A4D] sm:p-7 lg:p-8">
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E59C7] dark:text-[#C0B2FF]">
              Your thinking space
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#21164E] dark:text-[#F1EDFF] sm:text-4xl">
              Capture the thoughts that could change your life.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5F587F] dark:text-[#D0C8E7] sm:text-base sm:leading-7">
              Ideas, habits, goals, and questions worth turning into something real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusMessage("");
              setError("");
              setIsCaptureOpen((open) => !open);
            }}
            aria-expanded={isCaptureOpen}
            aria-controls="dashboard-thought-capture"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(92,70,170,0.2)] transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
          >
            {isCaptureOpen ? <X aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
            {isCaptureOpen ? "Close capture" : "Add Thought"}
          </button>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-14 hidden size-48 rounded-full border-24 border-white/20 lg:block" />
      </section>

      {isCaptureOpen ? (
        <section
          id="dashboard-thought-capture"
          aria-labelledby="capture-heading"
          className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">New thought</p>
              <h3 id="capture-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Give the thought a place.
              </h3>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={cancelCapture}
              aria-label="Cancel thought capture"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="dashboard-thought-heading" className="text-sm font-medium text-foreground">
                  Main Idea
                </label>
                <span className="text-xs tabular-nums text-muted-foreground">{heading.length}/{headingLimit}</span>
              </div>
              <input
                ref={headingRef}
                id="dashboard-thought-heading"
                name="heading"
                required
                maxLength={headingLimit}
                value={heading}
                onChange={(event) => setHeading(event.target.value)}
                placeholder="What do you want to remember?"
                className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="dashboard-thought-elaboration" className="text-sm font-medium text-foreground">
                  Brief Explanation
                </label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {elaboration.length.toLocaleString()}/{elaborationLimit.toLocaleString()}
                </span>
              </div>
              <textarea
                id="dashboard-thought-elaboration"
                name="elaboration"
                required
                maxLength={elaborationLimit}
                rows={5}
                value={elaboration}
                onChange={(event) => setElaboration(event.target.value)}
                placeholder="Add context, a question, or the next step..."
                className="mt-2 min-h-32 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSaving}
                onClick={cancelCapture}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#8B72E8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#765ED2] focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
              >
                {isSaving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
                {isSaving ? "Saving..." : "Save Thought"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {statusMessage ? (
        <p role="status" className="mt-4 rounded-xl border border-[#D9ECDD] bg-[#F0FAF2] px-4 py-3 text-sm text-[#32613D]">
          {statusMessage}
        </p>
      ) : null}
      {error && !isCaptureOpen ? (
        <p role="alert" className="mt-4 rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
          {error}
        </p>
      ) : null}

      <section aria-labelledby="dashboard-thoughts-heading" className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Your collection</p>
            <h3 id="dashboard-thoughts-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Thoughts
            </h3>
          </div>
          <Link href="/thoughts" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
            Search and filter
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {initialThoughts === null && thoughts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-accent/30 px-5 py-10 text-center">
            <MessageSquareText aria-hidden="true" className="mx-auto size-8 text-brand-mid" />
            <p className="mt-3 text-sm font-semibold text-foreground">Your thoughts could not be loaded.</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh the page and try again.</p>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-accent/30 px-5 py-10 text-center">
            <MessageSquareText aria-hidden="true" className="mx-auto size-8 text-brand-mid" />
            <p className="mt-3 text-sm font-semibold text-foreground">No thoughts yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Capture the first idea you want to keep.</p>
          </div>
        ) : (
          <div className="space-y-7">
            {[...groups.entries()].map(([key, dayThoughts]) => (
              <section key={key} aria-label={`Thoughts from ${dateHeading(key)}`}>
                <h4 className="mb-3 text-sm font-semibold text-ink-strong">
                  {dateHeading(key)}
                </h4>
                <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {dayThoughts.map((thought) => (
                    <Link
                      key={thought.id}
                      href={`/thoughts/${thought.id}`}
                      className="group flex min-h-44 min-w-0 flex-col rounded-[20px] border border-border bg-card p-4 shadow-[0_8px_22px_rgba(67,50,124,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#CFC2FF] hover:shadow-[0_14px_30px_rgba(67,50,124,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="line-clamp-2 min-w-0 text-base font-semibold leading-6 text-foreground">
                          {thought.heading}
                        </h5>
                        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-brand-mid opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                      </div>
                      <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-5 text-ink-soft">
                        {thought.elaboration}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                        <time dateTime={thought.created_at}>
                          {timeFormatter.format(new Date(thought.created_at))}
                        </time>
                        <span className="flex items-center gap-2">
                          {(thought.priority ?? 0) > 0 ? (
                            <span className="rounded-full bg-[#FFF2D6] px-2 py-1 font-medium text-[#715515] dark:bg-[#493C25] dark:text-[#F0D18A]">
                              Priority {thought.priority}/5
                            </span>
                          ) : null}
                          {typeof thought.user_rating === "number" ? (
                            <span className="rounded-full bg-[#E8F0FF] px-2 py-1 font-medium text-[#36558A] dark:bg-[#29374F] dark:text-[#B8CEFF]">
                              Rating {thought.user_rating}/10
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingMore ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
              {isLoadingMore ? "Loading..." : "Load older thoughts"}
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
