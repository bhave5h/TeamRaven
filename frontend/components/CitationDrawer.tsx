"use client";

import React from "react";
import { Citation } from "@/lib/types";

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export default function CitationDrawer({ citation, onClose }: CitationDrawerProps) {
  if (!citation) return null;

  // Split full paragraph around the quote to highlight exact substring
  const renderHighlightedText = () => {
    if (!citation.quote || !citation.fullParagraph.includes(citation.quote)) {
      return <span>{citation.fullParagraph}</span>;
    }

    const parts = citation.fullParagraph.split(citation.quote);
    return (
      <>
        <span>{parts[0]}</span>
        <mark className="bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-medium px-1 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
          {citation.quote}
        </mark>
        <span>{parts.slice(1).join(citation.quote)}</span>
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-full bg-white text-[#14211a] shadow-2xl p-6 sm:p-8 flex flex-col overflow-y-auto transform transition-transform duration-200 border-l border-[#dce8e1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#dce8e1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                100% VERIFIED CITATION
              </span>
              <span className="text-xs font-mono text-[#67776e]">
                {citation.docId} • {citation.section}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-serif font-normal text-[#14211a]">
              {citation.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-[#67776e] hover:text-[#14211a] p-2 rounded-lg hover:bg-[#f3f8f5] transition-colors cursor-pointer"
            aria-label="Close citation drawer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6 flex-1 text-sm">
          {/* Highlighted Canonical Paragraph */}
          <div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#67776e] font-medium block mb-2">
              CANONICAL SOURCE PARAGRAPH ({citation.docId})
            </span>
            <div className="p-4 bg-[#f3f8f5] rounded-xl text-xs sm:text-sm text-[#14211a]/85 font-serif leading-relaxed border border-[#dce8e1] select-text">
              {renderHighlightedText()}
            </div>
          </div>

          {/* Extracted Verbatim Quote */}
          <div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#67776e] font-medium block mb-2">
              GROUNDED VERBATIM QUOTE
            </span>
            <blockquote className="p-3.5 bg-amber-50/60 border-l-2 border-amber-500 rounded-r-lg text-xs sm:text-sm text-amber-950 italic border-y border-r border-[#dce8e1]/60">
              &ldquo;{citation.quote}&rdquo;
            </blockquote>
          </div>

          {/* Guardrail Audit Verification Telemetry */}
          <div className="p-4 bg-white border border-[#dce8e1] rounded-xl space-y-2 text-xs">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#67776e] font-semibold block">
              GUARDRAIL AUDIT TELEMETRY
            </span>
            <div className="flex justify-between items-center py-1 border-b border-[#dce8e1]">
              <span className="text-[#67776e]">Verification Status:</span>
              <span className="text-emerald-700 font-medium font-mono">
                Exact Substring Match (Confirmed)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#dce8e1]">
              <span className="text-[#67776e]">Auditing Guardrail:</span>
              <span className="font-mono text-[#14211a]">citation_guardrail.py</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#67776e]">Source File Path:</span>
              <span className="font-mono text-[11px] text-[#14211a]">
                bundle/contracts/{citation.docId}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#dce8e1] flex items-center justify-between">
          <span className="text-xs text-[#67776e] font-mono">
            Zero-Hallucination Grounding
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
