"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import DebatePanel from "@/components/DebatePanel";
import CitationDrawer from "@/components/CitationDrawer";
import { Citation } from "@/lib/types";

export default function DebatePage() {
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  return (
    <main className="min-h-screen bg-white text-[#191919] flex flex-col selection:bg-[#191919] selection:text-white pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full space-y-6 pt-6">
        {/* Header */}
        <div className="bg-[#fafafa] border border-gray-200 rounded-2xl p-6 sm:p-8">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200">
            DEDICATED DEBATE ARENA [FR9.4]
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-normal text-[#191919] tracking-tight">
            Multi-Agent Adversarial Debate Loop
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#191919]/70 leading-relaxed max-w-3xl">
            Watch Loki (adversarial counterparty counsel), Heimdall (event monitor radar),
            Thor (clause extraction authority), and Tyr (neutral legal adjudicator) debate contractual exposure,
            cross-examine operational logs, and issue binding rulings.
          </p>
        </div>

        {/* Live Debate Feed */}
        <DebatePanel onOpenCitation={setActiveCitation} />
      </div>

      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </main>
  );
}
