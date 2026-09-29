import {
  systemEvaluationSchema,
  systemEvaluationWeights,
  type SystemEvaluation,
} from "@/features/thoughts/system-evaluation-schema";

const signalTerms = {
  importance: [
    "impact", "important", "problem", "risk", "safety", "health", "cost", "save",
    "customer", "community", "people", "team", "revenue", "quality", "access",
    "environment", "harm", "benefit",
  ],
  originality: [
    "new", "novel", "unique", "unusual", "different", "unexpected", "original",
    "alternative", "combine", "rethink", "reimagine", "distinct",
  ],
  potential: [
    "could", "potential", "grow", "scale", "improve", "enable", "create", "build",
    "launch", "learn", "solve", "help", "benefit", "opportunity",
  ],
  feasibility: [
    "prototype", "mvp", "pilot", "test", "first step", "existing", "simple", "available",
    "start", "implement", "build", "try", "small", "week", "month",
  ],
  urgency: [
    "urgent", "urgently", "today", "now", "soon", "deadline", "asap", "immediately",
    "expiring", "overdue", "this week", "this month", "time-sensitive",
  ],
} as const;

const blockerTerms = [
  "blocked", "blocker", "cannot", "can't", "unable", "depends on", "dependency",
  "approval", "unknown", "untested", "expensive", "no access",
];

function normalizeText(value: string) {
  return ` ${value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
}

function findSignals(text: string, terms: readonly string[]) {
  return terms.filter((term) => text.includes(` ${term.replace(/[^\p{L}\p{N}]+/gu, " ")} `));
}

function clampScore(score: number) {
  return Math.min(10, Math.max(1, score));
}

function rationale(label: string, matches: readonly string[], fallback: string) {
  const evidence = matches.length > 0 ? `Matched text cues: ${matches.join(", ")}.` : fallback;
  return `${label} uses local keyword signals, not semantic or external research. ${evidence}`;
}

export function evaluateThoughtLocally(heading: string, elaboration: string) {
  const source = `${heading} ${elaboration}`;
  const normalized = normalizeText(source);
  const words = normalized.trim().split(/\s+/u).filter(Boolean);

  const importanceSignals = findSignals(normalized, signalTerms.importance);
  const originalitySignals = findSignals(normalized, signalTerms.originality);
  const potentialSignals = findSignals(normalized, signalTerms.potential);
  const feasibilitySignals = findSignals(normalized, signalTerms.feasibility);
  const urgencySignals = findSignals(normalized, signalTerms.urgency);
  const blockerSignals = findSignals(normalized, blockerTerms);
  const hasRelativeDeadline =
    /\b(?:by|before|within)\s+(?:\d+\s+)?(?:day|days|week|weeks|month|months|hour|hours)\b/u.test(normalized);
  const hasNumericDeadline =
    /\b(?:by|before|due(?:\s+on)?|deadline(?:\s+is)?)\s+\d{1,4}[/-]\d{1,2}(?:[/-]\d{1,4})?\b/iu.test(source);
  const hasDeadline = hasRelativeDeadline || hasNumericDeadline;

  const dimensions = {
    importance: {
      score: clampScore(3 + Math.min(importanceSignals.length, 7)),
      rationale: rationale(
        "Importance",
        importanceSignals,
        "No direct impact cues were detected, so the baseline score is conservative."
      ),
    },
    originality: {
      score: clampScore(3 + Math.min(originalitySignals.length * 2, 7)),
      rationale: rationale(
        "Originality",
        originalitySignals,
        "No explicit novelty cues were detected; external ideas are not compared."
      ),
    },
    potential: {
      score: clampScore(3 + Math.min(potentialSignals.length, 7)),
      rationale: rationale(
        "Potential",
        potentialSignals,
        "No direct upside cues were detected, so the baseline score is conservative."
      ),
    },
    feasibility: {
      score: clampScore(
        5 + Math.min(feasibilitySignals.length, 3) - Math.min(blockerSignals.length * 2, 7)
      ),
      rationale: rationale(
        "Feasibility",
        [...feasibilitySignals, ...blockerSignals.map((term) => `blocker: ${term}`)],
        "No clear action or blocker cues were detected; the score stays at the neutral baseline."
      ),
    },
    urgency: {
      score: clampScore(2 + Math.min(urgencySignals.length * 2, 6) + (hasDeadline ? 2 : 0)),
      rationale: rationale(
        "Urgency",
        hasDeadline ? [...urgencySignals, "deadline phrasing"] : urgencySignals,
        "No deadline or time-sensitive cues were detected, so urgency remains low."
      ),
    },
  };

  const overallScore = Math.round(
    systemEvaluationWeights.importance * dimensions.importance.score +
      systemEvaluationWeights.originality * dimensions.originality.score +
      systemEvaluationWeights.potential * dimensions.potential.score +
      systemEvaluationWeights.feasibility * dimensions.feasibility.score +
      systemEvaluationWeights.urgency * dimensions.urgency.score
  );

  const signalCoverage = [
    importanceSignals,
    originalitySignals,
    potentialSignals,
    [...feasibilitySignals, ...blockerSignals],
    [...urgencySignals, ...(hasDeadline ? ["deadline phrasing"] : [])],
  ].filter((matches) => matches.length > 0).length;
  const confidence = Math.round(
    Math.min(0.9, 0.15 + Math.min(words.length / 100, 0.3) + (signalCoverage / 5) * 0.4) * 100
  ) / 100;

  const evaluation: SystemEvaluation = {
    schema_version: 1,
    rubric_version: "thought-evaluation-1",
    evaluated_at: new Date().toISOString(),
    trigger: "user_requested",
    confidence,
    aggregation: {
      method: "weighted_mean_rounded",
      weights: systemEvaluationWeights,
    },
    dimensions,
    limitations: [
      "This is a deterministic local heuristic, not an AI-generated assessment.",
      "Keyword matching cannot reliably understand context, tone, or personal priorities.",
      "Originality is not compared with external ideas or research.",
      "Confidence reflects text length and signal coverage, not statistical certainty.",
    ],
    provider: null,
    model: null,
  };

  const validated = systemEvaluationSchema.safeParse(evaluation);
  if (!validated.success) {
    throw new Error("Local evaluation did not match the evaluation schema.");
  }

  return { systemRating: overallScore, details: validated.data };
}