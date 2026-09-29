"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";

import { saveThought } from "@/actions/thoughts";

const headingLimit = 200;
const elaborationLimit = 20_000;

export function AddThoughtDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLInputElement>(null);
  const submissionInFlight = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [heading, setHeading] = useState("");
  const [elaboration, setElaboration] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
      headingRef.current?.focus();
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionInFlight.current || !formRef.current) {
      return;
    }

    submissionInFlight.current = true;
    setIsSaving(true);
    setError("");

    try {
      const result = await saveThought(new FormData(formRef.current));

      if (!result.ok) {
        setError(result.message);
        return;
      }

      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Your thought could not be saved. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSaving(false);
    }
  }

  function resetCapture() {
    formRef.current?.reset();
    setHeading("");
    setElaboration("");
    setError("");
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.4} />
        Add Thought
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="capture-title"
        onClose={resetCapture}
        onCancel={(event) => {
          if (submissionInFlight.current) {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current && !submissionInFlight.current) {
            dialogRef.current?.close();
          }
        }}
        className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-160 overflow-y-auto rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px] sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-5 py-5 sm:px-8 sm:py-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              Capture
            </p>
            <h2 id="capture-title" className="mt-1 text-xl font-semibold tracking-tight text-ink-strong">
              Give the thought a place.
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start with the part you want to remember.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close capture"
            disabled={isSaving}
            onClick={() => dialogRef.current?.close()}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="px-5 py-6 sm:px-8 sm:py-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="thought-heading" className="text-sm font-semibold text-ink-body">
                Heading <span className="text-muted-foreground">(required)</span>
              </label>
              <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
                {heading.length}/{headingLimit}
              </span>
            </div>
            <input
              ref={headingRef}
              id="thought-heading"
              name="heading"
              required
              maxLength={headingLimit}
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              placeholder="What is on your mind?"
              className="mt-2 h-14 w-full rounded-lg border border-input bg-card px-4 text-base font-medium text-card-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:text-lg"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="thought-elaboration" className="text-sm font-semibold text-ink-body">
                Elaboration <span className="text-muted-foreground">(required)</span>
              </label>
              <span aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
                {elaboration.length.toLocaleString()}/{elaborationLimit.toLocaleString()}
              </span>
            </div>
            <textarea
              id="thought-elaboration"
              name="elaboration"
              required
              maxLength={elaborationLimit}
              value={elaboration}
              onChange={(event) => setElaboration(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              placeholder="Add context, questions, or the details you want to keep with this thought..."
              rows={8}
              className="mt-2 min-h-47.5 w-full resize-y rounded-lg border border-input bg-card px-4 py-3 text-sm leading-6 text-card-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:min-h-57.5"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Both fields are required to match the current thought schema.
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-danger-border bg-danger-surface px-3.5 py-3 text-sm text-danger-foreground"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-2 border-t border-line-soft pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check aria-hidden="true" className="size-4" />
              {isSaving ? "Saving..." : "Save Thought"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}