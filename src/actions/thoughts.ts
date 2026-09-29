"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { evaluateThoughtLocally } from "@/features/thoughts/evaluate-thought-locally";
import { systemEvaluationSchema } from "@/features/thoughts/system-evaluation-schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  thoughtContentSchema,
  thoughtIdSchema,
  thoughtPrioritySchema,
  thoughtStatusSchema,
} from "@/lib/validations/thought";

type SupabaseErrorDetails = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
};

function sanitizeDiagnosticText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  if (/failing row contains|duplicate key value|key\s*\([^)]*\)\s*=\s*\(/i.test(value)) {
    return "[omitted: may contain thought content]";
  }

  return value
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]")
    .replace(/\b(?:sb_(?:secret|publishable)_|(?:sk|pk)_(?:live|test)_)[A-Za-z0-9_-]+/gi, "[REDACTED_KEY]")
    .replace(
      /\b(authorization|cookie|password|passphrase|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|secret|private[_-]?key)\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1$2[REDACTED]"
    )
    .replace(/([?&](?:access[_-]?token|refresh[_-]?token|token|api[_-]?key|apikey|key|password)=)[^&\s]*/gi, "$1[REDACTED]")
    .replace(/(?:postgres(?:ql)?:\/\/)[^\s]+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/(https?:\/\/[^\s/:@]+:)[^\s@]+@/gi, "$1[REDACTED]@")
    .slice(0, 500);
}

function safeSupabaseDiagnostic(error: SupabaseErrorDetails) {
  const code = typeof error.code === "string" && /^[A-Z0-9_-]{1,32}$/i.test(error.code)
    ? error.code
    : undefined;

  return {
    code,
    message: sanitizeDiagnosticText(error.message),
    details: sanitizeDiagnosticText(error.details),
    hint: sanitizeDiagnosticText(error.hint),
    status: typeof error.status === "number" ? error.status : undefined,
  };
}

function getInsertFailureMessage(error: { code?: string; message?: string; status?: number }) {
  if (error.code === "42501" || /row.level security|violates.*policy/i.test(error.message ?? "")) {
    return "The database denied this save under its security policy. Confirm you're signed in and try again.";
  }

  if (["22001", "23502", "23503", "23505", "23514"].includes(error.code ?? "")) {
    return "This thought did not meet a database requirement. Check the heading and elaboration, then try again.";
  }

  if (error.status !== undefined && error.status >= 500) {
    return "Thought saving is temporarily unavailable. Please try again shortly.";
  }

  return "Your thought could not be saved. Please try again.";
}

const thoughtRatingSchema = z.object({
  thoughtId: z.string().uuid(),
  rating: z.number().int().min(1).max(10),
});

function getRatingFailureMessage(error: { code?: string; message?: string; status?: number }) {
  if (error.code === "42501" || /row.level security|violates.*policy/i.test(error.message ?? "")) {
    return "You don't have permission to rate this thought.";
  }

  if (error.code === "23514") {
    return "Choose a rating from 1 to 10 and try again.";
  }

  if (error.status !== undefined && error.status >= 500) {
    return "Rating is temporarily unavailable. Please try again shortly.";
  }

  return "Your rating could not be saved. Please try again.";
}

