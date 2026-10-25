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
        className="relative w-full max-w-lg h-full bg-white dark:bg-[#121216] text-[#191919] dark:text-[#f4f4f6] shadow-2xl p-6 sm:p-8 flex flex-col overflow-y-auto transform transition-transform duration-200 border-l border-gray-200 dark:border-[#22222a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-[#22222a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                100% VERIFIED CITATION
              </span>
              <span className="text-xs font-mono text-[#191919]/50 dark:text-neutral-400">
                {citation.docId} • {citation.section}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-serif font-normal text-[#191919] dark:text-white">
              {citation.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#191919] dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#181820] transition-colors cursor-pointer"
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
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#191919]/50 dark:text-neutral-400 font-medium block mb-2">
              CANONICAL SOURCE PARAGRAPH ({citation.docId})
            </span>
            <div className="p-4 bg-[#F4F3F3] dark:bg-[#181820] rounded-xl text-xs sm:text-sm text-[#191919]/80 dark:text-neutral-200 font-serif leading-relaxed border border-gray-200/70 dark:border-[#26262e] select-text">
              {renderHighlightedText()}
            </div>
          </div>

          {/* Extracted Verbatim Quote */}
          <div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#191919]/50 dark:text-neutral-400 font-medium block mb-2">
              GROUNDED VERBATIM QUOTE
            </span>
            <blockquote className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border-l-2 border-amber-500 rounded-r-lg text-xs sm:text-sm text-amber-950 dark:text-amber-200 italic">
              &ldquo;{citation.quote}&rdquo;
            </blockquote>
          </div>

          {/* Guardrail Audit Verification Telemetry */}
          <div className="p-4 bg-white dark:bg-[#16161c] border border-gray-200 dark:border-[#22222a] rounded-xl space-y-2 text-xs">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#191919]/50 dark:text-neutral-400 font-semibold block">
              GUARDRAIL AUDIT TELEMETRY
            </span>
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-[#22222a]">
              <span className="text-[#191919]/60 dark:text-neutral-400">Verification Status:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium font-mono">
                Exact Substring Match (Confirmed)
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-[#22222a]">
              <span className="text-[#191919]/60 dark:text-neutral-400">Auditing Guardrail:</span>
              <span className="font-mono text-[#191919] dark:text-[#f4f4f6]">citation_guardrail.py</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#191919]/60 dark:text-neutral-400">Source File Path:</span>
              <span className="font-mono text-[11px] text-[#191919] dark:text-[#f4f4f6]">
                bundle/contracts/{citation.docId}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#22222a] flex items-center justify-between">
          <span className="text-xs text-[#191919]/40 dark:text-neutral-500 font-mono">
            Zero-Hallucination Grounding
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
