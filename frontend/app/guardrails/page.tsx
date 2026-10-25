"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import GuardrailMonitor from "@/components/GuardrailMonitor";

export default function GuardrailsPage() {
  const [filterType, setFilterType] = useState<"all" | "citation" | "arithmetic" | "schema">("all");

  const auditEvents = [
    {
      id: "AUD-01",
      timestamp: "2027-03-15T10:14:02Z",
      type: "citation",
      layer: "Layer 2: Citation Verification",
      target: "bundle/contracts/A3.txt",
      claim: "written claim window is hereby reduced to fifteen (15) business days",
      result: "VERIFIED",
      status: "PASS",
      details: "Substring match confirmed character-for-character at line 42.",
    },
    {
      id: "AUD-02",
      timestamp: "2027-03-15T10:14:15Z",
      type: "arithmetic",
      layer: "Layer 3: Arithmetic & Date Guard",
      target: "holidays.csv + timeline_engine.py",
      claim: "15 business days from March 14 gives deadline April 15, 2027",
      result: "VERIFIED",
      status: "PASS",
      details: "Calculated with business_days.py excluding weekends and observed state holidays.",
    },
    {
      id: "AUD-03",
      timestamp: "2027-06-01T14:22:10Z",
      type: "citation",
      layer: "Layer 2: Citation Verification",
      target: "bundle/contracts/B2.txt",
      claim: "All claims for performance deficiency must be served within forty-five (45) days",
      result: "VERIFIED",
      status: "PASS",
      details: "Exact match verified in Schedule B2 Section 8.3.",
    },
    {
      id: "AUD-04",
      timestamp: "2027-06-01T14:22:25Z",
      type: "arithmetic",
      layer: "Layer 3: Arithmetic & Date Guard",
      target: "payments_ledger.csv",
      claim: "March 18 to June 2 elapsed duration = 76 days > 45-day bar",
      result: "VERIFIED",
      status: "PASS",
      details: "Deterministic date subtraction confirmed; 31 days overdue.",
    },
    {
      id: "AUD-05",
      timestamp: "2027-09-15T09:00:12Z",
      type: "schema",
      layer: "Layer 1: Schema Guardrail",
      target: "events_drop2.jsonl Line 8",
      claim: "Corrupted binary buffer in JSON line",
      result: "QUARANTINED",
      status: "PASS",
      details: "event_ingester.py isolated malformed line into quarantine without stream disruption.",
    },
  ];

  const filtered = auditEvents.filter(
    (e) => filterType === "all" || e.type === filterType
  );

  return (
    <main className="min-h-screen bg-white text-[#191919] flex flex-col selection:bg-[#191919] selection:text-white pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-6 pt-6">
        <div className="bg-[#fafafa] border border-gray-200 rounded-2xl p-6 sm:p-8">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            INTEGRITY & OBSERVABILITY [NFR2, NFR4]
          </span>
          <h1 className="mt-2 text-3xl font-serif font-normal text-[#191919] tracking-tight">
            Guardrails & Execution Audit Log
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#191919]/70 max-w-3xl leading-relaxed">
            Every agent extraction, calculation, and claim is subjected to deterministic 5-layer validation.
            Zero hallucinated quotes enter shared state, and all calculations are executed in Python.
          </p>
        </div>

        {/* 5-Layer Telemetry Overview */}
        <GuardrailMonitor />

        {/* Audit Log Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50">
                AUDIT LOGS & TRACES
              </span>
              <h3 className="text-lg font-serif font-normal text-[#191919]">
                Real-Time Verification Events
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-[#F4F3F3] p-1 rounded-lg text-xs">
              {["all", "citation", "arithmetic", "schema"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t as typeof filterType)}
                  className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                    filterType === t
                      ? "bg-white text-[#191919] shadow-2xs font-semibold"
                      : "text-[#191919]/60 hover:text-[#191919]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-gray-200 text-[#191919]/50 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-2.5 font-semibold">Audit ID</th>
                  <th className="pb-2.5 font-semibold">Guardrail Layer</th>
                  <th className="pb-2.5 font-semibold">Target File</th>
                  <th className="pb-2.5 font-semibold">Audited Claim</th>
                  <th className="pb-2.5 font-semibold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#191919]/80">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-3 font-mono font-semibold text-[#191919]">
                      {item.id}
                    </td>
                    <td className="py-3 font-medium">{item.layer}</td>
                    <td className="py-3 font-mono text-[11px] text-[#191919]/60">
                      {item.target}
                    </td>
                    <td className="py-3 max-w-md font-serif italic text-xs">
                      &ldquo;{item.claim}&rdquo;
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        {item.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
