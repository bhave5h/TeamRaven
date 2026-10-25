"use client";

import React, { useState } from "react";
import { CheckpointDate } from "@/lib/types";

interface RiskHeatmapProps {
  checkpoint: CheckpointDate;
  onOpenCitation?: (citation: {
    docId: string;
    section: string;
    title: string;
    quote: string;
    fullParagraph: string;
    verified: boolean;
    matchScore: number;
  }) => void;
}

interface HeatmapCell {
  month: string;
  monthIdx: number;
  status: "clean" | "warning" | "critical" | "superseded" | "pre_effective";
  amount?: number;
  detail: string;
  trapRef?: string;
}

interface ContractRow {
  id: string;
  label: string;
  party: string;
  months: HeatmapCell[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const HEATMAP_DATA: Record<string, ContractRow[]> = {
  all: [
    {
      id: "STD",
      label: "STD: Master Terms",
      party: "Quillhub Standard",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "Standard execution; warranties active." },
        { month: "Feb", monthIdx: 1, status: "clean", detail: "No incidents logged." },
        { month: "Mar", monthIdx: 2, status: "clean", detail: "No incidents logged." },
        { month: "Apr", monthIdx: 3, status: "clean", detail: "No incidents logged." },
        { month: "May", monthIdx: 4, status: "warning", detail: "Informal email termination received from Apex (Trap #6).", trapRef: "Trap #6" },
        { month: "Jun", monthIdx: 5, status: "critical", amount: 250000, detail: "Cyber liability insurance lapse on June 30 ($250k risk - Trap #7).", trapRef: "Trap #7" },
        { month: "Jul", monthIdx: 6, status: "warning", detail: "Policy renewal required; grace period monitored." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "Remediated certificate on file." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Annual compliance check passed." },
      ],
    },
    {
      id: "A1",
      label: "A1: StratoNode Master",
      party: "StratoNode Cloud",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "Cloud core operational." },
        { month: "Feb", monthIdx: 1, status: "clean", detail: "Availability 99.98%." },
        { month: "Mar", monthIdx: 2, status: "clean", detail: "Direct master terms compliant." },
        { month: "Apr", monthIdx: 3, status: "clean", detail: "Invoice approved." },
        { month: "May", monthIdx: 4, status: "clean", detail: "No discrepancies." },
        { month: "Jun", monthIdx: 5, status: "clean", detail: "No discrepancies." },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "No discrepancies." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "No discrepancies." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Master terms auto-renewing." },
      ],
    },
    {
      id: "A2",
      label: "A2: Cloud SLA (Old)",
      party: "StratoNode SLA",
      months: [
        { month: "Jan", monthIdx: 0, status: "superseded", detail: "Superseded by Amendment A3 effective Jan 15, 2027 (Trap #1).", trapRef: "Trap #1" },
        { month: "Feb", monthIdx: 1, status: "superseded", detail: "Superseded by A3." },
        { month: "Mar", monthIdx: 2, status: "superseded", detail: "Superseded by A3." },
        { month: "Apr", monthIdx: 3, status: "superseded", detail: "Superseded by A3." },
        { month: "May", monthIdx: 4, status: "superseded", detail: "Superseded by A3." },
        { month: "Jun", monthIdx: 5, status: "superseded", detail: "Superseded by A3." },
        { month: "Jul", monthIdx: 6, status: "superseded", detail: "Superseded by A3." },
        { month: "Aug", monthIdx: 7, status: "superseded", detail: "Superseded by A3." },
        { month: "Sep", monthIdx: 8, status: "superseded", detail: "Superseded by A3." },
      ],
    },
    {
      id: "A3",
      label: "A3: Amended SLA",
      party: "StratoNode Cloud",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "A3 in force; 15-day credit window enacted (Trap #1)." },
        { month: "Feb", monthIdx: 1, status: "clean", detail: "Uptime 99.8%." },
        { month: "Mar", monthIdx: 2, status: "warning", amount: 38400, detail: "March 18 cloud degradation; Quillhub filed for $38.4k credit recovery within 15 days.", trapRef: "Trap #1" },
        { month: "Apr", monthIdx: 3, status: "clean", detail: "Credit offset confirmed by StratoNode." },
        { month: "May", monthIdx: 4, status: "clean", detail: "99.95% uptime." },
        { month: "Jun", monthIdx: 5, status: "warning", detail: "SLA asymmetry: 99.5% commitment vs customer 99.9% (Trap #2).", trapRef: "Trap #2" },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "No cloud degradation." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "No cloud degradation." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Credit recovery offsets active." },
      ],
    },
    {
      id: "B1",
      label: "B1: Apex Retail",
      party: "Apex Retail Inc.",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "Enterprise SaaS active." },
        { month: "Feb", monthIdx: 1, status: "clean", detail: "SLA 99.9% achieved." },
        { month: "Mar", monthIdx: 2, status: "critical", amount: 48000, detail: "March 18 downtime caused 48-minute gap below 99.9%; customer claimed $48k penalty." },
        { month: "Apr", monthIdx: 3, status: "clean", detail: "April fully operational; no consecutive outage (Trap #4).", trapRef: "Trap #4" },
        { month: "May", monthIdx: 4, status: "warning", amount: 15000, detail: "Attempted informal non-renewal via email (Trap #6).", trapRef: "Trap #6" },
        { month: "Jun", monthIdx: 5, status: "clean", detail: "Formal rejection dispatched; contract affirmed." },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "Account in good standing." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "Standard operations." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Q3 renewal secured." },
      ],
    },
    {
      id: "B2",
      label: "B2: Harbor Logistics",
      party: "Harbor Logistics",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "API gateway operational." },
        { month: "Feb", monthIdx: 1, status: "clean", detail: "Performance metrics met." },
        { month: "Mar", monthIdx: 2, status: "warning", amount: 36000, detail: "March 18 incident; Harbor failed to file within 45 days (Trap #3).", trapRef: "Trap #3" },
        { month: "Apr", monthIdx: 3, status: "clean", detail: "Normal volume." },
        { month: "May", monthIdx: 4, status: "clean", detail: "Harbor submits late penalty claim (76 days later)." },
        { month: "Jun", monthIdx: 5, status: "critical", amount: 36000, detail: "Harbor claims $36,000; Tyr invalidates claim as time-barred under §8.3 (Trap #3).", trapRef: "Trap #3" },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "Dispute closed in Quillhub favor." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "Operational." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Standard billing." },
      ],
    },
    {
      id: "C1",
      label: "C1: Vantage Health",
      party: "Vantage Systems",
      months: [
        { month: "Jan", monthIdx: 0, status: "pre_effective", detail: "Pre-effective staging phase." },
        { month: "Feb", monthIdx: 1, status: "pre_effective", detail: "Pre-effective staging phase." },
        { month: "Mar", monthIdx: 2, status: "pre_effective", detail: "Pre-effective staging phase." },
        { month: "Apr", monthIdx: 3, status: "pre_effective", detail: "Pre-effective staging phase." },
        { month: "May", monthIdx: 4, status: "critical", amount: 26000, detail: "Vantage claims $26k for May 12 outage; contract go-live was May 15 (Trap #5).", trapRef: "Trap #5" },
        { month: "Jun", monthIdx: 5, status: "clean", detail: "SLA in effect; Tyr rejected pre-go-live penalty." },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "Operations normal." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "Operations normal." },
        { month: "Sep", monthIdx: 8, status: "clean", detail: "Operations normal." },
      ],
    },
    {
      id: "D1",
      label: "D1: Agency SOW",
      party: "Contractor Agency",
      months: [
        { month: "Jan", monthIdx: 0, status: "clean", detail: "Milestone 1 delivered." },
        { month: "Feb", monthIdx: 1, status: "warning", detail: "Premature milestone payout recorded on Feb 18 vs delivery Feb 28 (Trap #8).", trapRef: "Trap #8" },
        { month: "Mar", monthIdx: 2, status: "clean", detail: "Milestone 2 accepted." },
        { month: "Apr", monthIdx: 3, status: "warning", detail: "Milestone 4 test pass rate 98.4% vs 100% contract criteria (Trap #9).", trapRef: "Trap #9" },
        { month: "May", monthIdx: 4, status: "clean", detail: "Remediation patch delivered." },
        { month: "Jun", monthIdx: 5, status: "clean", detail: "Milestone 5 completed." },
        { month: "Jul", monthIdx: 6, status: "clean", detail: "Support phase." },
        { month: "Aug", monthIdx: 7, status: "clean", detail: "Support phase." },
        { month: "Sep", monthIdx: 8, status: "warning", amount: 40000, detail: "Unprorated full invoice billed despite mid-month start (Trap #14).", trapRef: "Trap #14" },
      ],
    },
  ],
};

