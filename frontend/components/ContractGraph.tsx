"use client";

import React, { useState } from "react";
import { CheckpointDate, ContractNode, Citation } from "@/lib/types";
import { CONTRACT_NODES, CONTRACT_EDGES } from "@/lib/odinData";
import { formatNumber } from "@/lib/format";

interface ContractGraphProps {
  checkpoint: CheckpointDate;
  onSelectCitation: (cit: Citation) => void;
}

export default function ContractGraph({
  checkpoint,
  onSelectCitation,
}: ContractGraphProps) {
  const nodes = CONTRACT_NODES[checkpoint] || CONTRACT_NODES["2027-03-15"];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("A3");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const getNodeColor = (type: ContractNode["type"], status: ContractNode["status"]) => {
    if (status === "superseded") {
      return "bg-gray-100 dark:bg-neutral-900/50 border-dashed border-gray-400 dark:border-neutral-700 text-gray-500 dark:text-neutral-500 opacity-60";
    }
    if (status === "disputed") {
      return "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 ring-2 ring-rose-100 dark:ring-rose-950/50";
    }
    if (status === "at_risk") {
      return "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200";
    }
    if (type === "amendment") {
      return "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 text-purple-950 dark:text-purple-200";
    }
    return "bg-white dark:bg-[#16161c] border-gray-200 dark:border-[#26262e] text-[#191919] dark:text-[#f4f4f6]";
  };

  return (
    <div className="w-full bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs select-none transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-[#22222a] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
              PORTFOLIO CONTRACT GRAPH [FR9.1]
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded font-mono font-medium">
              8 Canonical Documents • 14 Traps Active
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-0.5">
            Contract Hierarchy, Precedence & Conflicts
          </h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#191919]/70 dark:text-neutral-300 font-mono">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-[#181820] border border-gray-200 dark:border-[#26262e] rounded">
            <span className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" /> Active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 rounded">
            <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" /> Supersession
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-300 rounded">
            <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400" /> Disputed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Visual Graph Viewport (SVG/Canvas) */}
        <div className="lg:col-span-2 relative min-h-[380px] bg-[#fafafa] dark:bg-[#09090b] border border-gray-200/80 dark:border-[#22222a] rounded-xl p-4 overflow-hidden flex flex-col justify-between">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
              </marker>
              <marker id="arrow-conflict" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
              </marker>
            </defs>

            {/* A3 -> A2 (Supersedes) */}
            <path
              d="M 160 300 C 140 260, 140 240, 140 215"
              fill="none"
              stroke="#9333ea"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrow)"
            />

            {/* A1 -> B1 (Conflict Asymmetry) */}
            <path
              d="M 180 100 C 350 40, 450 40, 520 85"
              fill="none"
              stroke="#e11d48"
              strokeWidth="2"
              markerEnd="url(#arrow-conflict)"
            />

            {/* STD -> A1, B1, D1 */}
            <path d="M 330 180 C 260 140, 220 120, 200 105" fill="none" stroke="#666" strokeWidth="1.5" />
            <path d="M 370 180 C 440 140, 480 120, 520 105" fill="none" stroke="#666" strokeWidth="1.5" />
            <path d="M 350 210 L 350 330" fill="none" stroke="#666" strokeWidth="1.5" />
          </svg>

          {/* Interactive Nodes Layout */}
          <div className="relative z-10 grid grid-cols-3 gap-4 h-full">
            {/* Col 1: Upstream Cloud Vendor (StratoNode A1, A2, A3) */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block">
                UPSTREAM INFRASTRUCTURE
              </span>
              {nodes
                .filter((n) => n.id.startsWith("A"))
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${getNodeColor(
                      node.type,
                      node.status
                    )} ${
                      selectedNodeId === node.id
                        ? "ring-2 ring-[#191919] dark:ring-white shadow-sm scale-[1.02]"
                        : "hover:border-gray-400 dark:hover:border-neutral-500"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold">{node.id}</span>
                      <span className="text-[10px] uppercase font-semibold text-[#191919]/60 dark:text-neutral-300">
                        {node.status}
                      </span>
                    </div>
                    <p className="font-medium truncate">{node.party}</p>
                    {node.slaTier && (
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                        {node.slaTier}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            {/* Col 2: Central Standard Terms & Contractor (STD, D1) */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block mb-3">
                  TARGET COMPANY CORE
                </span>
                {nodes
                  .filter((n) => n.id === "STD")
                  .map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${getNodeColor(
                        node.type,
                        node.status
                      )} ${
                        selectedNodeId === node.id
                          ? "ring-2 ring-[#191919] dark:ring-white shadow-sm scale-[1.02]"
                          : "hover:border-gray-400 dark:hover:border-neutral-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-sm">{node.id}</span>
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          Master Root
                        </span>
                      </div>
                      <p className="font-medium text-sm">{node.party}</p>
                      <span className="mt-2 text-[11px] text-[#191919]/60 dark:text-neutral-400 block">
                        Order of Precedence Anchor
                      </span>
                    </div>
                  ))}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block mb-2">
                  CONTRACTOR / ENGINEERING
                </span>
                {nodes
                  .filter((n) => n.id === "D1")
                  .map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${getNodeColor(
                        node.type,
                        node.status
                      )} ${
                        selectedNodeId === node.id
                          ? "ring-2 ring-[#191919] dark:ring-white shadow-sm scale-[1.02]"
                          : "hover:border-gray-400 dark:hover:border-neutral-500"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold">{node.id}</span>
                        <span className="text-[10px] uppercase font-semibold text-[#191919]/60 dark:text-neutral-300">
                          {node.status}
                        </span>
                      </div>
                      <p className="font-medium truncate">{node.party}</p>
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                        Milestone 4 100% Test
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Col 3: Downstream Customers (Apex B1, Harbor B2, Vantage C1) */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block">
                DOWNSTREAM CUSTOMERS
              </span>
              {nodes
                .filter((n) => n.id.startsWith("B") || n.id.startsWith("C"))
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${getNodeColor(
                      node.type,
                      node.status
                    )} ${
                      selectedNodeId === node.id
                        ? "ring-2 ring-[#191919] dark:ring-white shadow-sm scale-[1.02]"
                        : "hover:border-gray-400 dark:hover:border-neutral-500"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold">{node.id}</span>
                      <span className="text-[10px] uppercase font-semibold text-[#191919]/60 dark:text-neutral-300">
                        {node.status}
                      </span>
                    </div>
                    <p className="font-medium truncate">{node.party}</p>
                    {node.slaTier && (
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded">
                        {node.slaTier}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Contract Inspection Inspector */}
        <div className="bg-[#F4F3F3] dark:bg-[#16161c] border border-gray-200/80 dark:border-[#26262e] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block">
                  SELECTED CONTRACT INSPECTION
                </span>
                <h4 className="text-xl font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-1">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-[#191919]/70 dark:text-neutral-300 mt-0.5 font-medium">
                  Counterparty: {selectedNode.party}
                </p>
              </div>

              <span
                className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                  selectedNode.status === "superseded"
                    ? "bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300"
                    : selectedNode.status === "disputed"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
                }`}
              >
                {selectedNode.status}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-200/60 dark:border-[#22222a]">
                <span className="text-[#191919]/60 dark:text-neutral-400">Effective Date:</span>
                <span className="font-mono font-medium text-[#191919] dark:text-[#f4f4f6]">{selectedNode.effectiveDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200/60 dark:border-[#22222a]">
                <span className="text-[#191919]/60 dark:text-neutral-400">Financial Risk Exposure:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-rose-700 dark:text-rose-400">
                  ${formatNumber(selectedNode.exposureAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-200/60 dark:border-[#22222a]">
                <span className="text-[#191919]/60 dark:text-neutral-400">Risk Score:</span>
                <span className="font-mono font-semibold text-[#191919] dark:text-[#f4f4f6]">{selectedNode.riskScore} / 100</span>
              </div>
              {selectedNode.slaTier && (
                <div className="flex justify-between py-1.5 border-b border-gray-200/60 dark:border-[#22222a]">
                  <span className="text-[#191919]/60 dark:text-neutral-400">Key Obligation:</span>
                  <span className="font-mono text-[11px] text-[#191919] dark:text-[#f4f4f6]">{selectedNode.slaTier}</span>
                </div>
              )}
            </div>

            {/* Extracted Clause Preview */}
            <div className="mt-4 p-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-lg">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#191919]/50 dark:text-neutral-400 mb-1">
                <span>{selectedNode.citation.docId} {selectedNode.citation.section}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Grounded</span>
              </div>
              <p className="text-xs text-[#191919]/80 dark:text-neutral-300 font-serif italic line-clamp-3">
                &ldquo;{selectedNode.citation.quote}&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onSelectCitation(selectedNode.citation)}
              className="w-full py-2.5 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Inspect Canonical Text in Drawer</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Contract Conflict Alert Banner */}
      <div className="mt-4 p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-lg flex items-center justify-between text-xs text-rose-950 dark:text-rose-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <span className="font-semibold">Precedence / Conflict Alert:</span>
          <span>
            {CONTRACT_EDGES[1].label} — {CONTRACT_EDGES[1].details}
          </span>
        </div>
        <button
          onClick={() => onSelectCitation(nodes.find((n) => n.id === "B1")!.citation)}
          className="text-xs font-semibold underline hover:text-rose-800 dark:hover:text-rose-300 cursor-pointer"
        >
          View Trap #2 Clause
        </button>
      </div>
    </div>
  );
}
