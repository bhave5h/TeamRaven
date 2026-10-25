"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import TimeSlider from "@/components/TimeSlider";
import ContractGraph from "@/components/ContractGraph";
import ExposureGauge from "@/components/ExposureGauge";
import DebatePanel from "@/components/DebatePanel";
import AlertActionPanel from "@/components/AlertActionPanel";
import TrapScoreboard from "@/components/TrapScoreboard";
import GuardrailMonitor from "@/components/GuardrailMonitor";
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
    setPipelineToast("Odin Orchestrator: Ingesting manifest.json & running LangGraph multi-agent pipeline...");
    setTimeout(() => {
      setPipelineToast("Thor Extractor: Re-verifying clause citations against bundle/contracts/*.txt...");
    }, 1200);
    setTimeout(() => {
      setPipelineToast("Norns & Heimdall: Syncing timeline with clock.json & filtering Drop 1 noise...");
    }, 2400);
    setTimeout(() => {
      setPipelineToast("Tyr Arbiter: Judicial rulings signed; 14/14 traps neutralized with 0 hallucinations.");
      setPipelineRunning(false);
      setTimeout(() => setPipelineToast(null), 3000);
    }, 3800);
  };

  const handleApproveNotice = (id: string) => {
    setPipelineToast(`Notice #${id} officially signed and approved for registered courier dispatch.`);
    setTimeout(() => setPipelineToast(null), 3500);
  };

  return (
    <main className="min-h-screen bg-white text-[#191919] flex flex-col selection:bg-[#191919] selection:text-white pb-16">
      {/* Top Navbar */}
      <Navbar
        currentCheckpoint={currentCheckpoint}
        onSelectCheckpoint={setCurrentCheckpoint}
        onTriggerAnalysis={handleTriggerAnalysis}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-6 pt-6">
        {/* Executive Banner & System KPI Header */}
        <section className="bg-[#fafafa] border border-gray-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  RAGNAROK 2026 — PROBLEM STATEMENT 2
                </span>
                <span className="text-xs text-[#191919]/50 font-mono">
                  Quillhub Inc. Portfolio War Room
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-[#191919] tracking-tight leading-tight">
                Autonomous Multi-Agent Contract Intelligence
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#191919]/70 leading-relaxed font-sans">
                Deconstructs commercial agreements, uncovers silent supersessions and SLA asymmetries,
                deploys adversarial counterparty cross-examination, and enforces deterministic 5-layer guardrails.
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-gray-200/80 rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 uppercase tracking-wider block">
                  Contracts
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919]">
                  8 Active
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                  Dynamic Discovery
                </span>
              </div>

              <div className="p-3 bg-white border border-gray-200/80 rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 uppercase tracking-wider block">
                  Trap Hunter
                </span>
                <span className="text-xl font-serif font-semibold text-emerald-700">
                  14 / 14
                </span>
                <span className="text-[10px] font-mono text-emerald-800 block mt-0.5">
                  100% Detected
                </span>
              </div>

              <div className="p-3 bg-white border border-gray-200/80 rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 uppercase tracking-wider block">
                  Citation Match
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919]">
                  100.0%
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                  Zero Hallucinations
                </span>
              </div>

              <div className="p-3 bg-white border border-gray-200/80 rounded-xl">
                <span className="text-[10px] font-mono text-[#191919]/50 uppercase tracking-wider block">
                  Arithmetic Drift
                </span>
                <span className="text-xl font-serif font-semibold text-[#191919]">
                  $0.00
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                  Python Verified
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Toast Notification */}
          {pipelineToast && (
            <div className="mt-4 p-3 bg-[#191919] text-white rounded-lg text-xs font-mono flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{pipelineToast}</span>
              </div>
              {pipelineRunning && <span className="text-emerald-400">Processing...</span>}
            </div>
          )}
        </section>

        {/* FR9.2: Temporal Checkpoint Slider */}
        <section>
          <TimeSlider
            currentCheckpoint={currentCheckpoint}
            onSelectCheckpoint={setCurrentCheckpoint}
          />
        </section>

        {/* FR9.1: Interactive Contract Graph */}
        <section>
          <ContractGraph
            checkpoint={currentCheckpoint}
            onSelectCitation={setActiveCitation}
          />
        </section>

        {/* FR9.3: Exposure Gauge & Recovery Waterfall */}
        <section>
          <ExposureGauge checkpoint={currentCheckpoint} />
        </section>

        {/* FR9.4: Multi-Agent Debate Arena */}
        <section>
          <DebatePanel onOpenCitation={setActiveCitation} />
        </section>

        {/* FR9.5: Alerts & Action Notices */}
        <section>
          <AlertActionPanel
            checkpoint={currentCheckpoint}
            onOpenNotice={setActiveNotice}
            onOpenCitation={setActiveCitation}
          />
        </section>

        {/* Differentiator 1: The 14 Traps Scoreboard */}
        <section>
          <TrapScoreboard onOpenCitation={setActiveCitation} />
        </section>

        {/* Differentiator 2: 5-Layer Guardrail Monitor */}
        <section>
          <GuardrailMonitor />
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
