"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { Json } from "@/lib/supabase/database.types";

import { evaluateThought } from "@/actions/thoughts";
import {
  systemEvaluationSchema,
  type SystemEvaluation,
} from "@/features/thoughts/system-evaluation-schema";

const dimensions = [
  ["Importance", "importance"],
  ["Originality", "originality"],
  ["Potential", "potential"],
  ["Feasibility", "feasibility"],
  ["Urgency", "urgency"],
] as const;

type SystemEvaluationControlProps = {
  thoughtId: string;
  initialRating: number | null;
  initialDetails: Json | null;
};

export function SystemEvaluationControl({
  thoughtId,
  initialRating,
  initialDetails,
}: SystemEvaluationControlProps) {
  const submissionInFlight = useRef(false);
  const storedEvaluation = systemEvaluationSchema.safeParse(initialDetails);
  const [systemRating, setSystemRating] = useState(initialRating);
  const [evaluation, setEvaluation] = useState<SystemEvaluation | null>(
    storedEvaluation.success ? storedEvaluation.data : null
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState("");

  async function handleEvaluate() {
    if (submissionInFlight.current) {
      return;
    }

    submissionInFlight.current = true;
    setIsEvaluating(true);
    setError("");

    try {
      const result = await evaluateThought(thoughtId);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSystemRating(result.systemRating);
      setEvaluation(result.evaluation);
    } catch {
      setError("The evaluation could not be saved. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsEvaluating(false);
    }
  }

  return (
    <section aria-label="System rating" className="min-w-0 border-t border-line-soft pt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-brand-muted" />
          <span className="text-xs font-medium text-secondary-foreground">System rating</span>
          <span className="text-sm font-semibold tabular-nums text-ink-strong">
            {systemRating === null ? "Not evaluated" : `${systemRating}/10`}
          </span>
        </div>
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
        >
          {isEvaluating ? (
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="size-3.5" />
          )}
          {isEvaluating ? "Evaluating..." : evaluation ? "Re-evaluate" : "Evaluate"}
        </button>
      </div>

      {evaluation ? (
        <div className="mt-3 rounded-lg border border-border bg-card/55 p-3 sm:p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-body">
              Development evaluation
            </h5>
            <span className="text-[10px] text-ink-muted">
              Local heuristic · Not AI-generated
            </span>
          </div>

          <dl className="mt-3 divide-y divide-line-subtle">
            {dimensions.map(([label, key]) => {
              const dimension = evaluation.dimensions[key];
              return (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
                  <dt className="text-xs font-semibold text-secondary-foreground">{label}</dt>
                  <dd className="row-span-2 text-xs font-semibold tabular-nums text-brand-muted">
                    {dimension.score}/10
                  </dd>
                  <dd className="text-xs leading-5 text-muted-foreground">{dimension.rationale}</dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-subtle pt-3 text-[10px] text-ink-muted">
            <span>Confidence: {Math.round(evaluation.confidence * 100)}% (heuristic)</span>
            <span>Rubric: {evaluation.rubric_version}</span>
          </div>
          <ul className="mt-2 space-y-1 text-[10px] leading-4 text-ink-muted">
            {evaluation.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      ) : systemRating !== null ? (
        <p className="mt-2 text-xs text-ink-muted">
          Evaluation details are unavailable. Re-evaluate to generate them.
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-muted">
          Not evaluated yet. This local heuristic is not an AI assessment.
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs leading-5 text-danger-foreground">
          {error}
        </p>
      ) : null}
    </section>
  );
}