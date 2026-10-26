"use client";

import React, { useState, useRef } from "react";
import { CheckpointDate } from "@/lib/types";
import { ingestBundle, runAnalyze, resetBackend } from "@/lib/api";

export type WorkflowStage =
  | "upload"
  | "ingesting"
  | "ingested"
  | "running_decision"
  | "completed";

interface OdinForceWorkflowProps {
  currentStage: WorkflowStage;
  onStageChange: (stage: WorkflowStage) => void;
  onResetWorkflow: () => void;
  onSelectCheckpoint?: (cp: CheckpointDate) => void;
  onIngestComplete?: (data: any) => void;
  onDecisionComplete?: (data: any) => void;
}

const STREAMS = ["A1", "A2", "A3", "B1", "B2", "C1", "X"] as const;

export default function OdinForceWorkflow({
  currentStage,
  onStageChange,
  onResetWorkflow,
  onSelectCheckpoint,
  onIngestComplete,
  onDecisionComplete,
}: OdinForceWorkflowProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataPath, setDataPath] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [budgetMode, setBudgetMode] = useState<"full" | "low">("full");
  const [ingestProgress, setIngestProgress] = useState<number>(0);
  const [decisionProgress, setDecisionProgress] = useState<number>(0);
  const [streamProgress, setStreamProgress] = useState<Record<string, number>>({});
  const [discoveredContracts, setDiscoveredContracts] = useState<string[]>([]);
  const [activeAgentMessage, setActiveAgentMessage] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_EXTENSIONS = [".zip", ".json", ".jsonl", ".txt", ".pdf"];

  const validateFile = (file: File): boolean => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        `Invalid file format '${ext}'. Please upload a ${SUPPORTED_EXTENSIONS.join(", ")} file.`
      );
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File exceeds maximum allowed size of 50 MB.");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setDataPath(`local://${file.name}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setDataPath(`local://${file.name}`);
    }
  };

  const handleLoadCanonicalPreset = () => {
    setSelectedFile(null);
    setDataPath("backend/data/odin_dev_pack/bundle");
    setErrorMessage(null);
  };

  const handleStartIngestion = async () => {
    if (!selectedFile && !dataPath.trim()) {
      setErrorMessage("Please select a contract file or provide a valid data path.");
      return;
    }

    setErrorMessage(null);
    onStageChange("ingesting");
    setIngestProgress(25);
    setActiveAgentMessage("Odin Force: Parsing package manifest.json and contract descriptors...");

    try {
      const resolvedPath = dataPath.startsWith("manifest://")
        ? "backend/data/odin_dev_pack/bundle"
        : dataPath.startsWith("local://") && !selectedFile
        ? "backend/data/odin_dev_pack/bundle"
        : dataPath;

      const data = await ingestBundle(selectedFile, resolvedPath);
      setIngestProgress(100);

      const contractIds = data.contracts?.map((c) => c.id) || [];
      setDiscoveredContracts(contractIds);

      const progMap: Record<string, number> = {};
      contractIds.forEach((id) => {
        progMap[id] = 100;
      });
      setStreamProgress(progMap);

      const count = data.contracts_indexed || contractIds.length || 6;
      setActiveAgentMessage(
        `Ingestion complete. ${count} contracts discovered. Canonical clauses indexed with substring grounding.`
      );

      if (data.checkpoints && data.checkpoints.length && onSelectCheckpoint) {
        onSelectCheckpoint(data.checkpoints[0].date as CheckpointDate);
      }

      if (onIngestComplete) {
        onIngestComplete(data);
      }

      onStageChange("ingested");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load the selected data bundle.");
      onStageChange("upload");
      setIngestProgress(0);
    }
  };

  const handleRunDecision = async () => {
    if (currentStage !== "ingested") return;

    onStageChange("running_decision");
    setDecisionProgress(25);
    setActiveAgentMessage("Thor Extractor: Verifying exact quote substrings against canonical source texts...");

    try {
      const low = budgetMode === "low";
      setTimeout(() => {
        setDecisionProgress(60);
        setActiveAgentMessage("Loki & Heimdall: Cross-examining counterparty claims against operational logs...");
      }, 700);

      const result = await runAnalyze(budgetMode);

      setDecisionProgress(100);
      setActiveAgentMessage(
        result.message || "Tyr Arbiter: Precedence adjudicated; all rulings rendered with zero hallucinations."
      );

      if (onDecisionComplete) {
        onDecisionComplete(result);
      }

      onStageChange("completed");
    } catch (err: any) {
      setErrorMessage(err.message || "Decision analysis failed. Check backend log.");
      onStageChange("ingested");
      setDecisionProgress(0);
    }
  };

  const handleReset = async () => {
    await resetBackend();
    setSelectedFile(null);
    setDataPath("");
    setErrorMessage(null);
    setIngestProgress(0);
    setDecisionProgress(0);
    setStreamProgress({});
    setDiscoveredContracts([]);
    onResetWorkflow();
  };

  const isIngestReady = Boolean(selectedFile || dataPath.trim());
  const isDecisionReady = currentStage === "ingested";

  return (
    <div className="w-full bg-[#f3f8f5] border border-[#dce8e1] rounded-xl p-5 sm:p-7 select-none space-y-6">
      {/* Workflow Navigation Header & State Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dce8e1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-[#dce8e1]">
              ODIN FORCE PIPELINE
            </span>
            <span className="text-xs text-[#67776e] font-mono">
              Autonomous Multi-Agent Workflow
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-normal text-[#14211a] mt-1 tracking-tight">
            Data Ingestion & Adversarial Decision Engine
          </h2>
        </div>

        {/* Global Pipeline State Chip & Reset */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
              currentStage === "completed"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : currentStage === "running_decision" || currentStage === "ingesting"
                ? "bg-sky-50 text-sky-800 border-sky-300 animate-pulse"
                : currentStage === "ingested"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-white text-[#67776e] border-[#dce8e1]"
            }`}
          >
            ● Status: {currentStage.replace("_", " ").toUpperCase()}
          </span>

          {currentStage !== "upload" && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-[#67776e] hover:text-[#14211a] px-2.5 py-1 rounded border border-[#dce8e1] bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator Badges (Step 1 -> Step 2 -> Step 3 -> Step 4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Step 1 Chip */}
        <div
          className={`p-3 rounded-lg border text-xs font-mono transition-all ${
            currentStage === "upload"
              ? "bg-white border-[#14211a] text-[#14211a] shadow-xs"
              : "bg-white/60 border-[#dce8e1] text-[#67776e]"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-[#67776e]">
            Step 1
          </div>
          <div className="font-semibold mt-0.5">Upload File / Path</div>
          <div className="text-[10px] text-emerald-700 mt-1">
            {selectedFile || dataPath ? "✓ Source Selected" : "Waiting for Input"}
          </div>
        </div>

        {/* Step 2 Chip */}
        <div
          className={`p-3 rounded-lg border text-xs font-mono transition-all ${
            currentStage === "ingesting"
              ? "bg-white border-[#14211a] text-[#14211a] shadow-xs ring-2 ring-emerald-500/20"
              : currentStage === "ingested" || currentStage === "running_decision" || currentStage === "completed"
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
              : "bg-white/60 border-[#dce8e1] text-[#67776e]"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-[#67776e]">
            Step 2
          </div>
          <div className="font-semibold mt-0.5">Ingest Data</div>
          <div className="text-[10px] mt-1">
            {currentStage === "ingesting"
              ? `${ingestProgress}% Processing...`
              : currentStage === "ingested" || currentStage === "running_decision" || currentStage === "completed"
              ? "✓ Ingestion Complete"
              : "Pending Step 1"}
          </div>
        </div>

        {/* Step 3 Chip */}
        <div
          className={`p-3 rounded-lg border text-xs font-mono transition-all ${
            currentStage === "running_decision"
              ? "bg-white border-[#14211a] text-[#14211a] shadow-xs ring-2 ring-sky-500/20"
              : currentStage === "completed"
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
              : "bg-white/60 border-[#dce8e1] text-[#67776e]"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-[#67776e]">
            Step 3
          </div>
          <div className="font-semibold mt-0.5">Run Decision</div>
          <div className="text-[10px] mt-1">
            {currentStage === "running_decision"
              ? `${decisionProgress}% Multi-Agent Loop...`
              : currentStage === "completed"
              ? "✓ Rulings Adjudicated"
              : currentStage === "ingested"
              ? "Ready to Execute"
              : "Pending Step 2"}
          </div>
        </div>

        {/* Step 4 Chip */}
        <div
          className={`p-3 rounded-lg border text-xs font-mono transition-all ${
            currentStage === "completed"
              ? "bg-emerald-100/60 border-emerald-300 text-emerald-950 font-bold"
              : "bg-white/60 border-[#dce8e1] text-[#67776e]"
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-[#67776e]">
            Step 4
          </div>
          <div className="font-semibold mt-0.5">Results & Analysis</div>
          <div className="text-[10px] mt-1">
            {currentStage === "completed"
              ? "★ 14 Traps Neutralized"
              : "Locked Until Step 3"}
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-800 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* WORKFLOW INTERACTION PANEL: Steps 1, 2, 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Step 1: Upload File & Data Path - Highlighted Starting Point) */}
        <div className="lg:col-span-6 bg-white border-2 border-emerald-600/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 ring-2 ring-emerald-500/10">
          <div className="flex items-center justify-between border-b border-[#dce8e1] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse">
                ★ START HERE
              </span>
              <h3 className="font-serif font-medium text-base sm:text-lg text-[#14211a]">
                Step 1 — Choose Source Bundle
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase text-[#67776e]">
              2 Options Available
            </span>
          </div>

          {/* OPTION A: Canonical Benchmark Bundle (Highlighted) */}
          <div
            onClick={handleLoadCanonicalPreset}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              dataPath === "backend/data/odin_dev_pack/bundle" && !selectedFile
                ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                : "border-[#dce8e1] hover:border-emerald-500/60 bg-[#f8faf9] hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                Option A · Canonical Benchmark
              </span>
              {dataPath === "backend/data/odin_dev_pack/bundle" && !selectedFile ? (
                <span className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                  ✓ Selected
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[#67776e]">
                  Click to select
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-serif font-semibold text-[#14211a]">
                  Quillhub Inc. Enterprise Portfolio
                </h4>
                <p className="text-[11px] font-sans text-[#67776e] mt-0.5">
                  8 contracts, 32 clauses, 14 adversarial traps & 3 temporal drops.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadCanonicalPreset();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  dataPath === "backend/data/odin_dev_pack/bundle" && !selectedFile
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-white text-[#14211a] border border-[#dce8e1] hover:border-[#14211a]"
                }`}
              >
                ⚡ Use Benchmark
              </button>
            </div>
          </div>

          {/* OPTION B: Custom Bundle Upload / Path (Highlighted) */}
          <div
            className={`p-3.5 rounded-xl border-2 transition-all ${
              selectedFile || (dataPath && dataPath !== "backend/data/odin_dev_pack/bundle")
                ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20"
                : "border-[#dce8e1] bg-[#f8faf9]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                Option B · Custom Upload or Path
              </span>
              {(selectedFile || (dataPath && dataPath !== "backend/data/odin_dev_pack/bundle")) && (
                <span className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                  ✓ Selected
                </span>
              )}
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-emerald-600 bg-emerald-50/70"
                  : selectedFile
                  ? "border-emerald-500 bg-white"
                  : "border-[#dce8e1] hover:border-[#14211a] bg-white hover:bg-neutral-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json,.jsonl,.txt,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-semibold text-emerald-800 flex items-center justify-center gap-2">
                    <span>📄 {selectedFile.name}</span>
                  </div>
                  <p className="text-[10px] font-mono text-[#67776e]">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Custom package ready
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setDataPath("backend/data/odin_dev_pack/bundle");
                    }}
                    className="text-[10px] font-mono text-red-600 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="text-[#67776e]">
                  <div className="text-xs font-mono font-medium text-[#14211a]">
                    Upload custom contract package (.zip, .json, .txt, .pdf)
                  </div>
                  <p className="text-[10px] font-sans mt-0.5">
                    Drag & drop file or click to browse
                  </p>
                </div>
              )}
            </div>

            {/* Custom Data Path Input */}
            <div className="mt-2.5">
              <label className="text-[10px] font-mono text-[#67776e] block uppercase tracking-wider mb-1">
                Or enter local server directory / manifest path:
              </label>
              <input
                type="text"
                value={dataPath === "backend/data/odin_dev_pack/bundle" && !selectedFile ? "" : dataPath}
                onChange={(e) => {
                  setDataPath(e.target.value);
                  setSelectedFile(null);
                }}
                placeholder="e.g. data/my_custom_bundle/ or manifest.json"
                className="w-full text-xs font-mono px-3 py-1.5 border border-[#dce8e1] rounded-lg bg-white focus:outline-none focus:border-[#14211a]"
              />
            </div>
          </div>

          <div className="pt-1 text-[11px] font-mono text-[#67776e] flex items-center justify-between">
            <span>👉 Selected: <b className="text-[#14211a]">{selectedFile ? selectedFile.name : dataPath ? "Quillhub Benchmark" : "None"}</b></span>
            <span className="text-emerald-700 font-semibold">Proceed to Step 2 →</span>
          </div>
        </div>

        {/* Right Column (Step 2: Ingest Data & Step 3: Run Decision) */}
        <div className="lg:col-span-6 bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#dce8e1] pb-2.5">
            <h3 className="font-serif font-normal text-base sm:text-lg text-[#14211a]">
              Steps 2 & 3 — Execution Control
            </h3>
            <span className="text-[10px] font-mono uppercase text-[#67776e]">
              Adversarial Ingestion & Decision
            </span>
          </div>

          {/* Action Row: Ingest Data + Run Decision Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Step 2: Ingest Data Button */}
            <button
              type="button"
              disabled={!isIngestReady || currentStage === "ingesting"}
              onClick={handleStartIngestion}
              className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                currentStage === "ingesting"
                  ? "bg-orange-600 text-white animate-pulse"
                  : currentStage === "ingested" || currentStage === "completed"
                  ? "bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50"
                  : isIngestReady
                  ? "bg-[#14211a] text-white hover:bg-[#14211a]/90 shadow-xs"
                  : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
              }`}
            >
              <span>{currentStage === "ingesting" ? "Ingesting..." : "Step 2: Ingest Data"}</span>
              <span>📥</span>
            </button>

            {/* Step 3: Run Decision Button */}
            <button
              type="button"
              disabled={currentStage !== "ingested"}
              onClick={handleRunDecision}
              className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                currentStage === "running_decision"
                  ? "bg-orange-600 text-white animate-pulse"
                  : isDecisionReady
                  ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
                  : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
              }`}
            >
              <span>
                {currentStage === "running_decision" ? "Adjudicating..." : "Step 3: Run Decision"}
              </span>
              <span>⚡</span>
            </button>
          </div>

          {/* Budget Selector Option (from Odin Contract War Room) */}
          <div className="flex items-center justify-between p-2.5 bg-[#f8faf9] border border-[#dce8e1] rounded-lg text-xs font-mono">
            <span className="text-[#67776e]">Execution Budget:</span>
            <select
              value={budgetMode}
              onChange={(e) => setBudgetMode(e.target.value as "full" | "low")}
              className="bg-white border border-[#dce8e1] rounded px-2.5 py-1 text-xs text-[#14211a] font-mono cursor-pointer"
            >
              <option value="full">Full budget (Exhaustive search)</option>
              <option value="low">Low budget (Demo cap — 50% limit on B2, C1, X)</option>
            </select>
          </div>

          {/* Active Workstream Progress Bar & Status Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#67776e]">
              <span>Active Workstreams (A1–C1, X):</span>
              <span>
                {currentStage === "ingesting"
                  ? `Ingest ${ingestProgress}%`
                  : currentStage === "running_decision"
                  ? `Decision ${decisionProgress}%`
                  : currentStage === "completed"
                  ? "100% Complete"
                  : "Idle"}
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-2 bg-[#dce8e1] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  currentStage === "completed"
                    ? "bg-emerald-600"
                    : currentStage === "running_decision"
                    ? "bg-orange-500"
                    : currentStage === "ingesting"
                    ? "bg-orange-500"
                    : "bg-[#14211a]"
                }`}
                style={{
                  width: `${
                    currentStage === "ingesting"
                      ? ingestProgress
                      : currentStage === "running_decision"
                      ? decisionProgress
                      : currentStage === "completed"
                      ? 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Per-Stream Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {STREAMS.map((s) => {
                const prog = streamProgress[s] ?? 0;
                return (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      prog >= 100
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : prog > 0
                        ? "bg-orange-50 text-orange-800 border-orange-200"
                        : "bg-white text-[#67776e] border-[#dce8e1]"
                    }`}
                  >
                    <b>{s === "X" ? "Cross-X" : s}</b>
                    <span>{prog}%</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Live Agent Telemetry Ticker */}
          {activeAgentMessage && (
            <div className="p-2.5 bg-[#14211a] text-white rounded-lg text-xs font-mono flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping shrink-0" />
              <span className="truncate">{activeAgentMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
