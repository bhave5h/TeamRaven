"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface WarRoomPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WarRoomPlanModal({
  isOpen,
  onClose,
}: WarRoomPlanModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "components" | "traps" | "phases">("overview");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#191919]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                ODIN HACKATHON 2026
              </span>
              <span className="text-xs text-[#191919]/40">• Frontend Only Scope</span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-serif font-normal text-[#191919]">
              Odin War Room: Frontend Implementation Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#191919] p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 border-b border-gray-100 flex gap-6 text-sm font-medium bg-[#fafafa]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-[#191919] text-[#191919]"
                : "border-transparent text-[#191919]/50 hover:text-[#191919]"
            }`}
          >
            Overview & Requirements
          </button>
          <button
            onClick={() => setActiveTab("components")}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === "components"
                ? "border-[#191919] text-[#191919]"
                : "border-transparent text-[#191919]/50 hover:text-[#191919]"
            }`}
          >
            Component Tree (FR9.1–FR9.5)
          </button>
          <button
            onClick={() => setActiveTab("traps")}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === "traps"
                ? "border-[#191919] text-[#191919]"
                : "border-transparent text-[#191919]/50 hover:text-[#191919]"
            }`}
          >
            The 14 Traps Matrix
          </button>
          <button
            onClick={() => setActiveTab("phases")}
            className={`py-3.5 border-b-2 transition-colors ${
              activeTab === "phases"
                ? "border-[#191919] text-[#191919]"
                : "border-transparent text-[#191919]/50 hover:text-[#191919]"
            }`}
          >
            Zero-Backend Execution Plan
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed text-[#191919]/80">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div className="p-4 bg-[#F4F3F3] rounded-xl border border-gray-200/60">
                <h4 className="font-semibold text-sm text-[#191919] mb-1">
                  Core Objective & Strict Boundary
                </h4>
                <p className="text-xs text-[#191919]/70 leading-relaxed">
                  Quillhub Inc. operates multiple commercial contracts (STD, A1, A2, A3, B1, B2, C1, D1) harboring hidden contradictions, conflicting SLA tiers, and asymmetric liability.
                  Per user requirement: <strong className="text-[#191919]">We are only modifying the `frontend` folder; the `backend` folder remains untouched</strong>. All frontend components are designed with mock fallbacks that work out of the box and seamlessly connect to the FastAPI REST/SSE endpoints when active.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    FR9.1 — Contract Graph
                  </span>
                  <p className="mt-1 text-xs text-[#191919]/70">
                    Interactive node-edge visualization of contracts, clauses, parties, dependencies, and conflicts with slide-out verbatim citation drawer.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    FR9.2 — Time Slider
                  </span>
                  <p className="mt-1 text-xs text-[#191919]/70">
                    Temporal checkpoint progression advancing across `clock.json` dates (Mar 15, Jun 1, Sep 15, 2027) dynamically refreshing exposure and risks.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    FR9.3 — Exposure & Recovery Waterfall
                  </span>
                  <p className="mt-1 text-xs text-[#191919]/70">
                    Financial risk gauges and net loss waterfall charts showing downstream penalties owed vs upstream recoveries claimed and net unrecoverable leakage.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    FR9.4 & FR9.5 — Debate Stream & Action Panel
                  </span>
                  <p className="mt-1 text-xs text-[#191919]/70">
                    Real-time SSE multi-agent debate between Loki (adversary), Heimdall (radar), and Tyr (arbiter), alongside formal drafted notices ready for human sign-off.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-[#191919]">
                Frontend Component Hierarchy (`frontend/components/dashboard/`)
              </h4>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                <div className="p-3.5 flex justify-between items-center bg-[#fafafa]">
                  <span className="font-mono font-semibold text-[#191919]">ContractGraph.tsx</span>
                  <span className="text-[#191919]/60">Canvas/SVG node-edge graph with zoom, pan, and clause inspection</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <span className="font-mono font-semibold text-[#191919]">TimeSlider.tsx</span>
                  <span className="text-[#191919]/60">Temporal scrubber with Mar 15, Jun 1, Sep 15 checkpoint snap</span>
                </div>
                <div className="p-3.5 flex justify-between items-center bg-[#fafafa]">
                  <span className="font-mono font-semibold text-[#191919]">ExposureGauge.tsx</span>
                  <span className="text-[#191919]/60">Radial SVG gauge rendering gross exposure vs net recoverable credits</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <span className="font-mono font-semibold text-[#191919]">RecoveryWaterfall.tsx</span>
                  <span className="text-[#191919]/60">Financial gap bar chart: downstream penalties vs upstream offset</span>
                </div>
                <div className="p-3.5 flex justify-between items-center bg-[#fafafa]">
                  <span className="font-mono font-semibold text-[#191919]">DebatePanel.tsx</span>
                  <span className="text-[#191919]/60">Multi-agent transcript streamer with Loki, Heimdall, and Tyr cards</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <span className="font-mono font-semibold text-[#191919]">CitationDrawer.tsx</span>
                  <span className="text-[#191919]/60">Verbatim canonical text viewer with highlighted substring quotes</span>
                </div>
                <div className="p-3.5 flex justify-between items-center bg-[#fafafa]">
                  <span className="font-mono font-semibold text-[#191919]">ActionPanel.tsx</span>
                  <span className="text-[#191919]/60">Drafted formal legal notices with approve, edit, and export triggers</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "traps" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-[#191919]">
                The 14 Programmatic Dataset Traps Detected in Frontend UI
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 1, name: "Silent SLA Supersession", desc: "A3 cuts credit claim window from 30d to 15d" },
                  { id: 2, name: "SLA Asymmetry", desc: "Cloud 99.5% vs customer required 99.9% (0.4% liability gap)" },
                  { id: 3, name: "Time-Barred Credit", desc: "Harbor March credit claimed 76 days later (voided)" },
                  { id: 4, name: "Non-Consecutive Outage Lie", desc: "April operational, refuting consecutive month claim" },
                  { id: 5, name: "Pre-Go-Live Outage", desc: "Outage occurred May 12, prior to May 15 go-live" },
                  { id: 6, name: "Informal Non-Renewal", desc: "Casual email sent to unlisted address, legally invalid" },
                  { id: 7, name: "Insurance Policy Lapse", desc: "Cyber policy lapses June 30, triggering breach alert" },
                  { id: 8, name: "Premature Milestone Payout", desc: "Paid Feb 18 before delivery on Feb 28" },
                  { id: 9, name: "Flawed Acceptance Test", desc: "98.4% pass fails mandatory 100% test criteria" },
                  { id: 10, name: "Timestamp Paradox", desc: "Internal log Apr 15 refers to target date Mar 7" },
                  { id: 11, name: "Corrupted Event Stream", desc: "Quarantine isolation of malformed JSONL line 8" },
                  { id: 12, name: "Maintenance Overlap", desc: "Upstream 48h/4h window clashes with 72h/2h customer covenant" },
                  { id: 13, name: "Premature Overdue Tag", desc: "Accounting marks invoice overdue during 30d grace" },
                  { id: 14, name: "Proration Failure", desc: "September billed at full $40k despite mid-month effective date" },
                ].map((trap) => (
                  <div key={trap.id} className="p-3 bg-[#F4F3F3] rounded-lg border border-gray-200/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#191919]">Trap #{trap.id}: {trap.name}</span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100/70 font-semibold px-2 py-0.5 rounded">Detected</span>
                    </div>
                    <p className="text-[11px] text-[#191919]/70">{trap.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "phases" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-[#191919]">
                Zero-Backend Frontend Phased Roadmap
              </h4>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 border-l-2 border-[#191919] bg-[#F4F3F3] rounded-r-lg">
                  <span className="font-bold text-[#191919]">Step 1: Mock Data Engine (`lib/mockData.ts`)</span>
                  <p className="mt-1 text-[#191919]/70">
                    Embed canonical contracts (STD, A1, A2, A3, B1, B2, C1, D1), check-points from `clock.json`, and pre-scripted agent debate turns in local TypeScript stores.
                  </p>
                </div>
                <div className="p-3.5 border-l-2 border-[#191919] bg-[#F4F3F3] rounded-r-lg">
                  <span className="font-bold text-[#191919]">Step 2: Dual-Mode API Client (`lib/api.ts` & `hooks/useApi.ts`)</span>
                  <p className="mt-1 text-[#191919]/70">
                    If `http://localhost:8000` is reachable, stream real live data; otherwise smoothly fallback to realistic mock simulation with zero errors.
                  </p>
                </div>
                <div className="p-3.5 border-l-2 border-[#191919] bg-[#F4F3F3] rounded-r-lg">
                  <span className="font-bold text-[#191919]">Step 3: Emil Kowalski Design Craft Polish</span>
                  <p className="mt-1 text-[#191919]/70">
                    Subtle micro-animations, `@apply` styling rules, `transform: scale(0.98)` active states, and mobile touch-friendly drawers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-[#191919]/50">
            Hackathon Plan — Verified Against odin_project_readme.md
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#191919] text-white text-xs font-medium rounded-lg hover:bg-[#191919]/90 transition-colors"
          >
            Close Plan
          </button>
        </div>
      </div>
    </div>
  );
}
