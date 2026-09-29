"use client";

import { useRef, useState } from "react";
import { CircleDot, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateThoughtStatus } from "@/actions/thoughts";
import {
  thoughtStatusOptions,
  thoughtStatusSchema,
  type ThoughtStatus,
} from "@/lib/validations/thought";

type StatusControlProps = {
  thoughtId: string;
  heading: string;
  initialStatus: ThoughtStatus;
  onSavingChange?: (isSaving: boolean) => void;
};

export function StatusControl({
  thoughtId,
  heading,
  initialStatus,
  onSavingChange,
}: StatusControlProps) {
  const router = useRouter();
  const requestInFlight = useRef(false);
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(value: string) {
    if (requestInFlight.current) return;

    const parsed = thoughtStatusSchema.safeParse(value);
    if (!parsed.success) {
      setError("Choose a valid thought status.");
      return;
    }

    const previousStatus = status;
    requestInFlight.current = true;
    setStatus(parsed.data);
    setIsSaving(true);
    onSavingChange?.(true);
    setError("");

    try {
      const result = await updateThoughtStatus(thoughtId, parsed.data);
      if (!result.ok) {
        setStatus(previousStatus);
        setError(result.message);
        return;
      }

      setStatus(result.status);
      router.refresh();
    } catch {
      setStatus(previousStatus);
      setError("This thought's status could not be changed. Please try again.");
    } finally {
      requestInFlight.current = false;
      setIsSaving(false);
      onSavingChange?.(false);
    }
  }

  const controlId = `thought-status-${thoughtId}`;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={controlId}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted"
        >
          <CircleDot aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          Status
        </label>
        <select
          id={controlId}
          aria-label={`Status for ${heading}`}
          value={status}
          onChange={(event) => void handleChange(event.currentTarget.value)}
          disabled={isSaving}
          className="h-9 min-w-32 rounded-md border border-input bg-card px-2.5 text-xs font-medium capitalize text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-wait disabled:opacity-60"
        >
          {thoughtStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isSaving ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
            Saving
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 max-w-sm text-xs leading-5 text-danger-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}