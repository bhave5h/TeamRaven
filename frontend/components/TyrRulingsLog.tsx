"use client";

import React from "react";
import { ODIN_FORCE_RULINGS } from "@/lib/odinData";

export default function TyrRulingsLog() {
  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce8e1]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#f3f8f5] text-amber-800 border border-[#dce8e1]">
              AGENT 5: TYR
            </span>
            <span className="text-xs text-[#67776e] font-mono">
              Neutral Legal Adjudication
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-1">
            Tyr Binding Arbitration Rulings Log
          </h3>
        </div>

        <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          3 / 3 Rulings Adjudicated
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-[#dce8e1] text-[11px] font-mono uppercase tracking-wider text-[#67776e] bg-[#f8faf9]">
              <th className="py-2.5 px-3">Disputed Claim</th>
              <th className="py-2.5 px-3">Loki Adversary Attack</th>
              <th className="py-2.5 px-3">Heimdall Evidence</th>
              <th className="py-2.5 px-3 text-center">Verdict</th>
              <th className="py-2.5 px-3">Precedence & Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce8e1]">
            {ODIN_FORCE_RULINGS.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#f3f8f5] transition-colors">
                <td className="py-3 px-3 font-semibold text-[#14211a] max-w-[200px]">
                  {row.claim}
                </td>
                <td className="py-3 px-3 text-red-800 max-w-[220px] font-mono text-[11px] bg-red-50/50">
                  {row.lokiAttack}
                </td>
                <td className="py-3 px-3 text-sky-900 max-w-[220px] font-mono text-[11px] bg-sky-50/50">
                  {row.heimdallEvidence}
                </td>
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-1 rounded font-mono text-[11px] font-bold border ${
                      row.verdict === "TRUE" || row.verdict === "VALID"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-red-100 text-red-900 border-red-300"
                    }`}
                  >
                    {row.verdict}
                  </span>
                </td>
                <td className="py-3 px-3 text-[#14211a] text-xs leading-relaxed max-w-[260px]">
                  {row.rationale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
