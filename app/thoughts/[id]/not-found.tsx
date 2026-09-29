import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";

export default function ThoughtDetailNotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center sm:py-32">
        <div className="flex size-12 items-center justify-center rounded-xl bg-surface-tint text-brand-mid">
          <BrainCircuit aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-ink-strong">Thought not found</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          This thought may have been deleted or is unavailable.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to thoughts
        </Link>
      </div>
    </main>
  );
}