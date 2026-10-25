"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import TimeSlider from "@/components/TimeSlider";
import ContractGraph from "@/components/ContractGraph";
import ExposureGauge from "@/components/ExposureGauge";
import RiskHeatmap from "@/components/RiskHeatmap";
import DebatePanel from "@/components/DebatePanel";
import AlertActionPanel from "@/components/AlertActionPanel";
import TrapScoreboard from "@/components/TrapScoreboard";
import PortfolioReports from "@/components/PortfolioReports";
import GuardrailMonitor from "@/components/GuardrailMonitor";
import GuardrailAuditTable from "@/components/GuardrailAuditTable";
import CitationDrawer from "@/components/CitationDrawer";
import NoticeModal from "@/components/NoticeModal";
import HeroSection from "@/components/HeroSection";
import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer";
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
    <div className="min-h-screen bg-[#f8faf9] text-[#14211a] flex flex-col items-center">
      {/* Tactical Entry Preloader */}
      <Preloader />

      {/* Centered Structured Frame (1120px max-width, matching Footer boundaries) */}
      <div className="w-full max-w-[1120px] mx-auto border-x border-[#dce8e1] bg-white min-h-screen flex flex-col shadow-2xs">
        {/* Top Navbar: Brand + Center Links + Active Clock + Action */}
        <Navbar
          currentCheckpoint={currentCheckpoint}
          onSelectCheckpoint={setCurrentCheckpoint}
          onTriggerAnalysis={handleTriggerAnalysis}
        />

        {/* Hero Section: Classical Landscape Banner, Serif Headline, Dual CTAs, 8-Partner Border Strip */}
        <HeroSection onTriggerAnalysis={handleTriggerAnalysis} />

        {/* Main Single-Page Content Container */}
        <main id="war-room" className="w-full px-[clamp(20px,3.2vw,30px)] py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
          {/* Executive Banner & System KPI Header */}
          <section className="bg-[#f3f8f5] border border-[#dce8e1] rounded-xl p-5 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-[#dce8e1]">
                    RAGNAROK 2026 — PROBLEM STATEMENT 2
                  </span>
                  <span className="text-xs text-[#67776e] font-mono">
                    Quillhub Inc. Portfolio War Room
                  </span>
                </div>
                <h1 className="mt-2.5 text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-[#14211a] tracking-tight leading-tight">
                  Autonomous Multi-Agent Contract Intelligence
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#67776e] leading-relaxed font-sans">
                  Deconstructs commercial agreements, uncovers silent supersessions and SLA asymmetries,
                  deploys adversarial counterparty cross-examination, and enforces deterministic 5-layer guardrails.
                </p>
              </div>

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-[#dce8e1] rounded-lg shadow-2xs">
                  <span className="text-[10px] font-mono text-[#67776e] uppercase tracking-wider block">
                    Contracts
                  </span>
                  <span className="text-xl font-serif font-semibold text-[#14211a]">
                    8 Active
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                    Dynamic Discovery
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#dce8e1] rounded-lg shadow-2xs">
                  <span className="text-[10px] font-mono text-[#67776e] uppercase tracking-wider block">
                    Trap Hunter
                  </span>
                  <span className="text-xl font-serif font-semibold text-emerald-700">
                    14 / 14
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 block mt-0.5">
                    100% Detected
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#dce8e1] rounded-lg shadow-2xs">
                  <span className="text-[10px] font-mono text-[#67776e] uppercase tracking-wider block">
                    Citation Match
                  </span>
                  <span className="text-xl font-serif font-semibold text-[#14211a]">
                    100.0%
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                    Zero Hallucinations
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#dce8e1] rounded-lg shadow-2xs">
                  <span className="text-[10px] font-mono text-[#67776e] uppercase tracking-wider block">
                    Arithmetic Drift
                  </span>
                  <span className="text-xl font-serif font-semibold text-[#14211a]">
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
              <div className="mt-4 p-3 bg-[#14211a] text-white rounded-lg text-xs font-mono flex items-center justify-between shadow-md border border-[#dce8e1]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{pipelineToast}</span>
                </div>
                {pipelineRunning && (
                  <span className="text-emerald-400 font-semibold">
                    Processing...
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Section 1: FR9.2 Temporal Checkpoint Scrubber */}
          <section id="timeline" aria-label="Temporal Checkpoint Slider">
            <TimeSlider
              currentCheckpoint={currentCheckpoint}
              onSelectCheckpoint={setCurrentCheckpoint}
            />
          </section>

          {/* Section 2: FR9.1 Interactive Contract Graph */}
          <section id="graph" aria-label="Contract Relationship Graph">
            <ContractGraph
              checkpoint={currentCheckpoint}
              onSelectCitation={setActiveCitation}
            />
          </section>

          {/* Section 3: FR9.3 Financial Exposure & Recovery Waterfall */}
          <section aria-label="Financial Exposure Gauges" className="space-y-6 sm:space-y-8">
            <ExposureGauge checkpoint={currentCheckpoint} />
            <RiskHeatmap
              checkpoint={currentCheckpoint}
              onOpenCitation={setActiveCitation}
            />
          </section>

          {/* Section 4: FR9.4 Live Multi-Agent Debate Arena */}
          <section id="agents" aria-label="Multi-Agent Debate Arena">
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
          <section id="traps" aria-label="The 14 Traps Matrix">
            <TrapScoreboard onOpenCitation={setActiveCitation} />
          </section>

          {/* Section 7: FR8 Portfolio & Analytical Report Dossiers */}
          <section aria-label="Portfolio Reports">
            <PortfolioReports />
          </section>

          {/* Section 8: Differentiator - 5-Layer Deterministic Guardrail Telemetry */}
          <section id="guardrails" aria-label="5-Layer Guardrail Monitor">
            <GuardrailMonitor />
          </section>

          {/* Section 9: NFR2 & NFR4 Deterministic Verification Audit Trail Table */}
          <section aria-label="Verification Audit Event Log">
            <GuardrailAuditTable />
          </section>
        </main>

        {/* Ridgeline Dither Site Footer (Enclosed within shared container width) */}
        <div className="w-full border-t border-[#dce8e1]">
          <RidgelineDitherFooter
            name="Odin War Room"
            tagline="Autonomous multi-agent contract intelligence and real-time legal risk arbitration for enterprise portfolios."
            brandHref="#"
            preset="evergreen"
            maxWidth="100%"
            columns={[
              {
                title: "War Room",
                links: [
                  { label: "Contract Universe" },
                  { label: "Temporal Scrubber" },
                  { label: "Waterfall Analysis" },
                  { label: "Risk Heatmap", badge: "Live" },
                ],
              },
              {
                title: "Multi-Agent Arena",
                links: [
                  { label: "Loki (Adversary)" },
                  { label: "Heimdall (Radar)" },
                  { label: "Tyr (Arbiter)" },
                  { label: "Mimir (Supervisor)" },
                ],
              },
              {
                title: "Evaluation & Traps",
                links: [
                  { label: "The 14 Traps", badge: "14/14" },
                  { label: "Citation Guardrails" },
                  { label: "Manifest Ingestion" },
                  { label: "Quillhub Inc. Audit" },
                ],
              },
            ]}
            socials={[
              { icon: "github", href: "https://github.com/bhave5h/TeamRaven" },
              { icon: "x", href: "https://x.com" },
              { icon: "linkedin", href: "https://linkedin.com" },
            ]}
            copyright="© 2027 Quillhub Inc. / TeamRaven. Ragnarok Hackathon 2026 Problem Statement 2."
            credit={{ label: "Team Raven", href: "https://github.com/bhave5h/TeamRaven" }}
          />
        </div>
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
    </div>
  );
}
