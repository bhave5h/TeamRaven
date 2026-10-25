"use client";

import React from "react";

export default function GuardrailMonitor() {
  const guardrails = [
    {
      layer: "Layer 1",
      name: "Schema Guardrail",
      file: "schema_guardrail.py",
      status: "PASS",
      metrics: "100% Pydantic Valid",
      description: "Enforces strict JSON schemas on all agent message payloads with confidence tags.",
    },
    {
      layer: "Layer 2",
      name: "Citation Guardrail",
      file: "citation_guardrail.py",
      status: "PASS",
      metrics: "0 Hallucinated Quotes",
      description: "Deterministic substring match against canonical .txt contracts. Rejects ungrounded claims.",
    },
    {
      layer: "Layer 3",
      name: "Arithmetic & Date Guardrail",
      file: "arithmetic_guardrail.py",
      status: "PASS",
      metrics: "$0 Math Drift",
      description: "Prohibits LLM mental math. Date offsets verified against holidays.csv and payments_ledger.csv.",
    },
    {
      layer: "Layer 4",
      name: "Loop & Token Circuit Breaker",
      file: "budget_guardrail.py",
      status: "PASS",
      metrics: "Max 3 Rounds Enforced",
      description: "Halts cyclical debate loops and monitors cumulative token budgets per workstream.",
    },
    {
      layer: "Layer 5",
      name: "Mimir Meta-Auditor",
      file: "mimir_supervisor.py",
      status: "ACTIVE",
      metrics: "Zero Unchecked Deductions",
      description: "Independent audit agent cross-checking legal notices against corporate address covenants.",
    },
  ];

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
            INTEGRITY & OBSERVABILITY ENGINE [DIFFERENTIATOR]
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            5-Layer Deterministic Guardrail Telemetry
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          All 5 Layers Passing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
        {guardrails.map((g, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-[#f3f8f5] border border-[#dce8e1] rounded-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-[#67776e]">
                <span>{g.layer}</span>
                <span className="text-emerald-700 font-bold">{g.status}</span>
              </div>
              <h4 className="text-xs font-bold text-[#14211a]">{g.name}</h4>
              <span className="text-[10px] font-mono text-emerald-800 block mt-1 font-semibold">
                {g.metrics}
              </span>
              <p className="mt-2 text-[11px] text-[#67776e] leading-relaxed font-sans">
                {g.description}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#dce8e1] text-[9px] font-mono text-[#67776e] truncate">
              {g.file}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
