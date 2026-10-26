"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import FolderComponent from "@/components/ui/folder";

const Motes = dynamic(
  () => import("@lucasmarkes/motes-react").then((mod) => mod.Motes),
  { ssr: false }
);

interface HeroSectionProps {
  onTriggerAnalysis?: () => void;
}

export default function HeroSection({ onTriggerAnalysis }: HeroSectionProps) {
  return (
    <section className="w-full bg-white flex flex-col select-none">
      {/* 1. Large Panoramic Classical Landscape Banner Image */}
      <div className="relative w-full border-b border-[#dce8e1] overflow-hidden bg-[#f3f8f5]">
        <div className="relative w-full h-[280px] sm:h-[380px] md:h-[440px] lg:h-[490px]">
          <Image
            src="/bg.png"
            alt="Classical Temple & Landscape tapestry dither"
            fill
            priority
            sizes="(max-width: 1120px) 100vw, 1120px"
            className="object-cover object-[center_35%] select-none pointer-events-none"
          />

          {/* Procedural pointer-reactive ASCII embers on top of hero image */}
          <Motes
            effect="embers"
            pointer
            radius={70}
            force={1.1}
            accent="#ddeafe"
            background="transparent"
            className="absolute inset-0 z-10 h-full w-full pointer-events-auto"
          />
        </div>
      </div>

      {/* 2. Compact Headline & Interactive Folder Row */}
      <div className="w-full px-[clamp(20px,3.2vw,30px)] py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4 sm:gap-8 max-w-4xl">
          {/* Left: 2-Line Serif Display Heading */}
          <div className="min-w-0">
            <h1 className="font-serif font-normal text-2xl sm:text-3xl md:text-[38px] lg:text-[42px] text-[#14211a] tracking-tight leading-[1.14]">
              AI agents that defend<br />
              <span className="whitespace-nowrap">all your enterprise contracts</span>
            </h1>
          </div>

          {/* Right: Interactive Contract Folder (Beside Headline) - Scaled small on mobile */}
          <div className="shrink-0 flex items-center justify-center overflow-visible z-20 scale-[0.62] sm:scale-90 md:scale-100 origin-right transition-transform">
            <FolderComponent color="orange" size="xs" />
          </div>
        </div>
      </div>


      {/* 3. Partner & Ecosystem Trust Strip with Vertical Hairline Dividers */}
      <div className="w-full border-y border-[#dce8e1] bg-white">
      </div>
    </section>
  );
}
