import { AppShell } from "@/components/layout/app-shell";
import { DashboardCaptureWorkspace } from "@/features/thoughts/dashboard-capture-workspace";
import type { DashboardThoughtPreview } from "@/features/thoughts/thought-types";
import type { ProfileIdentity } from "@/lib/profile";

export function DashboardOverview({
  profile,
  recentThoughts,
  hasMore,
  loadError,
}: {
  profile: ProfileIdentity;
  recentThoughts: DashboardThoughtPreview[] | null;
  hasMore: boolean;
  loadError?: string;
}) {
  return (
    <AppShell profile={profile} title="Dashboard">
      <div className="space-y-8">
        {loadError ? (
          <p role="alert" className="rounded-xl border border-danger-border bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
            {loadError}
          </p>
        ) : null}

        <DashboardCaptureWorkspace
          initialThoughts={recentThoughts}
          initialHasMore={hasMore}
        />
      </div>
    </AppShell>
  );
}
