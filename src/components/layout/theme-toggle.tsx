"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";

type ThemePreference = "light" | "dark" | "system";

const themeStorageKey = "gen-thought-processor-theme";
const themeChangeEvent = "gen-thought-processor-theme-change";

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function getStoredTheme(): ThemePreference {
  try {
    const value = window.localStorage.getItem(themeStorageKey);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  } catch {
    const preference = document.documentElement.dataset.themePreference;
    return preference === "light" || preference === "dark" || preference === "system"
      ? preference
      : "system";
  }
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(themeChangeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(themeChangeEvent, onChange);
  };
}

function applyTheme(preference: ThemePreference, systemIsDark: boolean) {
  const isDark = preference === "dark" || (preference === "system" && systemIsDark);
  document.documentElement.classList.toggle("dark", isDark);
}

function persistTheme(preference: ThemePreference) {
  document.documentElement.dataset.themePreference = preference;
  try {
    window.localStorage.setItem(themeStorageKey, preference);
  } catch {
    // The document attribute keeps the preference for this session.
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => "system");
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => applyTheme(getStoredTheme(), media.matches);
    syncTheme();

    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme() === "system") {
        applyTheme("system", event.matches);
      }
    };

    media.addEventListener("change", handleSystemChange);
    window.addEventListener(themeChangeEvent, syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      media.removeEventListener("change", handleSystemChange);
      window.removeEventListener(themeChangeEvent, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  function selectTheme(preference: ThemePreference) {
    persistTheme(preference);
    applyTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
    window.dispatchEvent(new Event(themeChangeEvent));
    menuRef.current?.removeAttribute("open");
  }

  const CurrentIcon = themeOptions.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <details ref={menuRef} className="group relative">
      <summary
        aria-label={`Theme: ${theme}. Choose theme`}
        title={`Theme: ${theme}`}
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <CurrentIcon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      </summary>
      <div
        role="group"
        aria-label="Color theme"
        className="absolute right-0 top-12 z-20 min-w-40 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_12px_32px_rgba(5,15,9,0.2)]"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => selectTheme(option.value)}
              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
              {option.label}
              {theme === option.value ? <ChevronDown aria-hidden="true" className="ml-auto size-3.5 -rotate-90" /> : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}