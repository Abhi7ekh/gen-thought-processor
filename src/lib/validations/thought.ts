import { z } from "zod";

export const thoughtIdSchema = z.string().uuid();

export const thoughtStatusValues = ["new", "reviewed", "important"] as const;
export const thoughtStatusSchema = z.enum(thoughtStatusValues);
export type ThoughtStatus = (typeof thoughtStatusValues)[number];

export const thoughtStatusOptions = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "important", label: "Important" },
] as const satisfies { value: ThoughtStatus; label: string }[];

export const thoughtPriorityOptions = [
  { value: 0, label: "No priority" },
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
  { value: 4, label: "Critical" },
  { value: 5, label: "Critical / Top" },
] as const;

export type ThoughtPriority = (typeof thoughtPriorityOptions)[number]["value"];

export const thoughtPrioritySchema = z.number().int().refine(
  (value): value is ThoughtPriority =>
    thoughtPriorityOptions.some((option) => option.value === value),
  "Choose a priority from 0 to 5."
);

export const thoughtContentSchema = z.object({
  heading: z.string().trim().min(1, "Add a heading for this thought.").max(200),
  elaboration: z
    .string()
    .trim()
    .min(1, "Add a little detail before saving.")
    .max(20_000),
});