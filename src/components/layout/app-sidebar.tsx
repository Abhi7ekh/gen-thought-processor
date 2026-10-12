"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CheckCheck,
  LayoutGrid,
  MessageSquareText,
  Sparkles,
  UserRound,
} from "lucide-react";

const destinations = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Thoughts", href: "/thoughts", icon: MessageSquareText },
  { label: "Evaluation", href: "/evaluation", icon: Sparkles },
  { label: "Revisit", href: "/revisit", icon: BookOpenText },
  { label: "Daily Summary", href: "/summary", icon: CheckCheck },
];

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/thoughts") {
      return pathname === href || (pathname.startsWith("/thoughts/") && pathname !== "/thoughts/new");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-2 flex h-[calc(100dvh-1rem)] flex-col self-start rounded-2xl bg-[#8B72E8] p-1.5 text-white sm:top-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[24px] sm:p-3 lg:p-5">
      <nav
        aria-label="Primary navigation"
        className="mt-2 flex flex-col gap-1.5 sm:mt-4 sm:gap-2 lg:mt-8"
      >
        {destinations.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-1.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:justify-start sm:px-2.5 lg:px-3 ${
                active
                  ? "bg-[#F0E9FF] text-[#312268] shadow-sm"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.9} />
              <span className="hidden truncate sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/20 pt-2 sm:mt-auto sm:pt-3 lg:pt-5">
        <Link
          href="/profile"
          title="Profile"
          aria-label="Profile"
          aria-current={isActive("/profile") ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-1.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:justify-start sm:px-2.5 lg:px-3 ${
            isActive("/profile")
              ? "bg-[#F0E9FF] text-[#312268] shadow-sm"
              : "text-white/90 hover:bg-white/10 hover:text-white"
          }`}
        >
          <UserRound aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.9} />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>
    </aside>
  );
}
