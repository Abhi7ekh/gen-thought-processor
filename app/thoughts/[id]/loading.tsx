export default function ThoughtDetailLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <div className="h-10 w-36 animate-pulse rounded-md bg-secondary" />
        <div className="mt-8 border-t border-border pt-8">
          <div className="h-8 w-2/3 animate-pulse rounded-md bg-secondary" />
          <div className="mt-5 h-24 animate-pulse rounded-lg bg-secondary/70" />
          <div className="mt-6 h-10 w-56 animate-pulse rounded-lg bg-secondary" />
        </div>
      </div>
    </main>
  );
}