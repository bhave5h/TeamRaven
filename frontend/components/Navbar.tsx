"use client";

import React from "react";
import Logo from "./Logo";
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dce8e1] select-none w-full px-[clamp(20px,3.2vw,30px)] py-3.5 flex items-center justify-between">
      {/* Left: Odin War Room Logo */}
      <div className="flex items-center gap-4">
        <Logo />
      </div>

        {/* Right: Clock Indicator and Run Pipeline Action */}
        <div className="flex items-center gap-3">
          {/* Active Checkpoint Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-[#f3f8f5] border border-[#dce8e1] rounded-lg text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[#67776e]">Clock:</span>
            <span className="font-semibold text-[#14211a]">
              {currentCheckpoint}
            </span>
          </div>

          {/* Trigger Analysis Button */}
          {onTriggerAnalysis && (
            <button
              onClick={onTriggerAnalysis}
              className="px-4 py-2 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Run Agent Pipeline</span>
              <span>⚡</span>
            </button>
          )}
        </div>
    </header>
  );
}
