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
          bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
          role: "ADVERSARIAL COUNTERPARTY",
          border: "border-l-rose-500",
        };
      case "heimdall":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
          role: "OPERATIONAL EVENT RADAR",
          border: "border-l-blue-500",
        };
      case "thor":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
          role: "CLAUSE EXTRACTION AUTHORITY",
          border: "border-l-amber-500",
        };
      case "tyr":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
          role: "NEUTRAL LEGAL ARBITER",
          border: "border-l-purple-600",
        };
      default:
        return {
          bg: "bg-[#f3f8f5] text-[#14211a] border-[#dce8e1]",
          role: "ORCHESTRATOR",
          border: "border-l-[#14211a]",
        };
    }
  };

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#dce8e1] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              MULTI-AGENT DEBATE ARENA [FR9.4]
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              SSE Stream Active
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            Adversarial Reasoning, Fact-Checking & Rulings
          </h3>
        </div>

        {/* Round Switcher */}
        <div className="flex items-center gap-1.5 bg-[#f3f8f5] border border-[#dce8e1] p-1 rounded-lg">
          <button
            onClick={() => setActiveRound(1)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeRound === 1
                ? "bg-white text-[#14211a] border border-[#dce8e1] shadow-2xs font-semibold"
                : "text-[#67776e] hover:text-[#14211a]"
            }`}
          >
            Round 1: Harbor 76d Bar
          </button>
          <button
            onClick={() => setActiveRound(2)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeRound === 2
                ? "bg-white text-[#14211a] border border-[#dce8e1] shadow-2xs font-semibold"
                : "text-[#67776e] hover:text-[#14211a]"
            }`}
          >
            Round 2: Vantage Pre-Go-Live
          </button>
        </div>
      </div>

      {/* Filter by Agent */}
      <div className="flex items-center gap-2 py-3 border-b border-[#dce8e1] text-xs overflow-x-auto">
        <span className="text-[#67776e] shrink-0 font-medium">Filter by Agent:</span>
        {["all", "loki", "heimdall", "thor", "tyr"].map((ag) => (
          <button
            key={ag}
            onClick={() => setFilterAgent(ag)}
            className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer shrink-0 ${
              filterAgent === ag
                ? "bg-[#14211a] text-white font-medium shadow-xs"
                : "bg-[#f3f8f5] border border-[#dce8e1] text-[#67776e] hover:text-[#14211a]"
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
              className={`p-4 bg-white border border-[#dce8e1] rounded-xl border-l-4 ${badge.border} shadow-2xs transition-all hover:border-[#14211a]/40`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#14211a]">
                    {turn.agentName}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badge.bg}`}
                  >
                    {badge.role}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#67776e]">
                  {turn.timestamp}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#14211a]/85 leading-relaxed font-serif">
                {turn.content}
              </p>

              {/* Rulings Badge */}
              {turn.rulingStatus && (
                <div className="mt-3 p-2.5 bg-purple-50/80 border border-purple-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-900">
                    RULING: {turn.rulingStatus.toUpperCase()} (BINDING PRECEDENCE)
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded">
                    Tyr Formal Decree
                  </span>
                </div>
              )}

              {/* Inline Citation Badge */}
              {turn.citation && (
                <div className="mt-3 pt-2.5 border-t border-[#dce8e1] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#67776e] font-mono">
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
      <div className="pt-3 border-t border-[#dce8e1] flex items-center justify-between text-xs text-[#67776e]">
        <span>Guardrail Enforced: Max 3 debate rounds • $0 arithmetic drift</span>
        <span className="font-mono text-emerald-700">Budget: 1,840 / 12,000 tokens</span>
      </div>
    </div>
  );
}
