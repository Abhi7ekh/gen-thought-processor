import { ArrowRight, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { ThoughtOverview } from "@/features/thoughts/thought-overview";
import type { DashboardThought } from "@/features/thoughts/thought-types";
import type { ProfileIdentity } from "@/lib/profile";

const workflowStages = [
  { label: "Capture" },
  { label: "Organize" },
  { label: "Evaluate" },
  { label: "Rank" },
  { label: "Revisit" },
  { label: "Develop", later: true },
  { label: "Act", later: true },
];

export function DashboardOverview({
  profile,
  thoughts,
  todayCount,
  loadError,
}: {
  profile: ProfileIdentity;
  thoughts: Pick<DashboardThought, "created_at" | "status" | "priority">[] | null;
  todayCount: number | null;
  loadError?: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={profile} />
        <div className="pb-16">
          <section className="py-9 sm:py-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
              Your thinking desk
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Welcome back.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft sm:text-base">
              A little space to catch what is on your mind and see it clearly.
            </p>
          </section>
          {loadError ? (
            <p
              role="alert"
              className="mb-6 rounded-lg border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground"
            >
              {loadError}
            </p>
          ) : null}
          <ThoughtOverview thoughts={thoughts} todayCount={todayCount} />
          <WorkflowSection />
        </div>
      </div>
    </main>
  );
}

function WorkflowSection() {
  return (
    <section
      aria-labelledby="workflow-heading"
      className="border-y border-border py-5 sm:py-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-brand-muted" />
          <h2 id="workflow-heading" className="text-sm font-semibold text-ink-strong">
            The thought loop
          </h2>
        </div>
        <p className="text-xs text-ink-muted">A model for moving an idea forward</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:items-center sm:justify-between sm:gap-3">
        {workflowStages.map((stage, index) => (
          <div key={stage.label} className="flex shrink-0 items-center gap-2.5">
            <div
              className={`flex items-center gap-2 ${stage.later ? "text-ink-muted" : "text-ink-body"}`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  stage.later
                    ? "border-dashed border-border text-ink-muted"
                    : "border-border bg-surface-tint text-brand-mid"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-xs font-medium sm:text-sm">{stage.label}</span>
              {stage.later ? (
                <span className="rounded border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
                  Later
                </span>
              ) : null}
            </div>
            {index < workflowStages.length - 1 ? (
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-muted"
                strokeWidth={1.7}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}