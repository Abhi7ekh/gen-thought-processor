"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowUpRight, CheckCheck, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";

import {
  deleteThought,
  markThoughtReviewed,
  setThoughtArchived,
  updateThoughtContent,
} from "@/actions/thoughts";
import { SystemEvaluationControl } from "@/features/thoughts/system-evaluation-control";
import { PriorityControl } from "@/features/thoughts/priority-control";
import { StatusControl } from "@/features/thoughts/status-control";
import { UserRatingControl } from "@/features/thoughts/user-rating-control";
import type { DashboardThought } from "@/features/thoughts/thought-types";

const thoughtDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

type ThoughtCardProps = {
  thought: DashboardThought;
  showReviewAction?: boolean;
  variant?: "card" | "detail";
  returnTo?: string;
};

export function ThoughtCard({
  thought: initialThought,
  showReviewAction = false,
  variant = "card",
  returnTo = "/",
}: ThoughtCardProps) {
  const router = useRouter();
  const [thought, setThought] = useState(initialThought);
  const [heading, setHeading] = useState(initialThought.heading);
  const [elaboration, setElaboration] = useState(initialThought.elaboration);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [error, setError] = useState("");
  const actionInFlight = useRef(false);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editDialogRef.current && !editDialogRef.current.open) {
      editDialogRef.current.showModal();
      headingRef.current?.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isDeleting && deleteDialogRef.current && !deleteDialogRef.current.open) {
      deleteDialogRef.current.showModal();
    }
  }, [isDeleting]);

  function openEdit() {
    setHeading(thought.heading);
    setElaboration(thought.elaboration);
    setError("");
    setIsEditing(true);
    menuRef.current?.removeAttribute("open");
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setIsWorking(true);
    setError("");

    try {
      const result = await updateThoughtContent(thought.id, heading, elaboration);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setThought((current) => ({ ...current, ...result.thought }));
      editDialogRef.current?.close();
    } catch {
      setError("This thought could not be saved. Please try again.");
    } finally {
      actionInFlight.current = false;
      setIsWorking(false);
    }
  }

  async function handleArchive() {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setIsWorking(true);
    setError("");
    menuRef.current?.removeAttribute("open");

    try {
      const result = await setThoughtArchived(thought.id, !thought.archived);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    } catch {
      setError("This thought could not be updated. Please try again.");
    } finally {
      actionInFlight.current = false;
      setIsWorking(false);
    }
  }

  async function handleMarkReviewed() {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setIsWorking(true);
    setError("");
    menuRef.current?.removeAttribute("open");

    try {
      const result = await markThoughtReviewed(thought.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    } catch {
      setError("This thought could not be marked as reviewed. Please try again.");
    } finally {
      actionInFlight.current = false;
      setIsWorking(false);
    }
  }

  async function handleDelete() {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    setIsWorking(true);
    setError("");

    try {
      const result = await deleteThought(thought.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      deleteDialogRef.current?.close();
      router.refresh();
    } catch {
      setError("This thought could not be deleted. Please try again.");
    } finally {
      actionInFlight.current = false;
      setIsWorking(false);
    }
  }

  const headingId = `thought-heading-${thought.id}`;
  const editTitleId = `thought-edit-title-${thought.id}`;
  const deleteTitleId = `thought-delete-title-${thought.id}`;
  const detailHref = `/thoughts/${thought.id}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <article className={variant === "detail" ? "" : "border-b border-line-soft py-4 last:border-b-0"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            {variant === "detail" ? (
              <h1 id={headingId} className="min-w-0 text-2xl font-semibold leading-tight text-ink-strong sm:text-3xl">
                {thought.heading}
              </h1>
            ) : (
              <h3 id={headingId} className="min-w-0 text-sm font-semibold leading-5 text-ink-strong">
                <Link
                  href={detailHref}
                  aria-label={`Open thought: ${thought.heading}`}
                  className="group/link inline-flex items-start gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span>{thought.heading}</span>
                  <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100" />
                </Link>
              </h3>
            )}
            <time
              dateTime={thought.created_at}
              className="shrink-0 text-[11px] text-ink-muted"
            >
              {thoughtDateFormatter.format(new Date(thought.created_at))} UTC
            </time>
          </div>
          {variant === "detail" ? (
            <p className="mt-2 text-xs text-ink-muted">
              Updated <time dateTime={thought.updated_at}>{thoughtDateFormatter.format(new Date(thought.updated_at))} UTC</time>
            </p>
          ) : null}
          {variant === "detail" ? (
            <div className="mt-6 max-w-3xl whitespace-pre-wrap wrap-break-word text-base leading-7 text-ink-body">
              {thought.elaboration}
            </div>
          ) : (
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-ink-soft">
              {thought.elaboration}
            </p>
          )}
        </div>

        <details ref={menuRef} className="group relative shrink-0">
          <summary
            aria-label={`Actions for ${thought.heading}`}
            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
          >
            <MoreHorizontal aria-hidden="true" className="size-4" />
          </summary>
          <div className="absolute right-0 top-10 z-10 min-w-44 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
            <button
              type="button"
              disabled={isWorking || isStatusSaving}
              onClick={openEdit}
              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
            >
              Edit thought
            </button>
            {showReviewAction && thought.status !== "reviewed" ? (
              <button
                type="button"
                disabled={isWorking || isStatusSaving}
                onClick={handleMarkReviewed}
                className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <CheckCheck aria-hidden="true" className="size-3.5" />
                {isWorking ? "Saving..." : "Mark as reviewed"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={isWorking || isStatusSaving}
              onClick={handleArchive}
              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
            >
              {thought.archived ? (
                <RotateCcw aria-hidden="true" className="size-3.5" />
              ) : (
                <Archive aria-hidden="true" className="size-3.5" />
              )}
              {isWorking ? "Saving..." : thought.archived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              disabled={isWorking || isStatusSaving}
              onClick={() => {
                setError("");
                setIsDeleting(true);
                menuRef.current?.removeAttribute("open");
              }}
              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-danger-foreground hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-danger-ring disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Delete permanently
            </button>
          </div>
        </details>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-secondary-foreground">
        <StatusControl
          key={`${thought.id}-${thought.status}`}
          thoughtId={thought.id}
          heading={thought.heading}
          initialStatus={thought.status}
          onSavingChange={setIsStatusSaving}
        />
        {variant === "detail" ? (
          <span className="rounded-md border border-border bg-card/70 px-2 py-1">
            {thought.archived ? "Archived" : "Active"}
          </span>
        ) : null}
        <PriorityControl
          thoughtId={thought.id}
          heading={thought.heading}
          initialPriority={thought.priority}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 border-t border-line-soft pt-3 sm:flex-row sm:items-center sm:justify-between">
        <UserRatingControl
          thoughtId={thought.id}
          heading={thought.heading}
          initialRating={thought.user_rating}
        />
      </div>
      <SystemEvaluationControl
        thoughtId={thought.id}
        initialRating={thought.system_rating}
        initialDetails={thought.system_rating_details}
      />

      {error && !isEditing && !isDeleting ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-danger-foreground">
          {error}
        </p>
      ) : null}

      <dialog
        ref={editDialogRef}
        aria-labelledby={editTitleId}
        onClose={() => setIsEditing(false)}
        onCancel={(event) => {
          if (actionInFlight.current) event.preventDefault();
        }}
        className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-160 overflow-y-auto rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="border-b border-line-soft px-5 py-5 sm:px-8 sm:py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
            Refine
          </p>
          <h3 id={editTitleId} className="mt-1 text-xl font-semibold tracking-tight text-ink-strong">
            Edit thought
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Existing ratings and evaluation will be preserved.
          </p>
        </div>
        <form onSubmit={handleEdit} className="px-5 py-6 sm:px-8 sm:py-8">
          <label htmlFor={`${editTitleId}-heading`} className="text-sm font-semibold text-ink-body">
            Heading
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              ref={headingRef}
              id={`${editTitleId}-heading`}
              required
              maxLength={200}
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              className="h-12 min-w-0 flex-1 rounded-lg border border-input bg-card px-4 text-sm font-medium text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <span className="text-xs tabular-nums text-muted-foreground">{heading.length}/200</span>
          </div>

          <label htmlFor={`${editTitleId}-elaboration`} className="mt-5 block text-sm font-semibold text-ink-body">
            Elaboration
          </label>
          <textarea
            id={`${editTitleId}-elaboration`}
            required
            maxLength={20_000}
            value={elaboration}
            onChange={(event) => setElaboration(event.target.value)}
            rows={8}
            className="mt-2 min-h-47.5 w-full resize-y rounded-lg border border-input bg-card px-4 py-3 text-sm leading-6 text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
            {elaboration.length.toLocaleString()}/20,000
          </p>

          {isEditing && error ? (
            <p role="alert" className="mt-4 rounded-lg border border-danger-border bg-danger-surface px-3.5 py-3 text-sm text-danger-foreground">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line-soft pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => editDialogRef.current?.close()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isWorking}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
            >
              {isWorking ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={deleteDialogRef}
        aria-labelledby={deleteTitleId}
        onClose={() => setIsDeleting(false)}
        onCancel={(event) => {
          if (actionInFlight.current) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/45"
      >
        <div className="p-5 sm:p-6">
          <h3 id={deleteTitleId} className="text-lg font-semibold text-ink-strong">
            Delete this thought?
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            “{thought.heading}” will be permanently deleted. This cannot be undone.
          </p>
          {isDeleting && error ? (
            <p role="alert" className="mt-4 rounded-lg border border-danger-border bg-danger-surface px-3.5 py-3 text-sm text-danger-foreground">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isWorking}
              onClick={() => deleteDialogRef.current?.close()}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary disabled:opacity-50"
            >
              Keep thought
            </button>
            <button
              type="button"
              disabled={isWorking}
              onClick={handleDelete}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:cursor-wait disabled:opacity-60"
            >
              {isWorking ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        </div>
      </dialog>
    </article>
  );
}