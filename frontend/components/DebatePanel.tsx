"use client";

import React, { useState } from "react";
import { Citation, DebateTurn } from "@/lib/types";
import { DEBATE_TURNS } from "@/lib/odinData";

interface DebatePanelProps {
  onOpenCitation: (cit: Citation) => void;
}

export default function DebatePanel({ onOpenCitation }: DebatePanelProps) {
  const [activeRound, setActiveRound] = useState<number>(1);
  const [filterAgent, setFilterAgent] = useState<string>("all");

  const filteredTurns = DEBATE_TURNS.filter((turn) => {
    const roundMatch = turn.round === activeRound;
    const agentMatch = filterAgent === "all" || turn.agent === filterAgent;
    return roundMatch && agentMatch;
  });

  const getAgentBadge = (agent: DebateTurn["agent"]) => {
    switch (agent) {
      case "loki":
        return {
          bg: "bg-rose-50 text-rose-900 border-rose-200",
          role: "ADVERSARIAL COUNTERPARTY",
          border: "border-l-rose-500",
        };
      case "heimdall":
        return {
          bg: "bg-blue-50 text-blue-900 border-blue-200",
          role: "OPERATIONAL EVENT RADAR",
          border: "border-l-blue-500",
        };
      case "thor":
        return {
          bg: "bg-amber-50 text-amber-900 border-amber-200",
          role: "CLAUSE EXTRACTION AUTHORITY",
          border: "border-l-amber-500",
        };
      case "tyr":
        return {
          bg: "bg-purple-50 text-purple-900 border-purple-200",
          role: "NEUTRAL LEGAL ARBITER",
          border: "border-l-purple-600",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-900 border-gray-200",
          role: "ORCHESTRATOR",
          border: "border-l-gray-900",
        };
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50">
              MULTI-AGENT DEBATE ARENA [FR9.4]
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              SSE Stream Active
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#191919] mt-0.5">
            Adversarial Reasoning, Fact-Checking & Rulings
          </h3>
        </div>

        {/* Round Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F4F3F3] p-1 rounded-lg">
          <button
            onClick={() => setActiveRound(1)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeRound === 1
                ? "bg-white text-[#191919] shadow-2xs font-semibold"
                : "text-[#191919]/60 hover:text-[#191919]"
            }`}
          >
            Round 1: Harbor 76d Bar
          </button>
          <button
            onClick={() => setActiveRound(2)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeRound === 2
                ? "bg-white text-[#191919] shadow-2xs font-semibold"
                : "text-[#191919]/60 hover:text-[#191919]"
            }`}
          >
            Round 2: Vantage Pre-Go-Live
          </button>
        </div>
      </div>

      {/* Filter by Agent */}
      <div className="flex items-center gap-2 py-3 border-b border-gray-100 text-xs overflow-x-auto">
        <span className="text-[#191919]/50 shrink-0 font-medium">Filter by Agent:</span>
        {["all", "loki", "heimdall", "thor", "tyr"].map((ag) => (
          <button
            key={ag}
            onClick={() => setFilterAgent(ag)}
            className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer shrink-0 ${
              filterAgent === ag
                ? "bg-[#191919] text-white font-medium"
                : "bg-[#F4F3F3] text-[#191919]/70 hover:text-[#191919]"
            }`}
          >
            {ag === "all" ? "All Agents" : ag}
          </button>
        ))}
      </div>

      {/* Streaming Turns List */}
      <div className="py-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {filteredTurns.map((turn) => {
          const badge = getAgentBadge(turn.agent);
          return (
            <div
              key={turn.id}
              className={`p-4 bg-white border border-gray-200/90 rounded-xl border-l-4 ${badge.border} shadow-2xs transition-all hover:border-gray-300`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#191919]">
                    {turn.agentName}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badge.bg}`}
                  >
                    {badge.role}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#191919]/40">
                  {turn.timestamp}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#191919]/80 leading-relaxed font-serif">
                {turn.content}
              </p>

              {/* Rulings Badge */}
              {turn.rulingStatus && (
                <div className="mt-3 p-2.5 bg-purple-50/80 border border-purple-200/60 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-900">
                    RULING: {turn.rulingStatus.toUpperCase()} (BINDING PRECEDENCE)
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Tyr Formal Decree
                  </span>
                </div>
              )}

              {/* Inline Citation Badge */}
              {turn.citation && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#191919]/60 font-mono">
                    Grounding: {turn.citation.docId} {turn.citation.section}
                  </span>
                  <button
                    onClick={() => onOpenCitation(turn.citation!)}
                    className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Exact Citation Quote</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#191919]/50">
        <span>Guardrail Enforced: Max 3 debate rounds • 0 arithmetic drift</span>
        <span className="font-mono text-emerald-700">Budget: 1,840 / 12,000 tokens</span>
      </div>
    </div>
  );
}
