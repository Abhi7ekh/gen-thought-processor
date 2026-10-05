"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";

const destinations = [
  { label: "Dashboard", href: "/" },
  { label: "Thoughts", href: "/thoughts" },
  { label: "Evaluation", href: "/evaluation" },
  { label: "Revisit", href: "/revisit" },
  { label: "Summary", href: "/summary" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/thoughts") {
    return pathname === href || (pathname.startsWith("/thoughts/") && pathname !== "/thoughts/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function destinationClassName(active: boolean) {
  return `flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-ink-muted hover:bg-accent hover:text-accent-foreground"
  }`;
}

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
        {destinations.map((destination) => {
          const active = isActivePath(pathname, destination.href);
          return (
            <Link
              key={destination.href}
              href={destination.href}
              aria-current={active ? "page" : undefined}
              className={destinationClassName(active)}
            >
              {destination.label}
            </Link>
          );
        })}
      </nav>

      <details key={pathname} className="group relative lg:hidden">
        <summary
          aria-label="Open application navigation"
          title="Navigation"
          className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
        >
          <Menu aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </summary>
        <nav
          aria-label="Primary navigation"
          className="absolute right-0 top-12 z-40 w-60 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[0_12px_32px_rgba(5,15,9,0.16)]"
        >
          {destinations.map((destination) => {
            const active = isActivePath(pathname, destination.href);
            return (
              <Link
                key={destination.href}
                href={destination.href}
                aria-current={active ? "page" : undefined}
                className={destinationClassName(active)}
              >
                {destination.label}
              </Link>
            );
          })}
        </nav>
      </details>

      <Link
        href="/thoughts/new"
        aria-label="Add Thought"
        aria-current={pathname === "/thoughts/new" ? "page" : undefined}
        title="Add Thought"
        className={`inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto sm:px-3.5 ${
          pathname === "/thoughts/new"
            ? "bg-primary-hover text-primary-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary-hover"
        }`}
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
        <span className="hidden sm:inline">Add Thought</span>
      </Link>
    </>
  );
}