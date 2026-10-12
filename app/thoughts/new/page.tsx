import { AppShell } from "@/components/layout/app-shell";
import { AddThoughtDialog } from "@/features/thoughts/add-thought-dialog";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";

export default async function NewThoughtPage() {
  const user = await requireUserSession();

  return (
    <AppShell profile={getProfileIdentity(user)} title="Add Thought">
      <section className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
            Capture
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Add Thought
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Start with the part you want to remember.
          </p>
          <div className="mt-7">
            <AddThoughtDialog />
          </div>
      </section>
    </AppShell>
  );
}