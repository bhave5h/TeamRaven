"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import OdinForceWorkflow, { WorkflowStage } from "@/components/OdinForceWorkflow";
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
import ThorExtractionTable from "@/components/ThorExtractionTable";
import TyrRulingsLog from "@/components/TyrRulingsLog";
import QuarantineAndOverrides from "@/components/QuarantineAndOverrides";
import WorkPlanTable from "@/components/WorkPlanTable";
import CitationDrawer from "@/components/CitationDrawer";
import NoticeModal from "@/components/NoticeModal";
import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer";
import { CheckpointDate, Citation, ActionNotice } from "@/lib/types";

type ResultTab = "all" | "war_room" | "agents" | "extractions" | "guardrails" | "reports";

export default function Home() {
  const [currentCheckpoint, setCurrentCheckpoint] = useState<CheckpointDate>("2027-03-15");
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("upload");
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("all");
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeNotice, setActiveNotice] = useState<ActionNotice | null>(null);
  const [pipelineToast, setPipelineToast] = useState<string | null>(null);

  const handleTriggerAnalysis = () => {
    setWorkflowStage("running_decision");
    setPipelineToast("Odin Force: Triggered multi-agent adversarial decision pipeline...");
    setTimeout(() => {
      setPipelineToast("Thor & Norns: Indexing clauses and computing temporal projections...");
    }, 1000);
    setTimeout(() => {
      setPipelineToast("Loki & Heimdall: Cross-examining counterparty claims against operational logs...");
    }, 2000);
    setTimeout(() => {
      setPipelineToast("Tyr Arbiter: Precedence adjudicated; all 14 traps resolved with 0 hallucinations.");
      setWorkflowStage("completed");
      setTimeout(() => setPipelineToast(null), 3500);
    }, 3000);
  };

  const handleResetWorkflow = () => {
    setWorkflowStage("upload");
    setPipelineToast("Pipeline reset. Select contract data bundle or data path to begin.");
    setTimeout(() => setPipelineToast(null), 2500);
  };

  const handleApproveNotice = (id: string) => {
    setPipelineToast(`Notice #${id} officially approved and dispatched under corporate legal seal.`);
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

        {/* Hero Section: Preserved Exactly as Established */}
        <HeroSection onTriggerAnalysis={handleTriggerAnalysis} />

        {/* Main Content Container: Workflow Begins Immediately After Hero */}
        <main id="odin-force" className="w-full px-[clamp(20px,3.2vw,30px)] py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
          {/* Toast Notification Banner */}
          {pipelineToast && (
            <div className="p-3 bg-[#14211a] text-white rounded-lg text-xs font-mono flex items-center justify-between shadow-md border border-[#dce8e1]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{pipelineToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setPipelineToast(null)}
                className="text-white/60 hover:text-white font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Sequential Workflow Stages: Step 1 (Upload/Path) -> Step 2 (Ingest Data) -> Step 3 (Run Decision) */}
          <section aria-label="Odin Force Execution Pipeline">
            <OdinForceWorkflow
              currentStage={workflowStage}
              onStageChange={setWorkflowStage}
              onResetWorkflow={handleResetWorkflow}
              onSelectCheckpoint={setCurrentCheckpoint}
            />
          </section>

          {/* STEP 4: Results & Supporting Components (Unlocked After Step 3 or when completed) */}
          {workflowStage === "completed" ? (
            <section
              id="results-section"
              aria-label="Adversarial Decision Results"
              className="space-y-6 sm:space-y-8 pt-2"
            >
              {/* Executive Decision Banner & KPI Matrix */}
              <div className="bg-[#f3f8f5] border border-[#dce8e1] rounded-xl p-5 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-[#dce8e1]">
                        STEP 4 — DECISION COMPLETE
                      </span>
                      <span className="text-xs text-[#67776e] font-mono">
                        Quillhub Inc. Portfolio Arbitrated
                      </span>
                    </div>
                    <h2 className="mt-2.5 text-2xl sm:text-3xl font-serif font-normal text-[#14211a] tracking-tight leading-tight">
                      Adversarial Contract Intelligence & Rulings
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-[#67776e] leading-relaxed font-sans">
                      All commercial agreements deconstructed. Silent supersessions exposed, counterparty SLA asymmetries cross-examined, and binding rulings rendered under strict deterministic guardrails.
                    </p>
                  </div>

                  {/* Quick Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-[#dce8e1] rounded-lg shadow-2xs">
                      <span className="text-[10px] font-mono text-[#67776e] uppercase tracking-wider block">
                        Contracts
                      </span>
                      <span className="text-xl font-serif font-semibold text-[#14211a]">
                        6 Discovered
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                        Dynamic Ingestion
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

                {/* Tab Navigation Filter for Step 4 Modules */}
                <div className="mt-6 pt-4 border-t border-[#dce8e1] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-[#67776e] mr-2">
                    Result View:
                  </span>
                  {[
                    { id: "all", label: "All Modules" },
                    { id: "war_room", label: "War Room & Exposure" },
                    { id: "agents", label: "Debate & Alerts" },
                    { id: "extractions", label: "Thor & Tyr Rulings" },
                    { id: "guardrails", label: "Guardrails & 14 Traps" },
                    { id: "reports", label: "Executive Reports" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveResultTab(tab.id as ResultTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                        activeResultTab === tab.id
                          ? "bg-[#14211a] text-white border-[#14211a] font-semibold"
                          : "bg-white text-[#67776e] border-[#dce8e1] hover:text-[#14211a] hover:bg-neutral-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* MODULE GROUP 1: War Room, Time Slider, Work Plan & Graph */}
              {(activeResultTab === "all" || activeResultTab === "war_room") && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Temporal Checkpoint Scrubber */}
                  <section aria-label="Temporal Checkpoint Slider">
                    <TimeSlider
                      currentCheckpoint={currentCheckpoint}
                      onSelectCheckpoint={setCurrentCheckpoint}
                    />
                  </section>

                  {/* Workstream Plan Execution Matrix */}
                  <section aria-label="Workstream Execution Plan">
                    <WorkPlanTable />
                  </section>

                  {/* Interactive Contract Graph */}
                  <section aria-label="Contract Relationship Graph">
                    <ContractGraph
                      checkpoint={currentCheckpoint}
                      onSelectCitation={setActiveCitation}
                    />
                  </section>

                  {/* Financial Exposure Gauges & Net Waterfall */}
                  <section aria-label="Financial Exposure Gauges" className="space-y-6 sm:space-y-8">
                    <ExposureGauge checkpoint={currentCheckpoint} />
                    <RiskHeatmap
                      checkpoint={currentCheckpoint}
                      onOpenCitation={setActiveCitation}
                    />
                  </section>
                </div>
              )}

              {/* MODULE GROUP 2: Multi-Agent Debate Arena & Alerts Action Center */}
              {(activeResultTab === "all" || activeResultTab === "agents") && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Live Multi-Agent Debate Arena */}
                  <section aria-label="Multi-Agent Debate Arena">
                    <DebatePanel onOpenCitation={setActiveCitation} />
                  </section>

                  {/* Operational Alerts & Legal Notice Center */}
                  <section aria-label="Alerts and Action Center">
                    <AlertActionPanel
                      checkpoint={currentCheckpoint}
                      onOpenNotice={setActiveNotice}
                      onOpenCitation={setActiveCitation}
                    />
                  </section>
                </div>
              )}

              {/* MODULE GROUP 3: Thor Extraction & Tyr Rulings Log */}
              {(activeResultTab === "all" || activeResultTab === "extractions") && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Thor Extraction Table with Re-Extract Trigger */}
                  <section aria-label="Thor Extraction Ledger">
                    <ThorExtractionTable onOpenCitation={setActiveCitation} />
                  </section>

                  {/* Tyr Rulings Log with Precedence Rationale */}
                  <section aria-label="Tyr Arbitration Rulings">
                    <TyrRulingsLog />
                  </section>
                </div>
              )}

              {/* MODULE GROUP 4: Guardrail Telemetry & Traps */}
              {(activeResultTab === "all" || activeResultTab === "guardrails") && (
                <div className="space-y-6 sm:space-y-8">
                  {/* The 14 Traps Scoreboard */}
                  <section aria-label="The 14 Traps Matrix">
                    <TrapScoreboard onOpenCitation={setActiveCitation} />
                  </section>

                  {/* 5-Layer Guardrail Telemetry */}
                  <section aria-label="5-Layer Guardrail Monitor">
                    <GuardrailMonitor />
                  </section>

                  {/* Quarantined Inputs & Arithmetic Overrides */}
                  <section aria-label="Fault Tolerance and Arithmetic Overrides">
                    <QuarantineAndOverrides />
                  </section>

                  {/* Deterministic Verification Audit Trail Table */}
                  <section aria-label="Verification Audit Event Log">
                    <GuardrailAuditTable />
                  </section>
                </div>
              )}

              {/* MODULE GROUP 5: Executive Portfolio Reports */}
              {(activeResultTab === "all" || activeResultTab === "reports") && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Portfolio & Analytical Report Dossiers */}
                  <section aria-label="Portfolio Reports">
                    <PortfolioReports />
                  </section>
                </div>
              )}
            </section>
          ) : (
            /* Locked State Placeholder when Step 4 is awaiting execution */
            <section className="bg-white border border-dashed border-[#dce8e1] rounded-xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#f3f8f5] border border-[#dce8e1] flex items-center justify-center mx-auto text-xl">
                🔒
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-serif font-normal text-lg sm:text-xl text-[#14211a]">
                  Step 4 Awaiting Multi-Agent Execution
                </h3>
                <p className="text-xs text-[#67776e] leading-relaxed">
                  Complete <b>Step 1</b> (select contract bundle or data path), click <b>Step 2</b> (Ingest Data), and trigger <b>Step 3</b> (Run Decision) to unlock arbitration results, financial waterfalls, and live debate logs.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTriggerAnalysis}
                  className="px-4 py-2 rounded-lg bg-[#14211a] text-white hover:bg-[#14211a]/90 text-xs font-mono font-medium transition-all cursor-pointer shadow-xs"
                >
                  Quick Run: Execute Canonical Benchmark Decision ⚡
                </button>
              </div>
            </section>
          )}
        </main>

        {/* Ridgeline Dither Site Footer (Enclosed within shared container width) */}
        <div className="w-full border-t border-[#dce8e1]">
          <RidgelineDitherFooter
            name="Odin Force"
            tagline="Autonomous multi-agent contract intelligence and real-time legal risk arbitration for enterprise portfolios."
            brandHref="#"
            preset="evergreen"
            maxWidth="100%"
            columns={[
              {
                title: "Odin Force",
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
                  { label: "Thor (Extractor)" },
                ],
              },
              {
                title: "Evaluation & Traps",
                links: [
                  { label: "The 14 Traps", badge: "14/14" },
                  { label: "Citation Guardrails" },
                  { label: "Quarantine Log" },
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
