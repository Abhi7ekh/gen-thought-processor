"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { thoughtStatusOptions } from "@/lib/validations/thought";
import {
  Archive,
  ArrowDownWideNarrow,
  CircleDot,
  Search,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";

type FilterOption = { value: string; label: string };

const selectGroups: {
  key: "status" | "priority" | "userRating" | "systemRating" | "sort";
  label: string;
  icon: LucideIcon;
  options: FilterOption[];
}[] = [
  {
    key: "status",
    label: "Status",
    icon: CircleDot,
    options: [
      { value: "all", label: "All statuses" },
      ...thoughtStatusOptions,
    ],
  },
  {
    key: "priority",
    label: "Priority",
    icon: Star,
    options: [
      { value: "all", label: "All priorities" },
      { value: "set", label: "Priority set" },
      { value: "none", label: "No priority" },
    ],
  },
  {
    key: "userRating",
    label: "User rating",
    icon: Star,
    options: [
      { value: "all", label: "All user ratings" },
      { value: "rated", label: "Rated" },
      { value: "unrated", label: "Not rated" },
    ],
  },
  {
    key: "systemRating",
    label: "System rating",
    icon: Sparkles,
    options: [
      { value: "all", label: "All system ratings" },
      { value: "evaluated", label: "Evaluated" },
      { value: "not-evaluated", label: "Not evaluated" },
    ],
  },
  {
    key: "sort",
    label: "Sort",
    icon: ArrowDownWideNarrow,
    options: [
      { value: "recent", label: "Recently added" },
      { value: "oldest", label: "Oldest first" },
      { value: "updated", label: "Recently updated" },
      { value: "priority", label: "Highest priority" },
      { value: "system-rating", label: "Highest system rating" },
      { value: "user-rating", label: "Highest user rating" },
    ],
  },
];

export function ThoughtToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serializedParams = searchParams.toString();
  const currentSearch = searchParams.get("search") ?? "";
  const view = searchParams.get("view") === "archived" ? "archived" : "active";

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (searchInputRef.current) {
      searchInputRef.current.value = new URLSearchParams(serializedParams).get("search") ?? "";
    }
  }, [serializedParams]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    },
    []
  );

  function updateParams(
    updates: Record<string, string | null>,
    mode: "push" | "replace" = "push",
    preserveSearchDraft = true
  ) {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (preserveSearchDraft) {
      const draft = searchInputRef.current?.value.trim() ?? "";
      if (draft) params.set("search", draft);
      else params.delete("search");
    }

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }

    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    const currentHref = serializedParams ? `${pathname}?${serializedParams}` : pathname;
    if (href === currentHref) return;

    if (mode === "replace") router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  function handleSearchChange(value: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateParams({ search: value.trim() || null }, "replace", false);
    }, 300);
  }

  const status = searchParams.get("status") ?? "all";
  const priority = searchParams.get("priority") ?? "all";
  const userRating = searchParams.get("userRating") ?? "all";
  const systemRating = searchParams.get("systemRating") ?? "all";
  const sort = searchParams.get("sort") ?? "recent";
  const hasFilters =
    currentSearch.length > 0 ||
    status !== "all" ||
    priority !== "all" ||
    userRating !== "all" ||
    systemRating !== "all" ||
    sort !== "recent";

  function clearFilters() {
    updateParams(
      {
        search: null,
        status: null,
        priority: null,
        userRating: null,
        systemRating: null,
        sort: null,
      },
      "push",
      false
    );
  }

  return (
    <section aria-label="Thought search and filters" className="pt-8 sm:pt-10">
      <div className="flex flex-col gap-3">
        <div className="relative w-full lg:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.8}
          />
          <input
            ref={searchInputRef}
            aria-label="Search thoughts"
            type="search"
            defaultValue={currentSearch}
            maxLength={160}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
            placeholder="Search heading and elaboration"
            className="h-11 w-full rounded-lg border border-border bg-card/80 pl-10 pr-4 text-sm text-card-foreground outline-none placeholder:text-muted-foreground focus:border-input focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-lg border border-border bg-card/70 p-1" role="group" aria-label="Thought view">
            {(["active", "archived"] as const).map((value) => {
              const selected = view === value;
              const Icon = value === "active" ? CircleDot : Archive;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateParams({ view: value === "active" ? null : value })}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    selected
                      ? "bg-secondary text-secondary-foreground"
                      : "text-ink-muted hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-3.5" />
                  {value === "active" ? "Active" : "Archived"}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap">
            {selectGroups.map((group) => {
              const Icon = group.icon;
              const value = searchParams.get(group.key) ?? (group.key === "sort" ? "recent" : "all");
              return (
                <label
                  key={group.key}
                  className="relative flex h-11 min-w-0 items-center gap-2 rounded-lg border border-border bg-card/80 pl-3 text-ink-muted xl:min-w-42"
                >
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.8} />
                  <span className="sr-only">{group.label}</span>
                  <select
                    aria-label={group.label}
                    value={value}
                    onChange={(event) => {
                      const nextValue = event.currentTarget.value;
                      updateParams({
                        [group.key]: nextValue === "all" || (group.key === "sort" && nextValue === "recent")
                          ? null
                          : nextValue,
                      });
                    }}
                    className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-8 text-xs font-medium text-secondary-foreground outline-none"
                  >
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-9 w-fit items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" className="size-3.5" />
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}