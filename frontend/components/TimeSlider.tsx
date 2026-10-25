"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timeline progression simulation
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        const nextIndex = (currentIndex + 1) % CHECKPOINTS.length;
        onSelectCheckpoint(CHECKPOINTS[nextIndex].date);
      }, 3500);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, currentIndex, onSelectCheckpoint]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIdx = parseInt(e.target.value, 10);
    if (!isNaN(newIdx) && newIdx >= 0 && newIdx < CHECKPOINTS.length) {
      onSelectCheckpoint(CHECKPOINTS[newIdx].date);
    }
  };

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

  const currentCp = CHECKPOINTS[currentIndex] || CHECKPOINTS[0];
  const progressPercent = (currentIndex / (CHECKPOINTS.length - 1)) * 100;

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              TEMPORAL CHECKPOINT SCRUBBER [FR9.2]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-700 font-medium">clock.json sync</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#14211a]">
              {currentCp.date}
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#f3f8f5] text-[#14211a] rounded font-medium border border-[#dce8e1]">
              {currentCp.label}
            </span>
            <span className="hidden md:inline-block text-[11px] font-mono text-[#67776e]">
              Step {currentIndex + 1} of {CHECKPOINTS.length}
            </span>
          </div>
        </div>

        {/* Temporal Stepper & Simulation Playback Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause Timeline Simulation" : "Auto-Play Timeline Simulation"}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              isPlaying
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "border-[#dce8e1] text-[#14211a] hover:bg-[#f3f8f5]"
            }`}
          >
            <span>{isPlaying ? "⏸" : "▶"}</span>
            <span>{isPlaying ? "Pause Sim" : "Auto Play"}</span>
          </button>

          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 border border-[#dce8e1] text-xs font-medium rounded-lg hover:bg-[#f3f8f5] text-[#14211a] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            ← Prev
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === CHECKPOINTS.length - 1}
            className="px-3 py-1.5 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
          >
            Advance →
          </button>
        </div>
      </div>

      {/* Interactive Range Slider Section */}
      <div className="my-5 px-1">
        <div className="relative flex items-center">
          {/* Base background bar */}
          <div className="absolute left-0 right-0 h-2 bg-[#f3f8f5] rounded-full overflow-hidden border border-[#dce8e1]">
            {/* Filled progress bar */}
            <div
              className="h-full bg-[#14211a] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Native Range Slider */}
          <input
            type="range"
            min={0}
            max={CHECKPOINTS.length - 1}
            step={1}
            value={currentIndex}
            onChange={handleSliderChange}
            aria-label="Temporal Checkpoint Slider"
            className="temporal-slider relative z-20"
          />
        </div>

        {/* Milestone Tick Markers along Slider */}
        <div className="relative flex justify-between items-center mt-2 px-0.5">
          {CHECKPOINTS.map((cp, idx) => {
            const isPassed = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={cp.date}
                onClick={() => onSelectCheckpoint(cp.date)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none transition-all"
              >
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                    isCurrent
                      ? "border-[#14211a] bg-[#14211a] scale-125"
                      : isPassed
                      ? "border-[#14211a] bg-[#14211a]"
                      : "border-[#dce8e1] bg-white"
                  }`}
                />
                <span
                  className={`mt-1.5 font-mono text-[11px] font-medium transition-colors ${
                    isCurrent
                      ? "text-[#14211a] font-semibold"
                      : "text-[#67776e] hover:text-[#14211a]"
                  }`}
                >
                  {cp.date}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkpoint Descriptions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
        {CHECKPOINTS.map((cp, idx) => {
          const isSelected = cp.date === currentCheckpoint;
          return (
            <div
              key={cp.date}
              onClick={() => onSelectCheckpoint(cp.date)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-[#14211a] bg-[#f3f8f5] shadow-2xs ring-1 ring-black/5"
                  : "border-[#dce8e1] bg-white hover:border-[#14211a]/30"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-semibold text-[#14211a]">
                  {cp.date}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-[#14211a] text-white font-bold"
                      : "bg-[#f3f8f5] border border-[#dce8e1] text-[#67776e]"
                  }`}
                >
                  Step {idx + 1}
                </span>
              </div>
              <p className="text-[#67776e] text-[11px] leading-relaxed">
                {cp.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