export default function RiskHeatmap({ checkpoint }: RiskHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{
    contract: string;
    cell: HeatmapCell;
  } | null>(null);

  // Active month index mapping based on checkpoint date
  const activeMonthIdx = checkpoint === "2027-03-15" ? 2 : checkpoint === "2027-06-01" ? 5 : 8;

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dce8e1] gap-2">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
            PORTFOLIO RISK MATRIX [FR9.3]
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            Contract × Month Exposure Heatmap
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-sans flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
            <span className="text-[#67776e]">Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
            <span className="text-[#67776e]">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/90" />
            <span className="text-[#67776e]">Breach / Claim</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#dce8e1]" />
            <span className="text-[#67776e]">Superseded</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pt-4">
        <table className="w-full min-w-[620px] text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left font-mono text-[11px] uppercase tracking-wider text-[#67776e] pb-2.5 pr-3 font-medium">
                Contract
              </th>
              {MONTHS.map((m, idx) => (
                <th
                  key={m}
                  className={`text-center font-mono text-[11px] uppercase tracking-wider pb-2.5 px-1 font-medium transition-colors ${
                    idx === activeMonthIdx
                      ? "text-[#14211a] font-bold bg-[#f3f8f5] rounded-t border-t border-x border-[#dce8e1]"
                      : "text-[#67776e]"
                  }`}
                >
                  {m}
                  {idx === activeMonthIdx && (
                    <span className="block text-[9px] text-emerald-700 font-semibold lowercase">
                      clock
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce8e1]">
            {HEATMAP_DATA.all.map((row) => (
              <tr key={row.id} className="hover:bg-[#f3f8f5]/40 transition-colors">
                <td className="py-2.5 pr-3 text-left">
                  <span className="font-mono font-medium text-[#14211a] block">
                    {row.id}
                  </span>
                  <span className="text-[10px] text-[#67776e] truncate max-w-[120px] block">
                    {row.party}
                  </span>
                </td>
                {row.months.map((cell) => {
                  const isActiveCol = cell.monthIdx === activeMonthIdx;
                  let bgClass = "bg-emerald-500/20 text-emerald-900 border-emerald-300/40";
                  if (cell.status === "warning") {
                    bgClass = "bg-amber-500/30 text-amber-950 border-amber-300/60";
                  } else if (cell.status === "critical") {
                    bgClass = "bg-rose-500/40 text-rose-950 border-rose-300/60 font-semibold";
                  } else if (cell.status === "superseded") {
                    bgClass = "bg-[#f3f8f5] text-[#67776e] border-[#dce8e1] opacity-60";
                  } else if (cell.status === "pre_effective") {
                    bgClass = "bg-blue-500/10 text-blue-900 border-blue-200/40 opacity-70";
                  }

                  return (
                    <td
                      key={cell.month}
                      className={`py-1.5 px-1 text-center ${
                        isActiveCol ? "bg-[#f3f8f5]/60" : ""
                      }`}
                    >
                      <button
                        onClick={() => setSelectedCell({ contract: row.label, cell })}
                        className={`w-full py-2 px-1 rounded-md border text-[10px] font-mono transition-transform hover:scale-105 active:scale-95 cursor-pointer ${bgClass}`}
                        title={cell.detail}
                      >
                        {cell.amount ? `$${(cell.amount / 1000).toFixed(0)}k` : "•"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Drilldown Card */}
      {selectedCell && (
        <div className="mt-4 p-3.5 bg-[#f3f8f5] border border-[#dce8e1] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-xs text-[#14211a]">
                {selectedCell.contract} — {selectedCell.cell.month} 2027
              </span>
              {selectedCell.cell.trapRef && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14211a] text-white font-bold">
                  {selectedCell.cell.trapRef}
                </span>
              )}
            </div>
            <p className="text-xs text-[#67776e] mt-1 font-sans">
              {selectedCell.cell.detail}
            </p>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="text-[11px] font-medium text-[#67776e] hover:text-[#14211a] underline cursor-pointer self-end sm:self-auto"
          >
            Dismiss Details ✕
          </button>
        </div>
      )}
    </div>
  );
}
