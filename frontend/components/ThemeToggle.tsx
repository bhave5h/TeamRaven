"use client";

import React, { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("odin-theme");
  return saved ? saved === "dark" : true;
}

function getServerSnapshot() {
  return true;
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("odin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("odin-theme", "light");
    }
    window.dispatchEvent(new Event("storage"));
  };

  if (!mounted) {
    return (
      <button
        aria-label="Toggle Theme"
        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#22222a] bg-[#F4F3F3] dark:bg-[#181820] flex items-center justify-center text-xs opacity-50"
      >
        <span>◐</span>
      </button>
    );
  }

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      className="p-2 rounded-lg border border-gray-200 dark:border-[#22222a] bg-[#F4F3F3] dark:bg-[#181820] text-[#191919] dark:text-[#f4f4f6] hover:bg-[#eaeaea] dark:hover:bg-[#22222c] active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center shadow-2xs"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        /* Sun Icon */
        <svg
          className="w-4 h-4 text-amber-400 transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        /* Moon Icon */
        <svg
          className="w-4 h-4 text-[#191919] transition-transform duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
