import Link from "next/link";
import { LogOut, MessageSquareText, Settings2, UserRound } from "lucide-react";

import { logout } from "@/actions/auth";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import type { ProfileIdentity } from "@/lib/profile";

type ProfileMenuProps = ProfileIdentity;

export function ProfileMenu({ displayName, email, initials }: ProfileMenuProps) {
  return (
    <details className="group relative">
      <summary
        aria-label={`Open profile menu for ${displayName}`}
        title="Profile menu"
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <ProfileAvatar initials={initials} className="size-9 transition-colors group-hover:bg-accent" />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[0_12px_32px_rgba(5,15,9,0.16)]">
        <div className="flex items-center gap-3 px-2.5 py-3">
          <ProfileAvatar initials={initials} className="size-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
          </div>
        </div>

        <div aria-hidden="true" className="my-1 border-t border-border" />
        <nav aria-label="Profile navigation" className="py-1">
          <Link
            href="/profile"
            className="flex min-h-10 items-center gap-2.5 rounded-md px-2.5 text-sm text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <UserRound aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Profile
          </Link>
          <button
            type="button"
            disabled
            className="flex min-h-10 w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-ink-muted opacity-75"
          >
            <Settings2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Settings
            <span className="ml-auto text-[10px] font-medium">Coming soon</span>
          </button>
          <button
            type="button"
            disabled
            className="flex min-h-10 w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-ink-muted opacity-75"
          >
            <MessageSquareText aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Feedback
            <span className="ml-auto text-[10px] font-medium">Coming soon</span>
          </button>
        </nav>

        <div aria-hidden="true" className="my-1 border-t border-border" />
        <form action={logout} className="pt-1">
          <button
            type="submit"
            className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut aria-hidden="true" className="size-4" strokeWidth={1.8} />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}