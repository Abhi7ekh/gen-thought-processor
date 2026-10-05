import { CheckCheck, Layers3, Star, Sun, type LucideIcon } from "lucide-react";

type OverviewThought = {
  created_at: string;
  status: string;
  priority: number;
};

export function ThoughtOverview({
  thoughts,
  todayCount,
}: {
  thoughts: OverviewThought[] | null;
  todayCount: number | null;
}) {
  const overviewItems = [
    { label: "Today", detail: "captured today", value: todayCount, icon: Sun },
    {
      label: "Total thoughts",
      detail: "active in your space",
      value: thoughts?.length ?? null,
      icon: Layers3,
    },
    {
      label: "To review",
      detail: "ready for a first review",
      value: thoughts?.filter((thought) => thought.status === "new").length ?? null,
      icon: CheckCheck,
    },
    {
      label: "Priority",
      detail: "with priority set",
      value: thoughts?.filter((thought) => thought.priority > 0).length ?? null,
      icon: Star,
    },
  ];

  return (
    <section aria-labelledby="overview-heading" className="pt-8 sm:pt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="overview-heading" className="text-sm font-semibold text-ink-strong">
          Overview
        </h2>
        <span className="text-xs text-ink-muted">Active view</span>
      </div>

      <div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
        {overviewItems.map((item, index) => {
          const Icon = item.icon as LucideIcon;

          return (
            <div
              key={item.label}
              className={`min-h-29 py-4 sm:py-5 ${
                index % 2 === 0 ? "pr-4 sm:pr-6" : "pl-4 sm:pl-6"
              } ${
                index > 1 ? "border-t border-line-subtle sm:border-t-0" : ""
              } ${index > 0 ? "sm:border-l sm:border-line-subtle sm:pl-6" : ""}`}
            >
              <div className="flex items-center gap-2 text-ink-muted">
                <Icon aria-hidden="true" className="size-3.5 text-brand-mid" strokeWidth={1.8} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-strong">
                {item.value ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-muted">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}