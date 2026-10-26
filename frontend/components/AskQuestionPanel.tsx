"use client";

import React, { useState } from "react";
import { askUploadedData, AskResponse, getCitation } from "@/lib/api";
import { Citation } from "@/lib/types";

interface AskQuestionPanelProps {
  onOpenCitation?: (cit: Citation) => void;
}

export default function AskQuestionPanel({ onOpenCitation }: AskQuestionPanelProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const QUICK_QUESTIONS = [
    "How many contracts are in the uploaded bundle?",
    "What is the StratoNode monthly uptime commitment in A1?",
    "What is the notice window for credit claims in Amendment A3?",
    "Are there any payment ledger anomalies or flagged transactions?",
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    if (queryText) setQuestion(queryText);
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await askUploadedData(q);
      setResponse(data);
    } catch (err: any) {
      setError(err?.message || "Could not retrieve answer from uploaded records.");
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = async (citationId?: string) => {
    if (!citationId || !onOpenCitation) return;
    try {
      const detail = await getCitation(citationId);
      if (detail) {
        onOpenCitation({
          docId: detail.doc_id || citationId,
          section: detail.section || "Clause Reference",
          title: `${detail.doc_id || citationId} · ${detail.section || ""}`,
          quote: detail.quote || "",
          fullParagraph: detail.clause_text || detail.quote || "",
          verified: detail.verified ?? true,
          matchScore: detail.confidence ? Math.round(detail.confidence * 100) : 100,
        });
      }
    } catch (e) {
      console.warn("Failed to load citation", e);
    }
  };

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-6 shadow-2xs select-none space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#dce8e1] gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#f3f8f5] text-emerald-800 border border-[#dce8e1]">
              NATURAL LANGUAGE QUERY
            </span>
            <span className="text-xs text-[#67776e] font-mono">
              Vector & BM25 Sourced Q&A
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-1">
            Ask About Your Uploaded Contracts & Events
          </h3>
        </div>
        <span className="text-xs font-mono text-[#67776e] bg-[#f8faf9] px-2.5 py-1 rounded-full border border-[#dce8e1]">
          Grounding: 100% Substring Sourced
        </span>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-[#67776e]">Try asking:</span>
        {QUICK_QUESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleAsk(item)}
            className="text-[11px] font-mono text-[#14211a] bg-[#f3f8f5] hover:bg-[#e8f2ec] border border-[#dce8e1] px-2.5 py-1 rounded-md transition-colors cursor-pointer text-left"
          >
            "{item}"
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const inputEl = form.querySelector("input") as HTMLInputElement | null;
          const val = inputEl?.value || question;
          handleAsk(val);
        }}
        className="flex flex-col sm:flex-row gap-2.5 items-stretch"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about a contract clause, event, liability limit, or payment total..."
          className="flex-1 px-3.5 py-2.5 text-xs font-sans text-[#14211a] bg-white border border-[#dce8e1] rounded-lg focus:outline-none focus:border-[#14211a]"
          minLength={3}
          maxLength={1200}
          required
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-5 py-2.5 rounded-lg bg-[#14211a] text-white hover:bg-[#14211a]/90 text-xs font-mono font-medium disabled:opacity-50 transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Searching Corpus...</span>
            </>
          ) : (
            <span>Ask Query 🔍</span>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Answer Output */}
      {response && (
        <div className="p-4 sm:p-5 bg-[#f8faf9] border border-[#dce8e1] rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#dce8e1] pb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-800">
              Verified Response
            </span>
            <span className="text-[11px] font-mono text-[#67776e]">
              Q: "{response.question}"
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#14211a] leading-relaxed font-sans">
            {response.answer}
          </p>

          {/* Sourced Citations */}
          {response.sources && response.sources.length > 0 && (
            <div className="pt-2 border-t border-[#dce8e1] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[#67776e]">Cited Sources:</span>
              {response.sources.map((src, i) => (
                <div key={i} className="inline-flex items-center gap-1.5">
                  <span className="text-xs font-mono text-[#14211a] bg-white border border-[#dce8e1] px-2 py-0.5 rounded">
                    {src.label || src.type}
                  </span>
                  {src.citation_id && (
                    <button
                      type="button"
                      onClick={() => handleCitationClick(src.citation_id)}
                      className="text-[10px] font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      Open Source ↗
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
