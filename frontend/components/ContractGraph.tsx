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
      return "bg-[#f3f8f5] border-dashed border-[#67776e]/50 text-[#67776e] opacity-75";
    }
    if (status === "disputed") {
      return "bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-200";
    }
    if (status === "at_risk") {
      return "bg-amber-50 border-amber-300 text-amber-950";
    }
    if (type === "amendment") {
      return "bg-purple-50 border-purple-300 text-purple-950";
    }
    return "bg-white border-[#dce8e1] text-[#14211a]";
  };

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#dce8e1] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              PORTFOLIO CONTRACT GRAPH [FR9.1]
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono font-medium">
              8 Canonical Documents • 14 Traps Active
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            Contract Hierarchy, Precedence & Conflicts
          </h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#67776e] font-mono">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#dce8e1] rounded">
            <span className="w-2 h-2 rounded-full bg-[#14211a]" /> Active
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-900 rounded">
            <span className="w-2 h-2 rounded-full bg-purple-600" /> Supersession
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-900 rounded">
            <span className="w-2 h-2 rounded-full bg-rose-600" /> Disputed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Visual Graph Viewport (SVG/Canvas) */}
        <div className="lg:col-span-2 relative min-h-[380px] bg-[#f3f8f5]/50 border border-[#dce8e1] rounded-xl p-4 overflow-hidden flex flex-col justify-between">
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block">
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
                        ? "ring-2 ring-[#14211a] shadow-sm scale-[1.02]"
                        : "hover:border-[#14211a]/40"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold">{node.id}</span>
                      <span className="text-[10px] uppercase font-semibold text-[#67776e]">
                        {node.status}
                      </span>
                    </div>
                    <p className="font-medium truncate">{node.party}</p>
                    {node.slaTier && (
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 rounded">
                        {node.slaTier}
                      </span>
                    )}
                  </div>
                ))}
            </div>

            {/* Col 2: Central Standard Terms & Contractor (STD, D1) */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block mb-3">
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
                          ? "ring-2 ring-[#14211a] shadow-sm scale-[1.02]"
                          : "hover:border-[#14211a]/40"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-sm">{node.id}</span>
                        <span className="text-[10px] uppercase font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Master Root
                        </span>
                      </div>
                      <p className="font-medium text-sm">{node.party}</p>
                      <span className="mt-2 text-[11px] text-[#67776e] block">
                        Order of Precedence Anchor
                      </span>
                    </div>
                  ))}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block mb-2">
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
                          ? "ring-2 ring-[#14211a] shadow-sm scale-[1.02]"
                          : "hover:border-[#14211a]/40"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold">{node.id}</span>
                        <span className="text-[10px] uppercase font-semibold text-[#67776e]">
                          {node.status}
                        </span>
                      </div>
                      <p className="font-medium truncate">{node.party}</p>
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 rounded">
                        Milestone 4 100% Test
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Col 3: Downstream Customers (Apex B1, Harbor B2, Vantage C1) */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block">
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
                        ? "ring-2 ring-[#14211a] shadow-sm scale-[1.02]"
                        : "hover:border-[#14211a]/40"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold">{node.id}</span>
                      <span className="text-[10px] uppercase font-semibold text-[#67776e]">
                        {node.status}
                      </span>
                    </div>
                    <p className="font-medium truncate">{node.party}</p>
                    {node.slaTier && (
                      <span className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 bg-black/5 rounded">
                        {node.slaTier}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Contract Inspection Inspector */}
        <div className="bg-[#f3f8f5] border border-[#dce8e1] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block">
                  SELECTED CONTRACT INSPECTION
                </span>
                <h4 className="text-xl font-serif font-normal text-[#14211a] mt-1">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-[#67776e] mt-0.5 font-medium">
                  Counterparty: {selectedNode.party}
                </p>
              </div>

              <span
                className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                  selectedNode.status === "superseded"
                    ? "bg-[#dce8e1] text-[#14211a]"
                    : selectedNode.status === "disputed"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {selectedNode.status}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#dce8e1]">
                <span className="text-[#67776e]">Effective Date:</span>
                <span className="font-mono font-medium text-[#14211a]">{selectedNode.effectiveDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#dce8e1]">
                <span className="text-[#67776e]">Financial Risk Exposure:</span>
                <span suppressHydrationWarning className="font-mono font-semibold text-rose-700">
                  ${formatNumber(selectedNode.exposureAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#dce8e1]">
                <span className="text-[#67776e]">Risk Score:</span>
                <span className="font-mono font-semibold text-[#14211a]">{selectedNode.riskScore} / 100</span>
              </div>
              {selectedNode.slaTier && (
                <div className="flex justify-between py-1.5 border-b border-[#dce8e1]">
                  <span className="text-[#67776e]">Key Obligation:</span>
                  <span className="font-mono text-[11px] text-[#14211a]">{selectedNode.slaTier}</span>
                </div>
              )}
            </div>

            {/* Extracted Clause Preview */}
            <div className="mt-4 p-3 bg-white border border-[#dce8e1] rounded-lg">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#67776e] mb-1">
                <span>{selectedNode.citation.docId} {selectedNode.citation.section}</span>
                <span className="text-emerald-700 font-semibold">100% Grounded</span>
              </div>
              <p className="text-xs text-[#14211a]/85 font-serif italic line-clamp-3">
                &ldquo;{selectedNode.citation.quote}&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onSelectCitation(selectedNode.citation)}
              className="w-full py-2.5 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Inspect Canonical Text in Drawer</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Contract Conflict Alert Banner */}
      <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-950">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          <span className="font-semibold">Precedence / Conflict Alert:</span>
          <span>
            {CONTRACT_EDGES[1].label} — {CONTRACT_EDGES[1].details}
          </span>
        </div>
        <button
          onClick={() => onSelectCitation(nodes.find((n) => n.id === "B1")!.citation)}
          className="text-xs font-semibold underline hover:text-rose-800 cursor-pointer"
        >
          View Trap #2 Clause
        </button>
      </div>
    </div>
  );
}
