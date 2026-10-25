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
        <Image src="/logo.png" alt="Odin Force Logo" width={24} height={24} />
        <span className="font-sans font-bold text-lg tracking-tight text-[#14211a] lowercase">
          odin force
        </span>
      </a>
    </header>
  );
}
