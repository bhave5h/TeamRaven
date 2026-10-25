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
    <div className="w-full bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs select-none transition-colors duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#22222a]">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
            INTEGRITY & OBSERVABILITY ENGINE [DIFFERENTIATOR]
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-0.5">
            5-Layer Deterministic Guardrail Telemetry
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
          All 5 Layers Passing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
        {guardrails.map((g, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-[#fafafa] dark:bg-[#16161c] border border-gray-200 dark:border-[#26262e] rounded-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400">
                <span>{g.layer}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{g.status}</span>
              </div>
              <h4 className="text-xs font-bold text-[#191919] dark:text-[#f4f4f6]">{g.name}</h4>
              <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 block mt-1 font-semibold">
                {g.metrics}
              </span>
              <p className="mt-2 text-[11px] text-[#191919]/70 dark:text-neutral-300 leading-relaxed font-sans">
                {g.description}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-[#22222a] text-[9px] font-mono text-[#191919]/50 dark:text-neutral-400 truncate">
              {g.file}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
