"use client";

import React, { useState, useEffect } from "react";
import { InfinityLoader } from "@/components/ui/loader-13";
import Logo from "@/components/Logo";

interface PreloaderProps {
  minDuration?: number; // ms to display loader
  onFinish?: () => void;
}

export default function Preloader({
  minDuration = 2800,
  onFinish,
}: PreloaderProps) {
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");
  const [statusText, setStatusText] = useState("Initializing Odin Force...");

  useEffect(() => {
    // Stage 1: Quick status progression
    const timer1 = setTimeout(() => {
      setStatusText("Ingesting manifest.json & canonical clauses...");
    }, 400);

    const timer2 = setTimeout(() => {
      setStatusText("Synchronizing clock.json & 14 trap signatures...");
    }, 800);

    // Stage 2: Begin fade out
    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, minDuration);

    // Stage 3: Fully unmount
    const doneTimer = setTimeout(() => {
      setPhase("done");
      if (onFinish) onFinish();
    }, minDuration + 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [minDuration, onFinish]);

  if (phase === "done") {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-label="War Room Preloader"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#09090b] transition-opacity duration-500 ease-out select-none ${
        phase === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center space-y-6">
        {/* Brand Shield & Title */}
        <div className="scale-150">
          <Logo />
        </div>

        {/* The InfinityLoader Component */}
        <div className="py-2">
          <InfinityLoader
            size={90}
            className="[&>svg>path:last-child]:stroke-orange-500 dark:[&>svg>path:last-child]:stroke-orange-400 [&>svg>path:first-child]:stroke-orange-100 dark:[&>svg>path:first-child]:stroke-[#382012]"
          />
        </div>

        {/* Tactical Status Ticker */}
        <div className="space-y-1.5">
          <p className="font-mono text-[15px] uppercase tracking-[0.18em] text-[#191919] dark:text-[#f4f4f6] font-semibold">
            {statusText}
          </p>
        </div>

        {/* Subtle skip link for fast navigation */}
        <button
          onClick={() => {
            setPhase("fading");
            setTimeout(() => setPhase("done"), 200);
          }}
          className="text-[10px] font-mono text-[#191919]/40 dark:text-neutral-600 hover:text-[#191919] dark:hover:text-neutral-400 transition-colors pt-1 cursor-pointer"
        >
          [Press or click to skip intro]
        </button>
      </div>
    </div>
  );
}
