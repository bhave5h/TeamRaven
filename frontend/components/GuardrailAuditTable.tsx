"use client";

import React, { useState } from "react";

export default function GuardrailAuditTable() {
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
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dce8e1] gap-3">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
            AUDIT LOGS & TRACES [NFR2, NFR4]
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            Deterministic Verification Event Log
          </h3>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[#f3f8f5] border border-[#dce8e1] p-1 rounded-lg text-xs">
          {["all", "citation", "arithmetic", "schema"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t as typeof filterType)}
              className={`px-3 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                filterType === t
                  ? "bg-white text-[#14211a] border border-[#dce8e1] shadow-2xs font-semibold"
                  : "text-[#67776e] hover:text-[#14211a]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pt-3">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-[#dce8e1] text-[#67776e] uppercase tracking-wider font-mono text-[10px]">
              <th className="pb-2.5 font-semibold">Audit ID</th>
              <th className="pb-2.5 font-semibold">Guardrail Layer</th>
              <th className="pb-2.5 font-semibold">Target Source</th>
              <th className="pb-2.5 font-semibold">Audited Claim</th>
              <th className="pb-2.5 font-semibold text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce8e1] text-[#14211a]/85">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-[#f3f8f5]/40 transition-colors">
                <td className="py-3 font-mono font-semibold text-[#14211a]">
                  {item.id}
                </td>
                <td className="py-3 font-medium">{item.layer}</td>
                <td className="py-3 font-mono text-[11px] text-[#67776e]">
                  {item.target}
                </td>
                <td className="py-3 max-w-md font-serif italic text-xs">
                  &ldquo;{item.claim}&rdquo;
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
