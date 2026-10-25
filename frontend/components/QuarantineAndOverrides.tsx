"use client";

import React from "react";
import {
  QUARANTINED_INPUTS,
  ARITHMETIC_OVERRIDES,
  AGENT_TRANSITIONS,
} from "@/lib/odinData";

export default function QuarantineAndOverrides() {
  return (
    <div className="w-full space-y-6 select-none">
      {/* Top Split: Quarantined Inputs & Arithmetic Overrides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Quarantined Malformed Inputs */}
        <div className="bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
                FAULT-TOLERANCE VAULT
              </span>
              <h3 className="text-base sm:text-lg font-serif font-normal text-[#14211a] mt-0.5">
                Quarantined Stream Inputs (Trap #11 & #12)
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Zero Ingestion Halt
            </span>
          </div>

          <p className="mt-2 text-xs text-[#67776e] leading-relaxed">
            Corrupted JSON payloads and blank contractual dates are safely isolated to the quarantine vault without crashing the parser pipeline.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-[#dce8e1] text-[10px] font-mono uppercase tracking-wider text-[#67776e] bg-[#f8faf9]">
                  <th className="py-2 px-2.5">Source Stream</th>
                  <th className="py-2 px-2.5">Isolated Payload</th>
                  <th className="py-2 px-2.5">Quarantine Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce8e1]">
                {QUARANTINED_INPUTS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f3f8f5] transition-colors">
                    <td className="py-2 px-2.5 font-semibold text-[#14211a] whitespace-nowrap font-mono text-[11px]">
                      {item.source}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[10px] text-red-800 bg-red-50/50 max-w-[150px] truncate">
                      {item.payload}
                    </td>
                    <td className="py-2 px-2.5 text-[#67776e] text-xs">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Deterministic Arithmetic Overrides */}
        <div className="bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
                LAYER 3 AUDIT ENGINE
              </span>
              <h3 className="text-base sm:text-lg font-serif font-normal text-[#14211a] mt-0.5">
                Deterministic Arithmetic Overrides
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              $0.00 Arithmetic Drift
            </span>
          </div>

          <p className="mt-2 text-xs text-[#67776e] leading-relaxed">
            All monetary sums, notice day counts, and penalty waterfalls are strictly computed via Python formulas, overruling LLM mental math.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-[#dce8e1] text-[10px] font-mono uppercase tracking-wider text-[#67776e] bg-[#f8faf9]">
                  <th className="py-2 px-2.5">Financial Metric</th>
                  <th className="py-2 px-2.5">LLM Estimate (Rejected)</th>
                  <th className="py-2 px-2.5">Python Engine (Enforced)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce8e1]">
                {ARITHMETIC_OVERRIDES.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f3f8f5] transition-colors">
                    <td className="py-2 px-2.5 font-semibold text-[#14211a] text-xs">
                      {item.item}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px] text-red-700 line-through">
                      {item.llmValue}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50/50">
                      {item.pythonValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Card: Multi-Agent State Transitions & Resource Limits */}
      <div className="bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce8e1]">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              WORKFLOW STATE MACHINE
            </span>
            <h3 className="text-base sm:text-lg font-serif font-normal text-[#14211a] mt-0.5">
              Multi-Agent Handshake & State Transition Log
            </h3>
          </div>

          {/* Operational Limits Pills */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#f3f8f5] border border-[#dce8e1] text-[#14211a]">
              Debate Rounds: <b>3 / 3</b>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f3f8f5] border border-[#dce8e1] text-[#14211a]">
              Clarifications: <b>1 / 2</b>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#f3f8f5] border border-[#dce8e1] text-[#14211a]">
              LLM Calls: <b>58 / 120</b>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              Tokens: <b>62% of Budget</b>
            </span>
          </div>
        </div>

        <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENT_TRANSITIONS.map((trans, idx) => (
            <li
              key={idx}
              className="p-3 bg-[#f8faf9] border border-[#dce8e1] rounded-lg text-xs font-sans flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#14211a] border-b border-[#dce8e1] pb-1.5 mb-1.5">
                <span className="px-1.5 py-0.5 rounded bg-white border border-[#dce8e1] text-emerald-800">
                  {trans.from}
                </span>
                <span className="text-[#67776e]">→</span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-[#dce8e1] text-sky-800">
                  {trans.to}
                </span>
              </div>
              <p className="text-[#67776e] text-xs leading-relaxed">
                {trans.action}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
