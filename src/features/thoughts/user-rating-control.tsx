"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { LoaderCircle, Star } from "lucide-react";

import { updateThoughtRating } from "@/actions/thoughts";

type UserRatingControlProps = {
  thoughtId: string;
  heading: string;
  initialRating: number | null;
};

export function UserRatingControl({
  thoughtId,
  heading,
  initialRating,
}: UserRatingControlProps) {
  const submissionInFlight = useRef(false);
  const [rating, setRating] = useState(initialRating);
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    if (submissionInFlight.current) {
      return;
    }

    const nextRating = Number(event.currentTarget.value);
    if (!Number.isInteger(nextRating) || nextRating < 1 || nextRating > 10) {
      return;
    }

    const previousRating = rating;
    submissionInFlight.current = true;
    setSelectedRating(nextRating);
    setIsSaving(true);
    setError("");

    try {
      const result = await updateThoughtRating(thoughtId, nextRating);

      if (!result.ok) {
        setSelectedRating(previousRating);
        setError(result.message);
        return;
      }

      setRating(result.rating);
      setSelectedRating(result.rating);
    } catch {
      setSelectedRating(previousRating);
      setError("Your rating could not be saved. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSaving(false);
    }
  }

  const selectId = `thought-rating-${thoughtId}`;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor={selectId} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted">
          <Star aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          Your rating
        </label>
        <select
          id={selectId}
          aria-label={`Your rating for ${heading}`}
          value={selectedRating ?? ""}
          onChange={handleChange}
          disabled={isSaving}
          className="h-9 min-w-28 rounded-md border border-input bg-card px-2.5 text-xs font-medium text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-wait disabled:opacity-60"
        >
          {selectedRating === null ? (
            <option value="" disabled>
              Not rated
            </option>
          ) : null}
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} / 10
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