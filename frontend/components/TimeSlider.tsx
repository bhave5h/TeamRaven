"use client";

import React from "react";
import { CheckpointDate } from "@/lib/types";
import { CHECKPOINTS } from "@/lib/odinData";

interface TimeSliderProps {
  currentCheckpoint: CheckpointDate;
  onSelectCheckpoint: (cp: CheckpointDate) => void;
}

export default function TimeSlider({
  currentCheckpoint,
  onSelectCheckpoint,
}: TimeSliderProps) {
  const currentIndex = CHECKPOINTS.findIndex((c) => c.date === currentCheckpoint);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onSelectCheckpoint(CHECKPOINTS[currentIndex - 1].date);
    }
  };

  const handleNext = () => {
    if (currentIndex < CHECKPOINTS.length - 1) {
      onSelectCheckpoint(CHECKPOINTS[currentIndex + 1].date);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs select-none transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
              TEMPORAL CHECKPOINT SCRUBBER [FR9.2]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-medium">clock.json sync</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#191919] dark:text-[#f4f4f6]">
              {CHECKPOINTS[currentIndex].date}
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#F4F3F3] dark:bg-[#181820] text-[#191919]/70 dark:text-neutral-300 rounded font-medium border border-transparent dark:border-[#26262e]">
              {CHECKPOINTS[currentIndex].label}
            </span>
          </div>
        </div>

        {/* Temporal Stepper Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 border border-gray-200 dark:border-[#26262e] text-xs font-medium rounded-lg hover:bg-[#F4F3F3] dark:hover:bg-[#181820] text-[#191919] dark:text-[#f4f4f6] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            ← Prev Checkpoint
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === CHECKPOINTS.length - 1}
            className="px-3 py-1.5 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
          >
            Advance Clock →
          </button>
        </div>
      </div>

      {/* Interactive Track */}
      <div className="relative my-4">
        {/* Baseline bar */}
        <div className="h-2 w-full bg-[#F4F3F3] dark:bg-[#181820] rounded-full overflow-hidden border border-transparent dark:border-[#22222a]">
          <div
            className="h-full bg-[#191919] dark:bg-white transition-all duration-300"
            style={{
              width: `${(currentIndex / (CHECKPOINTS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Nodes */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-1">
          {CHECKPOINTS.map((cp, idx) => {
            const isPassed = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={cp.date}
                onClick={() => onSelectCheckpoint(cp.date)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                    isCurrent
                      ? "border-[#191919] dark:border-white bg-white dark:bg-[#09090b] ring-4 ring-gray-100 dark:ring-[#22222a] scale-125"
                      : isPassed
                      ? "border-[#191919] dark:border-white bg-[#191919] dark:bg-white"
                      : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#121216] group-hover:border-gray-400"
                  }`}
                >
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-[#191919] dark:bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkpoint Descriptions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        {CHECKPOINTS.map((cp, idx) => {
          const isSelected = cp.date === currentCheckpoint;
          return (
            <div
              key={cp.date}
              onClick={() => onSelectCheckpoint(cp.date)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "border-[#191919] dark:border-neutral-500 bg-[#F4F3F3]/70 dark:bg-[#181820] shadow-2xs"
                  : "border-gray-100 dark:border-[#22222a] bg-white dark:bg-[#121216] hover:border-gray-200 dark:hover:border-neutral-700"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-semibold text-[#191919] dark:text-[#f4f4f6]">
                  {cp.date}
                </span>
                <span className="text-[10px] text-[#191919]/50 dark:text-neutral-400">Step {idx + 1}</span>
              </div>
              <p className="text-[#191919]/70 dark:text-neutral-300 text-[11px] leading-relaxed">
                {cp.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
