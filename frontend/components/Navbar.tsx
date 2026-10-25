"use client";

import React from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { CheckpointDate } from "@/lib/types";

interface NavbarProps {
  currentCheckpoint?: CheckpointDate;
  onSelectCheckpoint?: (cp: CheckpointDate) => void;
  onTriggerAnalysis?: () => void;
}

export default function Navbar({
  currentCheckpoint = "2027-03-15",
  onTriggerAnalysis,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#22222a] px-4 sm:px-8 py-3.5 select-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Odin War Room Logo */}
        <div className="flex items-center gap-4">
          <Logo />
        </div>

        {/* Right: Clock Indicator, Run Pipeline Action, and Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Active Checkpoint Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-[#F4F3F3] dark:bg-[#181820] border border-gray-200 dark:border-[#22222a] rounded-lg text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#191919]/50 dark:text-neutral-400">Clock:</span>
            <span className="font-semibold text-[#191919] dark:text-[#f4f4f6]">
              {currentCheckpoint}
            </span>
          </div>

          {/* Trigger Analysis Button */}
          {onTriggerAnalysis && (
            <button
              onClick={onTriggerAnalysis}
              className="px-4 py-2 bg-[#191919] text-white dark:bg-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Run Agent Pipeline</span>
              <span>⚡</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
