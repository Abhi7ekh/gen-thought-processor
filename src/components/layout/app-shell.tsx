import type { ReactNode } from "react";
import Link from "next/link";

import { ProfileMenu } from "@/components/profile/profile-menu";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { ProfileIdentity } from "@/lib/profile";

type AppShellProps = {
  profile: ProfileIdentity;
  title: string;
  children: ReactNode;
};

export function AppShell({ profile, title, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-[56px_minmax(0,1fr)] gap-2 p-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 sm:p-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <AppSidebar />

        <div className="min-w-0 rounded-[24px] border border-border bg-card shadow-[0_18px_60px_rgba(67,50,124,0.07)]">
          <header className="sticky top-3 z-30 flex min-h-[76px] items-center justify-between gap-3 rounded-t-[23px] border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <Link href="/" aria-label="Gen Thought Processor dashboard" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">GTP</span>
                <span className="max-w-[92px] text-[11px] font-semibold leading-tight text-foreground sm:max-w-none sm:text-sm">Gen Thought Processor</span>
              </Link>
              <span aria-hidden="true" className="hidden h-7 w-px bg-border sm:block" />
              <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <ProfileMenu {...profile} />
            </div>
          </header>
          <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
