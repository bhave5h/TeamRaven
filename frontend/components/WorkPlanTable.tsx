"use client";

import React from "react";
import { WORKSTREAM_PLANS } from "@/lib/odinData";

export default function WorkPlanTable() {
  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce8e1]">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
            EXECUTION MATRIX
          </span>
          <h3 className="text-base sm:text-lg font-serif font-normal text-[#14211a] mt-0.5">
            Portfolio Workstream Execution Plan
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          7 / 7 Workstreams Active
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="border-b border-[#dce8e1] text-[11px] font-mono uppercase tracking-wider text-[#67776e] bg-[#f8faf9]">
              <th className="py-2.5 px-3">Workstream</th>
              <th className="py-2.5 px-3">Agent Orchestration Sequence</th>
              <th className="py-2.5 px-3 text-right">Status & Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce8e1]">
            {WORKSTREAM_PLANS.map((plan, idx) => (
              <tr key={idx} className="hover:bg-[#f3f8f5] transition-colors">
                <td className="py-2.5 px-3 font-semibold text-[#14211a] whitespace-nowrap">
                  {plan.label}
                </td>
                <td className="py-2.5 px-3 text-[#67776e] font-mono text-[11px]">
                  {plan.steps}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#dce8e1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-bold uppercase">
                      {plan.status} {plan.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
