"use client";

import React, { useState } from "react";
import { Citation, TrapItem } from "@/lib/types";
import { TRAP_ITEMS } from "@/lib/odinData";

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
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50">
              TRAP HUNTER ENGINE • 14/14 DETECTED [DIFFERENTIATOR]
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono font-semibold">
              100% Score
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#191919] mt-0.5">
            Automated Legal, Financial & Temporal Trap Matrix
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F3F3] p-1 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs capitalize rounded-md transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white text-[#191919] shadow-2xs font-semibold"
                  : "text-[#191919]/60 hover:text-[#191919]"
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
            className="p-4 bg-[#fafafa] border border-gray-200/90 rounded-xl hover:border-gray-300 transition-all flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#191919] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    #{trap.id}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-semibold text-[#191919]/50 px-2 py-0.5 bg-white border border-gray-200 rounded">
                    {trap.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    trap.status === "remedied"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {trap.status === "remedied" ? "NEUTRALIZED" : "FLAGGED"}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#191919]">
                {trap.name}
              </h4>
              <p className="mt-1.5 text-xs text-[#191919]/70 leading-relaxed font-sans">
                {trap.issue}
              </p>

              <div className="mt-3 p-2.5 bg-white rounded-lg border border-gray-200/60 text-[11px] space-y-1">
                <div className="text-[#191919]/60">
                  <span className="font-semibold text-[#191919]">Engine:</span> {trap.detectionEngine}
                </div>
                <div className="text-[#191919]/80 font-mono text-[10px] line-clamp-1">
                  {trap.agentAction}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-rose-700">
                {trap.exposureImpact > 0
                  ? `$${trap.exposureImpact.toLocaleString()} at risk`
                  : "Quarantined"}
              </span>

              <button
                onClick={() => onOpenCitation(trap.citation)}
                className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
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
