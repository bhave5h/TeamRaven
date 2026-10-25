"use client";

import React from "react";
import { CheckpointDate } from "@/lib/types";
import Image from "next/image";

interface NavbarProps {
  currentCheckpoint?: CheckpointDate;
  onSelectCheckpoint?: (cp: CheckpointDate) => void;
  onTriggerAnalysis?: () => void;
}

export default function Navbar({
  currentCheckpoint = "2027-03-15",
  onTriggerAnalysis,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dce8e1] select-none w-full px-[clamp(20px,3.2vw,30px)] py-3.5 flex items-center justify-between">
      {/* Left: Starburst Mark + Brand Name */}
      <a href="/" className="flex items-center gap-2 select-none group">
      
          {/* 8-Pointed Starburst / Asterisk Glyph */}
        <Image src="/logo.png" alt="" width={24} height={24} />
        <span className="font-sans font-bold text-lg tracking-tight text-[#14211a] lowercase">
          odin's Vault
        </span>
      </a>

      {/* Center: Clean Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-[13px] font-medium text-[#67776e]">
        <a href="#war-room" className="hover:text-[#14211a] transition-colors">
          Features
        </a>
        <a href="#war-room" className="hover:text-[#14211a] transition-colors">
          War Room
        </a>
        <a href="#agents" className="hover:text-[#14211a] transition-colors">
          Agents
        </a>
        <a href="#traps" className="hover:text-[#14211a] transition-colors">
          Traps
        </a>
        <a href="#guardrails" className="hover:text-[#14211a] transition-colors">
          Audits
        </a>
      </nav>

      {/* Right: Clock & Pill CTA Action */}
      <div className="flex items-center gap-2.5">
        {/* Active Checkpoint Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-[#f3f8f5] border border-[#dce8e1] rounded-full text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-[#67776e]">Clock:</span>
          <span className="font-semibold text-[#14211a]">{currentCheckpoint}</span>
        </div>

        {/* Install now Pill Button */}
        <a
          href="#war-room"
          onClick={onTriggerAnalysis}
          className="px-4 py-1.5 rounded-full bg-white hover:bg-[#14211a] text-[#14211a] hover:text-white border border-[#dce8e1] text-xs font-medium transition-all shadow-2xs cursor-pointer"
        >
          Install now
        </a>
      </div>
    </header>
  );
}
