import { z } from "zod";

export const systemEvaluationWeights = {
  importance: 0.25,
  originality: 0.15,
  potential: 0.25,
  feasibility: 0.2,
  urgency: 0.15,
} as const;

const dimensionEvaluationSchema = z.object({
  score: z.number().int().min(1).max(10),
  rationale: z.string().trim().min(1).max(500),
}).strict();

export const systemEvaluationSchema = z.object({
  schema_version: z.literal(1),
  rubric_version: z.literal("thought-evaluation-1"),
  evaluated_at: z.string().datetime(),
  trigger: z.literal("user_requested"),
  confidence: z.number().min(0).max(1),
  aggregation: z.object({
    method: z.literal("weighted_mean_rounded"),
    weights: z.object({
      importance: z.literal(systemEvaluationWeights.importance),
      originality: z.literal(systemEvaluationWeights.originality),
      potential: z.literal(systemEvaluationWeights.potential),
      feasibility: z.literal(systemEvaluationWeights.feasibility),
      urgency: z.literal(systemEvaluationWeights.urgency),
    }).strict(),
  }).strict(),
  dimensions: z.object({
    importance: dimensionEvaluationSchema,
    originality: dimensionEvaluationSchema,
    potential: dimensionEvaluationSchema,
    feasibility: dimensionEvaluationSchema,
    urgency: dimensionEvaluationSchema,
  }).strict(),
  limitations: z.array(z.string().trim().min(1).max(500)),
  provider: z.null(),
  model: z.null(),
}).strict();

export type SystemEvaluation = z.infer<typeof systemEvaluationSchema>;