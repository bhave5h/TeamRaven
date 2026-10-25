"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import BoomerangVideoBg from "@/components/BoomerangVideoBg";
import Navbar from "@/components/Navbar";
import DemoModal from "@/components/DemoModal";
import PillarDrawer from "@/components/PillarDrawer";
import WarRoomPlanModal from "@/components/WarRoomPlanModal";

export default function Home() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const [warRoomPlanOpen, setWarRoomPlanOpen] = useState(false);

  const pillars = [
    { id: "01", label: "Conversational" },
    { id: "02", label: "Connected" },
    { id: "03", label: "Compliant" },
  ];

  return (
    <main className="min-h-screen bg-white overflow-x-hidden selection:bg-[#191919] selection:text-white">
      {/* Fixed Navbar: transparent over the video */}
      <Navbar
        onBookDemo={() => setDemoModalOpen(true)}
        onOpenWarRoomPlan={() => setWarRoomPlanOpen(true)}
      />

      {/* Hero Section: Single Full-Viewport First Viewport */}
      <section className="relative flex flex-col items-center overflow-hidden h-screen min-h-[640px] justify-between">
        {/* Background Video: Boomerang Playback */}
        <BoomerangVideoBg />

        {/* Hero Content Block: Z-10 */}
        <div className="relative z-10 flex flex-col items-center pt-24 sm:pt-26 md:pt-32 px-4 sm:px-6 text-center">
          {/* H1 Serif Mackinac */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tighter text-[#191919] font-normal">
            Build lasting
            <br />
            relationships.
          </h1>

          {/* Subcopy */}
          <p className="max-w-sm sm:max-w-md mt-5 sm:mt-6 md:mt-8 text-sm md:text-base text-[#191919]/70 leading-relaxed">
            Conversational AI platform for modern financial institutions —
            agents that handle the full borrower lifecycle across email, SMS,
            and voice.
          </p>

          {/* Second Book A Demo Button */}
          <button
            onClick={() => setDemoModalOpen(true)}
            className="mt-6 sm:mt-8 md:mt-10 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xs inline-flex items-center justify-center gap-2 group"
          >
            <span>Book A Demo</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
          </button>
        </div>

        {/* Bottom Info Panel: Anchored to bottom of viewport */}
        <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 mt-auto">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 border-b-0 pt-8 sm:pt-12 md:pt-16 px-5 sm:px-8 md:px-12 pb-0 shadow-sm">
            {/* Row 1 — 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-16">
              {/* Left Column */}
              <div className="flex flex-col justify-start">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#191919]/50 font-medium">
                  WHAT DO WE DO?
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-serif font-normal leading-tight tracking-tight text-[#191919]">
                  Conversations that
                  <br className="hidden sm:inline" />{" "}
                  build momentum
                </h2>
              </div>

              {/* Right Column: Bottom-aligned text */}
              <div className="flex items-end">
                <p className="text-sm md:text-[15px] text-[#191919]/70 leading-relaxed">
                  Conversational AI built for regulated financial institutions.
                  Agents that hold a real conversation, plug into the systems
                  you run, and show their work.
                </p>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="mt-6 sm:mt-8 md:mt-10 h-px bg-gray-200 w-full" />

            {/* Row 2 — 3 Interactive Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 py-3 sm:py-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar.id}
                  onClick={() => setActivePillarId(pillar.id)}
                  className="group bg-[#F4F3F3] hover:bg-[#eaeaea] active:scale-[0.99] transition-all duration-200 cursor-pointer px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActivePillarId(pillar.id);
                    }
                  }}
                >
                  <div className="flex items-center text-sm">
                    <span className="text-[#191919]/40 font-mono text-xs">
                      {pillar.id}
                    </span>
                    <span className="mx-2 text-[#191919]/30">/</span>
                    <span className="font-medium text-[#191919]">
                      {pillar.label}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Modals and Drawers */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

      <PillarDrawer
        pillarId={activePillarId}
        onClose={() => setActivePillarId(null)}
        onBookDemo={() => {
          setActivePillarId(null);
          setDemoModalOpen(true);
        }}
      />

      <WarRoomPlanModal
        isOpen={warRoomPlanOpen}
        onClose={() => setWarRoomPlanOpen(false)}
      />
    </main>
  );
}
