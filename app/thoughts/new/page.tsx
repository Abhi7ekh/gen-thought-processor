import { AppHeader } from "@/components/layout/app-header";
import { AddThoughtDialog } from "@/features/thoughts/add-thought-dialog";
import { requireUserSession } from "@/lib/auth";
import { getProfileIdentity } from "@/lib/profile";

export default async function NewThoughtPage() {
  const user = await requireUserSession();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <AppHeader profile={getProfileIdentity(user)} />
        <section className="mx-auto max-w-3xl py-9 sm:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-brand-muted">
            Capture
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Add Thought
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Start with the part you want to remember.
          </p>
          <div className="mt-7">
            <AddThoughtDialog />
          </div>
        </section>
      </div>
    </main>
  );
}