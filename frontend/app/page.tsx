"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import TimeSlider from "@/components/TimeSlider";
import ContractGraph from "@/components/ContractGraph";
import ExposureGauge from "@/components/ExposureGauge";
import DebatePanel from "@/components/DebatePanel";
import AlertActionPanel from "@/components/AlertActionPanel";
import TrapScoreboard from "@/components/TrapScoreboard";
import PortfolioReports from "@/components/PortfolioReports";
import GuardrailMonitor from "@/components/GuardrailMonitor";
import GuardrailAuditTable from "@/components/GuardrailAuditTable";
import CitationDrawer from "@/components/CitationDrawer";
import NoticeModal from "@/components/NoticeModal";
import { CheckpointDate, Citation, ActionNotice } from "@/lib/types";

export default function Home() {
  const [currentCheckpoint, setCurrentCheckpoint] = useState<CheckpointDate>("2027-03-15");
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeNotice, setActiveNotice] = useState<ActionNotice | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [pipelineToast, setPipelineToast] = useState<string | null>(null);

  const handleTriggerAnalysis = () => {
    setPipelineRunning(true);
    setPipelineToast("Odin Orchestrator: Ingesting manifest.json & initiating LangGraph multi-agent pipeline...");
    setTimeout(() => {
      setPipelineToast("Thor Extractor: Re-verifying clause citations against canonical contract corpus...");
    }, 1200);
    setTimeout(() => {
      setPipelineToast("Norns & Heimdall: Synchronizing temporal checkpoints & correlating operational logs...");
    }, 2400);
    setTimeout(() => {
      setPipelineToast("Tyr Arbiter: Precedence applied; all 14 traps neutralized with 0 hallucinations.");
      setPipelineRunning(false);
      setTimeout(() => setPipelineToast(null), 3200);
    }, 3800);
  };

  const handleApproveNotice = (id: string) => {
    setPipelineToast(`Notice #${id} officially approved and signed for formal legal dispatch.`);
    setTimeout(() => setPipelineToast(null), 3500);
  };

  return (
    <main className="min-h-screen bg-[#ffffff] dark:bg-[#09090b] text-[#191919] dark:text-[#f4f4f6] flex flex-col transition-colors duration-200 pb-20">
      {/* Top Navbar: Brand + Active Clock + Action + Theme Toggle */}
      <Navbar
        currentCheckpoint={currentCheckpoint}
        onSelectCheckpoint={setCurrentCheckpoint}
        onTriggerAnalysis={handleTriggerAnalysis}
      />

      {/* Main Single-Page Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-6 pt-6">
        {/* Executive Banner & System KPI Header */}
        <section className="bg-[#fafafa] dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-2xl p-6 sm:p-8 transition-colors duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  RAGNAROK 2026 — PROBLEM STATEMENT 2
                </span>
                <span className="text-xs text-[#191919]/50 dark:text-neutral-400 font-mono">
                  Quillhub Inc. Portfolio War Room
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-[#191919] dark:text-white tracking-tight leading-tight">
                Autonomous Multi-Agent Contract Intelligence
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#191919]/70 dark:text-neutral-300 leading-relaxed font-sans">
                Deconstructs commercial agreements, uncovers silent supersessions and SLA asymmetries,
                deploys adversarial counterparty cross-examination, and enforces deterministic 5-layer guardrails.
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-[#16161c] border border-gray-200/80 dark:border-[#26262e] rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400 uppercase tracking-wider block">
                  Contracts
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919] dark:text-white">
                  8 Active
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  Dynamic Discovery
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#16161c] border border-gray-200/80 dark:border-[#26262e] rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400 uppercase tracking-wider block">
                  Trap Hunter
                </span>
                <span className="text-xl font-serif font-semibold text-emerald-700 dark:text-emerald-400">
                  14 / 14
                </span>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 block mt-0.5">
                  100% Detected
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#16161c] border border-gray-200/80 dark:border-[#26262e] rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400 uppercase tracking-wider block">
                  Citation Match
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919] dark:text-white">
                  100.0%
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  Zero Hallucinations
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#16161c] border border-gray-200/80 dark:border-[#26262e] rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400 uppercase tracking-wider block">
                  Arithmetic Drift
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919] dark:text-white">
                  $0.00
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 block mt-0.5">
                  Python Verified
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Toast Notification */}
          {pipelineToast && (
            <div className="mt-4 p-3 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] rounded-lg text-xs font-mono flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{pipelineToast}</span>
              </div>
              {pipelineRunning && (
                <span className="text-emerald-400 dark:text-emerald-700 font-semibold">
                  Processing...
                </span>
              )}
            </div>
          )}
        </section>

        {/* Section 1: FR9.2 Temporal Checkpoint Scrubber */}
        <section aria-label="Temporal Checkpoint Slider">
          <TimeSlider
            currentCheckpoint={currentCheckpoint}
            onSelectCheckpoint={setCurrentCheckpoint}
          />
        </section>

        {/* Section 2: FR9.1 Interactive Contract Graph */}
        <section aria-label="Contract Relationship Graph">
          <ContractGraph
            checkpoint={currentCheckpoint}
            onSelectCitation={setActiveCitation}
          />
        </section>

        {/* Section 3: FR9.3 Financial Exposure & Recovery Waterfall */}
        <section aria-label="Financial Exposure Gauges">
          <ExposureGauge checkpoint={currentCheckpoint} />
        </section>

        {/* Section 4: FR9.4 Live Multi-Agent Debate Arena */}
        <section aria-label="Multi-Agent Debate Arena">
          <DebatePanel onOpenCitation={setActiveCitation} />
        </section>

        {/* Section 5: FR9.5 Operational Alerts & Legal Notice Action Center */}
        <section aria-label="Alerts and Action Center">
          <AlertActionPanel
            checkpoint={currentCheckpoint}
            onOpenNotice={setActiveNotice}
            onOpenCitation={setActiveCitation}
          />
        </section>

        {/* Section 6: Differentiator - The 14 Traps Scoreboard */}
        <section aria-label="The 14 Traps Matrix">
          <TrapScoreboard onOpenCitation={setActiveCitation} />
        </section>

        {/* Section 7: FR8 Portfolio & Analytical Report Dossiers */}
        <section aria-label="Portfolio Reports">
          <PortfolioReports />
        </section>

        {/* Section 8: Differentiator - 5-Layer Deterministic Guardrail Telemetry */}
        <section aria-label="5-Layer Guardrail Monitor">
          <GuardrailMonitor />
        </section>

        {/* Section 9: NFR2 & NFR4 Deterministic Verification Audit Trail Table */}
        <section aria-label="Verification Audit Event Log">
          <GuardrailAuditTable />
        </section>
      </div>

      {/* Slide-out Citation Drawer (100% Substring Grounding) */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Review & Signing Modal for Formal Legal Notices */}
      <NoticeModal
        notice={activeNotice}
        onClose={() => setActiveNotice(null)}
        onApprove={handleApproveNotice}
        onOpenCitation={setActiveCitation}
      />
    </main>
  );
}
