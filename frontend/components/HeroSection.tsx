"use client";

import React from "react";
import Image from "next/image";
import FolderComponent from "@/components/ui/folder";

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
            src="/bg1.png"
            alt="Classical Temple & Landscape tapestry dither"
            fill
            priority
            sizes="(max-width: 1120px) 100vw, 1120px"
            className="object-cover object-[center_35%] select-none pointer-events-none"
          />
        </div>
      </div>

      {/* 2. Headline & Interactive Folder Showcase */}
      <div className="m-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center justify-between">
          {/* Left Column: Big Serif Display Heading */}
          <div className="lg:col-span-7">
            
            <h1 className="font-serif font-normal text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] text-[#14211a] tracking-tight leading-[1.12]">
              AI agents that defend<br className="hidden sm:inline" /> all your enterprise contracts
            </h1>
          </div>

          {/* Right Column: Interactive Contract Folder */}
          <div className="lg:col-span-1 flex items-center justify-center lg:justify-start overflow-visible">
            <div className="scale-30 sm:scale-30 lg:scale-40 transition-transform origin-center lg:origin-left">
              <FolderComponent color="black" size="md" />
            </div>
          </div>
        </div>
      </div>


      {/* 3. Partner & Ecosystem Trust Strip with Vertical Hairline Dividers */}
      <div className="w-full border-y border-[#dce8e1] bg-white">
      </div>
    </section>
  );
}
