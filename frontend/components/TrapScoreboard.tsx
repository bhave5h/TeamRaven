"use client";

import React, { useState } from "react";
import { Citation, TrapItem } from "@/lib/types";
import { TRAP_ITEMS } from "@/lib/odinData";
import { formatNumber } from "@/lib/format";

interface TrapScoreboardProps {
  onOpenCitation: (cit: Citation) => void;
}

export default function TrapScoreboard({ onOpenCitation }: TrapScoreboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "sla", "liability", "temporal", "accounting", "operational", "quarantine"];

  const filteredTraps = TRAP_ITEMS.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  return (
    <div className="w-full bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs select-none transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-[#22222a] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
              TRAP HUNTER ENGINE • 14/14 DETECTED [DIFFERENTIATOR]
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded font-mono font-semibold">
              100% Score
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-0.5">
            Automated Legal, Financial & Temporal Trap Matrix
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F3F3] dark:bg-[#181820] p-1 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs capitalize rounded-md transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white dark:bg-[#22222c] text-[#191919] dark:text-white shadow-2xs font-semibold"
                  : "text-[#191919]/60 dark:text-neutral-400 hover:text-[#191919] dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Traps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-5 max-h-[520px] overflow-y-auto pr-1">
        {filteredTraps.map((trap: TrapItem) => (
          <div
            key={trap.id}
            className="p-4 bg-[#fafafa] dark:bg-[#16161c] border border-gray-200/90 dark:border-[#26262e] rounded-xl hover:border-gray-300 dark:hover:border-neutral-600 transition-all flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#191919] dark:bg-white text-white dark:text-[#09090b] flex items-center justify-center font-mono text-[10px] font-bold">
                    #{trap.id}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-semibold text-[#191919]/50 dark:text-neutral-400 px-2 py-0.5 bg-white dark:bg-[#181820] border border-gray-200 dark:border-[#26262e] rounded">
                    {trap.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    trap.status === "remedied"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                  }`}
                >
                  {trap.status === "remedied" ? "NEUTRALIZED" : "FLAGGED"}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#191919] dark:text-[#f4f4f6]">
                {trap.name}
              </h4>
              <p className="mt-1.5 text-xs text-[#191919]/70 dark:text-neutral-300 leading-relaxed font-sans">
                {trap.issue}
              </p>

              <div className="mt-3 p-2.5 bg-white dark:bg-[#111115] rounded-lg border border-gray-200/60 dark:border-[#202028] text-[11px] space-y-1">
                <div className="text-[#191919]/60 dark:text-neutral-400">
                  <span className="font-semibold text-[#191919] dark:text-[#f4f4f6]">Engine:</span> {trap.detectionEngine}
                </div>
                <div className="text-[#191919]/80 dark:text-neutral-300 font-mono text-[10px] line-clamp-1">
                  {trap.agentAction}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-[#22222a] flex items-center justify-between text-xs">
              <span
                suppressHydrationWarning
                className="font-mono font-semibold text-rose-700 dark:text-rose-400"
              >
                {trap.exposureImpact > 0
                  ? `$${formatNumber(trap.exposureImpact)} at risk`
                  : "Quarantined"}
              </span>

              <button
                onClick={() => onOpenCitation(trap.citation)}
                className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline cursor-pointer"
              >
                Inspect Citation →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
