import Link from "next/link";
import { BrainCircuit } from "lucide-react";

import { PrimaryNavigation } from "@/components/layout/primary-navigation";
import { ProfileMenu } from "@/components/profile/profile-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { ProfileIdentity } from "@/lib/profile";

type AppHeaderProps = {
  profile: ProfileIdentity;
};

export function AppHeader({ profile }: AppHeaderProps) {
  return (
    <header className="flex min-h-17 items-center justify-between gap-2 border-b border-border sm:gap-3">
      <Link
        href="/"
        aria-label="Gen Thought Processor home"
        className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:gap-3"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground sm:size-10">
          <BrainCircuit aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </span>
        <span className="max-w-27 truncate text-sm font-semibold text-foreground sm:max-w-none sm:text-[15px]">
          Gen Thought Processor
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <PrimaryNavigation />
        <ThemeToggle />
        <ProfileMenu {...profile} />
      </div>
    </header>
  );
}