export async function saveThought(formData: FormData) {
  const parsed = thoughtContentSchema.safeParse({
    heading: formData.get("heading"),
    elaboration: formData.get("elaboration"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the thought and try again.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      if (sessionError) {
        console.error(
          "[thoughts.save] Authentication check failed",
          safeSupabaseDiagnostic(sessionError)
        );
      } else {
        console.warn("[thoughts.save] No authenticated user for thought insert");
      }

      return {
        ok: false as const,
        message: "Your session could not be verified. Please sign in again and retry.",
      };
    }

    const { error } = await supabase.from("thoughts").insert({
      user_id: user.id,
      heading: parsed.data.heading,
      elaboration: parsed.data.elaboration,
    });

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.save] Supabase INSERT failed", diagnostic);

      return {
        ok: false as const,
        message: getInsertFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    try {
      revalidatePath("/");
    } catch (error) {
      console.error("[thoughts.save] Dashboard revalidation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return { ok: true as const };
  } catch (error) {
    console.error("[thoughts.save] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "Your thought could not be saved. Please try again." };
  }
}

const evaluationRequestSchema = z.object({ thoughtId: z.string().uuid() });

export async function evaluateThought(thoughtId: string) {
  const parsedRequest = evaluationRequestSchema.safeParse({ thoughtId });
  if (!parsedRequest.success) {
    return { ok: false as const, message: "This thought could not be evaluated." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      if (sessionError) {
        console.error(
          "[thoughts.evaluation] Authentication check failed",
          safeSupabaseDiagnostic(sessionError)
        );
      } else {
        console.warn("[thoughts.evaluation] No authenticated user for evaluation");
      }

      return {
        ok: false as const,
        message: "Your session could not be verified. Please sign in again and retry.",
      };
    }

    const { data: thought, error: readError } = await supabase
      .from("thoughts")
      .select("heading, elaboration")
      .eq("id", parsedRequest.data.thoughtId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      console.error(
        "[thoughts.evaluation] Thought read failed",
        safeSupabaseDiagnostic(readError)
      );
      return { ok: false as const, message: "This thought could not be loaded for evaluation." };
    }

    if (!thought) {
      return {
        ok: false as const,
        message: "This thought could not be found or is not available to your account.",
      };
    }

    const result = evaluateThoughtLocally(thought.heading, thought.elaboration);
    const validatedEvaluation = systemEvaluationSchema.safeParse(result.details);
    if (!validatedEvaluation.success) {
      console.error("[thoughts.evaluation] Evaluation output failed validation", {
        issueCount: validatedEvaluation.error.issues.length,
      });
      return { ok: false as const, message: "The evaluation could not be completed. Please retry." };
    }

    const { data: updatedThought, error: updateError } = await supabase
      .from("thoughts")
      .update({
        system_rating: result.systemRating,
        system_rating_details: validatedEvaluation.data,
      })
      .eq("id", parsedRequest.data.thoughtId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(
        "[thoughts.evaluation] Evaluation UPDATE failed",
        safeSupabaseDiagnostic(updateError)
      );
      return { ok: false as const, message: "The evaluation could not be saved. Please try again." };
    }

    if (!updatedThought) {
      return {
        ok: false as const,
        message: "This thought could not be updated. Please refresh and try again.",
      };
    }

    try {
      revalidatePath("/");
    } catch (error) {
      console.error("[thoughts.evaluation] Dashboard revalidation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return {
      ok: true as const,
      systemRating: result.systemRating,
      evaluation: validatedEvaluation.data,
    };
  } catch (error) {
    console.error("[thoughts.evaluation] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "The evaluation could not be completed. Please try again." };
  }
}

export async function updateThoughtRating(thoughtId: string, rating: number) {
  const parsed = thoughtRatingSchema.safeParse({ thoughtId, rating });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Choose a valid thought and a rating from 1 to 10.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      if (sessionError) {
        console.error(
          "[thoughts.rating] Authentication check failed",
          safeSupabaseDiagnostic(sessionError)
        );
      } else {
        console.warn("[thoughts.rating] No authenticated user for rating update");
      }

      return {
        ok: false as const,
        message: "Your session could not be verified. Please sign in again and retry.",
      };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .update({ user_rating: parsed.data.rating })
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.rating] Supabase UPDATE failed", diagnostic);

      return {
        ok: false as const,
        message: getRatingFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    if (!data) {
      return {
        ok: false as const,
        message: "This thought could not be found or is not available to your account.",
      };
    }

    try {
      revalidatePath("/");
    } catch (error) {
      console.error("[thoughts.rating] Dashboard revalidation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return { ok: true as const, rating: parsed.data.rating };
  } catch (error) {
    console.error("[thoughts.rating] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "Your rating could not be saved. Please try again." };
  }
}

const updateThoughtSchema = thoughtContentSchema.extend({ thoughtId: thoughtIdSchema });
const archiveThoughtSchema = z.object({
  thoughtId: thoughtIdSchema,
  archived: z.boolean(),
});

function getMutationFailureMessage(error: { code?: string; message?: string; status?: number }) {
  if (error.code === "42501" || /row.level security|violates.*policy/i.test(error.message ?? "")) {
    return "The database denied this change. Confirm you're signed in and try again.";
  }

  if (["22001", "23502", "23514"].includes(error.code ?? "")) {
    return "The thought did not meet a database requirement. Check the heading and elaboration.";
  }

  if (error.status !== undefined && error.status >= 500) {
    return "This change is temporarily unavailable. Please try again shortly.";
  }

  return "This change could not be saved. Please try again.";
}

function revalidateThoughtDashboard(operation: string) {
  try {
    revalidatePath("/");
  } catch (error) {
    console.error(`[thoughts.${operation}] Dashboard revalidation failed`, {
      name: error instanceof Error ? error.name : "UnknownError",
    });
  }
}

export async function updateThoughtContent(
  thoughtId: string,
  heading: string,
  elaboration: string
) {
  const parsed = updateThoughtSchema.safeParse({ thoughtId, heading, elaboration });
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Check the thought and try again.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { ok: false as const, message: "Your session could not be verified. Please sign in again." };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .update({ heading: parsed.data.heading, elaboration: parsed.data.elaboration })
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id, heading, elaboration, updated_at")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.edit] Supabase UPDATE failed", diagnostic);
      return {
        ok: false as const,
        message: getMutationFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    if (!data) {
      return { ok: false as const, message: "This thought could not be found or is not available to your account." };
    }

    revalidateThoughtDashboard("edit");
    return { ok: true as const, thought: data };
  } catch (error) {
    console.error("[thoughts.edit] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "This thought could not be saved. Please try again." };
  }
}

export async function setThoughtArchived(thoughtId: string, archived: boolean) {
  const parsed = archiveThoughtSchema.safeParse({ thoughtId, archived });
  if (!parsed.success) {
    return { ok: false as const, message: "This thought could not be updated." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { ok: false as const, message: "Your session could not be verified. Please sign in again." };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .update({ archived: parsed.data.archived })
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id, archived")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.archive] Supabase UPDATE failed", diagnostic);
      return {
        ok: false as const,
        message: getMutationFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    if (!data) {
      return { ok: false as const, message: "This thought could not be found or is not available to your account." };
    }

    revalidateThoughtDashboard(parsed.data.archived ? "archive" : "unarchive");
    return { ok: true as const, archived: data.archived };
  } catch (error) {
    console.error("[thoughts.archive] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "This thought could not be updated. Please try again." };
  }
}

const updateThoughtStatusSchema = z.object({
  thoughtId: thoughtIdSchema,
  status: thoughtStatusSchema,
});

export async function updateThoughtStatus(thoughtId: string, status: string) {
  const parsed = updateThoughtStatusSchema.safeParse({ thoughtId, status });
  if (!parsed.success) {
    return { ok: false as const, message: "Choose a valid thought status." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { ok: false as const, message: "Your session could not be verified. Please sign in again." };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.status] Supabase UPDATE failed", diagnostic);
      return {
        ok: false as const,
        message: getMutationFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    if (!data) {
      return {
        ok: false as const,
        message: "This thought could not be found or is not available to your account.",
      };
    }

    revalidateThoughtDashboard("status");
    try {
      revalidatePath(`/thoughts/${parsed.data.thoughtId}`);
    } catch (error) {
      console.error("[thoughts.status] Detail revalidation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return { ok: true as const, status: parsed.data.status };
  } catch (error) {
    console.error("[thoughts.status] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      ok: false as const,
      message: "This thought's status could not be changed. Please try again.",
    };
  }
}

export async function markThoughtReviewed(thoughtId: string) {
  return updateThoughtStatus(thoughtId, "reviewed");
}

const updateThoughtPrioritySchema = z.object({
  thoughtId: thoughtIdSchema,
  priority: thoughtPrioritySchema,
});

export async function updateThoughtPriority(thoughtId: string, priority: number) {
  const parsed = updateThoughtPrioritySchema.safeParse({ thoughtId, priority });
  if (!parsed.success) {
    return { ok: false as const, message: "Choose a valid priority from 0 to 5." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { ok: false as const, message: "Your session could not be verified. Please sign in again." };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .update({ priority: parsed.data.priority })
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id, priority")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.priority] Supabase UPDATE failed", diagnostic);

      if (diagnostic.code === "42501" || /row.level security|violates.*policy/i.test(diagnostic.message ?? "")) {
        return { ok: false as const, message: "You don't have permission to change this thought's priority." };
      }
      if (diagnostic.code === "23514") {
        return { ok: false as const, message: "Choose a priority from 0 to 5." };
      }
      if (diagnostic.status !== undefined && diagnostic.status >= 500) {
        return { ok: false as const, message: "Priority is temporarily unavailable. Please try again shortly." };
      }
      return { ok: false as const, message: "Priority could not be saved. Please try again." };
    }

    if (!data) {
      return { ok: false as const, message: "This thought could not be found or is not available to your account." };
    }

    revalidateThoughtDashboard("priority");
    try {
      revalidatePath(`/thoughts/${parsed.data.thoughtId}`);
    } catch (error) {
      console.error("[thoughts.priority] Detail revalidation failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    return { ok: true as const, priority: data.priority };
  } catch (error) {
    console.error("[thoughts.priority] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "Priority could not be saved. Please try again." };
  }
}

const deleteThoughtSchema = z.object({ thoughtId: thoughtIdSchema });

export async function deleteThought(thoughtId: string) {
  const parsed = deleteThoughtSchema.safeParse({ thoughtId });
  if (!parsed.success) {
    return { ok: false as const, message: "This thought could not be deleted." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { ok: false as const, message: "Your session could not be verified. Please sign in again." };
    }

    const { data, error } = await supabase
      .from("thoughts")
      .delete()
      .eq("id", parsed.data.thoughtId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      const diagnostic = safeSupabaseDiagnostic(error);
      console.error("[thoughts.delete] Supabase DELETE failed", diagnostic);
      return {
        ok: false as const,
        message: getMutationFailureMessage({
          code: diagnostic.code,
          message: diagnostic.message,
          status: diagnostic.status,
        }),
      };
    }

    if (!data) {
      return { ok: false as const, message: "This thought could not be found or is not available to your account." };
    }

    revalidateThoughtDashboard("delete");
    return { ok: true as const };
  } catch (error) {
    console.error("[thoughts.delete] Unexpected failure", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false as const, message: "This thought could not be deleted. Please try again." };
  }
}