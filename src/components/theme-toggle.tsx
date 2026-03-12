"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "charto-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event("charto-theme-change"));
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const currentTheme = document.documentElement.dataset.theme;
  if (currentTheme === "light" || currentTheme === "dark") {
    return currentTheme;
  }

  return "dark";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("charto-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("charto-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "dark");
  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
      }}
    >
      <span className="sr-only">{isDark ? "라이트 모드" : "다크 모드"}</span>
      {isDark ? (
        <svg
          aria-hidden
          className="h-4 w-4 text-amber-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="4.25" fill="currentColor" stroke="none" />
          <path
            d="M12 2.75v2.1M12 19.15v2.1M21.25 12h-2.1M4.85 12h-2.1M18.54 5.46l-1.49 1.49M6.95 17.05l-1.49 1.49M18.54 18.54l-1.49-1.49M6.95 6.95 5.46 5.46"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden
          className="h-4 w-4 text-[var(--brand)]"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.2 14.88A8.25 8.25 0 0 1 9.12 4.8a.75.75 0 0 0-1.01-.9A9.75 9.75 0 1 0 20.1 15.89a.75.75 0 0 0-.9-1.01Z" />
        </svg>
      )}
      <span>{isDark ? "라이트 모드 전환" : "다크 모드 전환"}</span>
    </button>
  );
}
