"use client";

import { useRef, useState } from "react";
import { Flag, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateThoughtPriority } from "@/actions/thoughts";
import {
  thoughtPriorityOptions,
  thoughtPrioritySchema,
  type ThoughtPriority,
} from "@/lib/validations/thought";

type PriorityControlProps = {
  thoughtId: string;
  heading: string;
  initialPriority: ThoughtPriority;
};

export function PriorityControl({ thoughtId, heading, initialPriority }: PriorityControlProps) {
  const router = useRouter();
  const requestInFlight = useRef(false);
  const [priority, setPriority] = useState(initialPriority);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(value: string) {
    if (requestInFlight.current) return;

    const parsed = thoughtPrioritySchema.safeParse(Number(value));
    if (!parsed.success) {
      setError("Choose a valid priority from 0 to 5.");
      return;
    }

    const previousPriority = priority;
    requestInFlight.current = true;
    setPriority(parsed.data);
    setIsSaving(true);
    setError("");

    try {
      const result = await updateThoughtPriority(thoughtId, parsed.data);
      if (!result.ok) {
        setPriority(previousPriority);
        setError(result.message);
        return;
      }

      setPriority(result.priority);
      router.refresh();
    } catch {
      setPriority(previousPriority);
      setError("Priority could not be saved. Please try again.");
    } finally {
      requestInFlight.current = false;
      setIsSaving(false);
    }
  }

  const controlId = `priority-${thoughtId}`;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={controlId} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
          <Flag aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          Priority
        </label>
        <select
          id={controlId}
          aria-label={`Priority for ${heading}`}
          value={priority}
          onChange={(event) => void handleChange(event.currentTarget.value)}
          disabled={isSaving}
          className="h-9 min-w-32 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-wait disabled:opacity-60"
        >
          {thoughtPriorityOptions.map((option) => (
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