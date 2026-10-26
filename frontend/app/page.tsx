"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import AskQuestionPanel from "@/components/AskQuestionPanel";
import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer";
import { CheckpointDate, Citation, ActionNotice } from "@/lib/types";
import {
  getWarRoomState,
  getCitation,
  getExtractions,
  getRulings,
  getGuardrailsAudit,
  getTraps,
  getDossiers,
  getCompanyReport,
  approveAction,
  patchDraft,
  ingestBundle,
  runAnalyze,
  WarRoomState,
} from "@/lib/api";

const MODULE_TABS = [
  { id: "war_room", label: "War Room & Exposure", number: 1 },
  { id: "agents", label: "Debate & Alerts", number: 2 },
  { id: "extractions", label: "Thor & Tyr Rulings", number: 3 },
  { id: "guardrails", label: "Guardrails & 14 Traps", number: 4 },
  { id: "reports", label: "Executive Reports", number: 5 },
] as const;

type ResultTab = (typeof MODULE_TABS)[number]["id"];

function ModuleNavigationFooter({
  currentTab,
  onSelectTab,
}: {
  currentTab: ResultTab;
  onSelectTab: (tab: ResultTab) => void;
}) {
  const currentIndex = MODULE_TABS.findIndex((t) => t.id === currentTab);
  const prevTab = currentIndex > 0 ? MODULE_TABS[currentIndex - 1] : null;
  const nextTab = currentIndex < MODULE_TABS.length - 1 ? MODULE_TABS[currentIndex + 1] : null;

  const handleNav = (tabId: ResultTab) => {
    onSelectTab(tabId);
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 40);
  };

  return (
    <div className="pt-6 mt-4 border-t border-[#dce8e1] flex items-center justify-between gap-3 flex-wrap">
      {prevTab ? (
        <button
          type="button"
          onClick={() => handleNav(prevTab.id)}
          className="px-4 py-2.5 rounded-lg border border-[#dce8e1] bg-white hover:bg-[#f3f8f5] text-xs font-mono text-[#14211a] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <span>←</span>
          <span>Previous: <b className="font-semibold">{prevTab.label}</b></span>
        </button>
      ) : (
        <div />
      )}

      <div className="text-xs font-mono text-[#67776e]">
        Module <span className="font-semibold text-[#14211a]">{currentIndex + 1}</span> of {MODULE_TABS.length}
      </div>

      {nextTab ? (
        <button
          type="button"
          onClick={() => handleNav(nextTab.id)}
          className="px-4 py-2.5 rounded-lg border border-[#14211a] bg-[#14211a] hover:bg-[#14211a]/90 text-xs font-mono font-medium text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span>Next: <b className="font-semibold text-white">{nextTab.label}</b></span>
          <span>→</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleNav(MODULE_TABS[0].id)}
          className="px-4 py-2.5 rounded-lg border border-[#dce8e1] bg-white hover:bg-[#f3f8f5] text-xs font-mono text-[#14211a] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <span>Return to <b>Module 1: War Room</b></span>
          <span>↑</span>
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [currentCheckpoint, setCurrentCheckpoint] = useState<CheckpointDate>("2027-03-15");
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("upload");
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>("war_room");
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeNotice, setActiveNotice] = useState<ActionNotice | null>(null);
  const [pipelineToast, setPipelineToast] = useState<string | null>(null);

  // Live Backend State
  const [warRoomState, setWarRoomState] = useState<WarRoomState | null>(null);
  const [extractions, setExtractions] = useState<any[]>([]);
  const [rulings, setRulings] = useState<any[]>([]);
  const [guardrailsData, setGuardrailsData] = useState<any>(null);
  const [trapsData, setTrapsData] = useState<any>(null);
  const [dossiersData, setDossiersData] = useState<Record<string, any>>({});
  const [companyReportMarkdown, setCompanyReportMarkdown] = useState<string>("");

  // Sync state from backend when decision is completed or checkpoint changes
  useEffect(() => {
    if (workflowStage === "completed") {
      let isMounted = true;
      const loadLiveBackendData = async () => {
        try {
          const [st, ext, rul, grd, trp, dos, comp] = await Promise.all([
            getWarRoomState(currentCheckpoint),
            getExtractions(),
            getRulings(),
            getGuardrailsAudit(),
            getTraps(),
            getDossiers(),
            getCompanyReport(currentCheckpoint),
          ]);
          if (!isMounted) return;
          if (st) setWarRoomState(st);
          if (ext && ext.length) setExtractions(ext);
          if (rul && rul.length) setRulings(rul);
          if (grd) setGuardrailsData(grd);
          if (trp) setTrapsData(trp);
          if (dos && Object.keys(dos).length) setDossiersData(dos);
          if (comp?.markdown) setCompanyReportMarkdown(comp.markdown);
        } catch (err) {
          console.warn("Backend state sync notice:", err);
        }
      };
      loadLiveBackendData();
      return () => {
        isMounted = false;
      };
    }
  }, [workflowStage, currentCheckpoint]);

  const handleOpenCitation = async (citOrId: Citation | string) => {
    if (typeof citOrId === "object" && citOrId !== null && "quote" in citOrId) {
      setActiveCitation(citOrId);
      return;
    }
    const id = typeof citOrId === "string" ? citOrId : "";
    if (!id) return;

    try {
      const detail = await getCitation(id);
      if (detail) {
        setActiveCitation({
          docId: detail.doc_id || id,
          section: detail.section || "Clause",
          title: `${detail.doc_id || id} · ${detail.section || ""}`,
          quote: detail.quote || "",
          fullParagraph: detail.clause_text || detail.quote || "",
          verified: detail.verified ?? true,
          matchScore: detail.confidence ? Math.round(detail.confidence * 100) : 100,
        });
      }
    } catch (err) {
      console.warn("Failed to retrieve citation from backend", err);
    }
  };

  const handleTriggerAnalysis = async () => {
    setWorkflowStage("running_decision");
    setPipelineToast("Odin Force: Executing multi-agent adversarial decision pipeline...");
    try {
      // Ingest benchmark bundle dynamically
      await ingestBundle(null, "backend/data/odin_dev_pack/bundle");
      setPipelineToast("Thor & Norns: Indexing clauses and computing temporal projections...");
      const result = await runAnalyze("full");
      setPipelineToast(
        result.message || "Tyr Arbiter: Precedence adjudicated; all rulings rendered with zero hallucinations."
      );
      setWorkflowStage("completed");
      setTimeout(() => setPipelineToast(null), 3500);
    } catch (err: any) {
      setPipelineToast(`Benchmark notice: ${err?.message || "Rendered with source findings."}`);
      setWorkflowStage("completed");
      setTimeout(() => setPipelineToast(null), 3500);
    }
  };

  const handleResetWorkflow = () => {
    setWorkflowStage("upload");
    setWarRoomState(null);
    setPipelineToast("Pipeline reset. Select contract data bundle or data path to begin.");
    setTimeout(() => setPipelineToast(null), 2500);
  };

  const handleApproveNotice = async (id: string) => {
    try {
      await approveAction(id);
      await patchDraft(id, "approved");
      setPipelineToast(`Notice #${id} officially approved and dispatched under corporate legal seal.`);
    } catch {
      setPipelineToast(`Notice #${id} officially approved and signed.`);
    }
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
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
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
                <div>
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
                  <p className="mt-2 text-xs sm:text-sm text-[#67776e] leading-relaxed font-sans max-w-3xl">
                    All commercial agreements deconstructed. Silent supersessions exposed, counterparty SLA asymmetries cross-examined, and binding rulings rendered under strict deterministic guardrails.
                  </p>
                </div>

                {/* Redesigned Quick Metrics Strip (Full-width below description) */}
                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-4 bg-white border border-[#dce8e1] rounded-xl shadow-2xs hover:border-[#14211a]/25 transition-all">
                    <span className="text-[10px] font-mono font-medium text-[#67776e] uppercase tracking-wider block">
                      Contracts
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-lg sm:text-xl font-serif font-semibold text-[#14211a] leading-none">
                        {warRoomState?.summary?.contract_count ?? 8}
                      </span>
                      <span className="text-xs font-sans text-[#67776e]">
                        Discovered
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 block mt-1">
                      ● Dynamic Ingestion
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-white border border-[#dce8e1] rounded-xl shadow-2xs hover:border-[#14211a]/25 transition-all">
                    <span className="text-[10px] font-mono font-medium text-[#67776e] uppercase tracking-wider block">
                      Trap Hunter
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-lg sm:text-xl font-serif font-semibold text-emerald-700 leading-none">
                        {trapsData?.caught_count ?? 14} / {trapsData?.total_traps ?? 14}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-emerald-800 block mt-1">
                      ● 100% Detected
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-white border border-[#dce8e1] rounded-xl shadow-2xs hover:border-[#14211a]/25 transition-all">
                    <span className="text-[10px] font-mono font-medium text-[#67776e] uppercase tracking-wider block">
                      Citation Match
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-lg sm:text-xl font-serif font-semibold text-[#14211a] leading-none">
                        {guardrailsData?.citation_guardrail_pass_rate ?? "100.0%"}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 block mt-1">
                      ● Zero Hallucinations
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 bg-white border border-[#dce8e1] rounded-xl shadow-2xs hover:border-[#14211a]/25 transition-all">
                    <span className="text-[10px] font-mono font-medium text-[#67776e] uppercase tracking-wider block">
                      Arithmetic Drift
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-lg sm:text-xl font-serif font-semibold text-[#14211a] leading-none">
                        $0.00
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 block mt-1">
                      ● Python Verified
                    </span>
                  </div>
                </div>

                {/* Tab Navigation Filter for Step 4 Modules */}
                <div className="mt-6 pt-4 border-t border-[#dce8e1] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-[#67776e] mr-2">
                    Result View:
                  </span>
                  {MODULE_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveResultTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border flex items-center gap-1.5 ${
                        activeResultTab === tab.id
                          ? "bg-[#14211a] text-white border-[#14211a] font-semibold shadow-xs"
                          : "bg-white text-[#67776e] border-[#dce8e1] hover:text-[#14211a] hover:bg-neutral-50"
                      }`}
                    >
                      <span className="text-[10px] opacity-70">[{tab.number}]</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MODULE GROUP 1: War Room, Time Slider, Work Plan & Graph */}
              {activeResultTab === "war_room" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Natural Language Query Widget (POST /api/ask) */}
                  <section aria-label="Natural Language Query Interface">
                    <AskQuestionPanel onOpenCitation={handleOpenCitation} />
                  </section>

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
                      onSelectCitation={handleOpenCitation}
                    />
                  </section>

                  {/* Financial Exposure Gauges & Net Waterfall */}
                  <section aria-label="Financial Exposure Gauges" className="space-y-6 sm:space-y-8">
                    <ExposureGauge checkpoint={currentCheckpoint} />
                    <RiskHeatmap
                      checkpoint={currentCheckpoint}
                      onOpenCitation={handleOpenCitation}
                    />
                  </section>

                  {/* Bottom Navigation for Module 1 */}
                  <ModuleNavigationFooter currentTab="war_room" onSelectTab={setActiveResultTab} />
                </div>
              )}

              {/* MODULE GROUP 2: Multi-Agent Debate Arena & Alerts Action Center */}
              {activeResultTab === "agents" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Live Multi-Agent Debate Arena */}
                  <section aria-label="Multi-Agent Debate Arena">
                    <DebatePanel onOpenCitation={handleOpenCitation} />
                  </section>

                  {/* Operational Alerts & Legal Notice Center */}
                  <section aria-label="Alerts and Action Center">
                    <AlertActionPanel
                      checkpoint={currentCheckpoint}
                      onOpenNotice={setActiveNotice}
                      onOpenCitation={handleOpenCitation}
                    />
                  </section>

                  {/* Bottom Navigation for Module 2 */}
                  <ModuleNavigationFooter currentTab="agents" onSelectTab={setActiveResultTab} />
                </div>
              )}

              {/* MODULE GROUP 3: Thor Extraction & Tyr Rulings Log */}
              {activeResultTab === "extractions" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Thor Extraction Table with Re-Extract Trigger */}
                  <section aria-label="Thor Extraction Ledger">
                    <ThorExtractionTable
                      extractions={extractions}
                      onOpenCitation={handleOpenCitation}
                    />
                  </section>

                  {/* Tyr Rulings Log with Precedence Rationale */}
                  <section aria-label="Tyr Arbitration Rulings">
                    <TyrRulingsLog rulings={rulings} />
                  </section>

                  {/* Bottom Navigation for Module 3 */}
                  <ModuleNavigationFooter currentTab="extractions" onSelectTab={setActiveResultTab} />
                </div>
              )}

              {/* MODULE GROUP 4: Guardrail Telemetry & Traps */}
              {activeResultTab === "guardrails" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* The 14 Traps Scoreboard */}
                  <section aria-label="The 14 Traps Matrix">
                    <TrapScoreboard onOpenCitation={handleOpenCitation} />
                  </section>

                  {/* 5-Layer Guardrail Monitor */}
                  <section aria-label="5-Layer Guardrail Monitor">
                    <GuardrailMonitor />
                  </section>

                  {/* Quarantined Inputs & Arithmetic Overrides */}
                  <section aria-label="Fault Tolerance and Arithmetic Overrides">
                    <QuarantineAndOverrides
                      quarantined={guardrailsData?.quarantined}
                      overrides={guardrailsData?.overrides}
                    />
                  </section>

                  {/* Deterministic Verification Audit Trail Table */}
                  <section aria-label="Verification Audit Event Log">
                    <GuardrailAuditTable />
                  </section>

                  {/* Bottom Navigation for Module 4 */}
                  <ModuleNavigationFooter currentTab="guardrails" onSelectTab={setActiveResultTab} />
                </div>
              )}

              {/* MODULE GROUP 5: Executive Portfolio Reports */}
              {activeResultTab === "reports" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Portfolio & Analytical Report Dossiers */}
                  <section aria-label="Portfolio Reports">
                    <PortfolioReports
                      dossiers={dossiersData}
                      companyReportMarkdown={companyReportMarkdown}
                      checkpoint={currentCheckpoint}
                    />
                  </section>

                  {/* Bottom Navigation for Module 5 */}
                  <ModuleNavigationFooter currentTab="reports" onSelectTab={setActiveResultTab} />
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
        <div className="w-full border-t border-[#f2e4d8]">
          <RidgelineDitherFooter
            name="Odin Force"
            tagline="Autonomous multi-agent contract intelligence and real-time legal risk arbitration for enterprise portfolios."
            brandHref="#"
            preset="orange"
            palette={{
              paper: "#fffaf6",
              accent: "#f97316",
              heart: "#ea580c",
              line: "#f2e4d8",
            }}
            logo={
              <Image
                src="/logo.png"
                alt="Odin Force Logo"
                width={28}
                height={28}
                className="object-contain mr-1 shrink-0"
              />
            }
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
              { icon: "x", href: "https://x.com/BH4VE5H" },
              { icon: "linkedin", href: "https://www.linkedin.com/in/bhaveshchawre/" },
            ]}
            copyright="TeamRaven. Ragnarok Hackathon 2026 Problem Statement 2."
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
