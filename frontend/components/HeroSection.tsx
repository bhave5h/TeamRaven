"use client";

import React from "react";
import Image from "next/image";

interface HeroSectionProps {
  onTriggerAnalysis?: () => void;
}

export default function HeroSection({ onTriggerAnalysis }: HeroSectionProps) {
  return (
    <section className="w-full bg-white flex flex-col select-none">
      {/* 1. Large Panoramic Classical Landscape Banner Image */}
      <div className="relative w-full border-b border-[#dce8e1] overflow-hidden bg-[#f3f8f5]">
        <div className="relative w-full h-[280px] sm:h-[380px] md:h-[440px] lg:h-[480px]">
          <Image
            src="/bg.png"
            alt="Classical Temple & Landscape tapestry dither"
            fill
            priority
            sizes="(max-width: 1120px) 100vw, 1120px"
            className="object-cover object-[center_35%] select-none pointer-events-none"
          />
        </div>
      </div>

      {/* 2. Headline, Value Proposition & Dual Pill CTA Row */}
      <div className="w-full px-[clamp(20px,3.2vw,30px)] py-10 sm:py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start justify-between">
          {/* Left Column: Big Serif Display Heading */}
          <div className="lg:col-span-7">
            <h1 className="font-serif font-normal text-3xl sm:text-4xl md:text-[42px] lg:text-[46px] text-[#14211a] tracking-tight leading-[1.12]">
              AI agents that defend<br className="hidden sm:inline" /> all your enterprise contracts
            </h1>
          </div>

          {/* Right Column: Narrative Subtitle & Dual CTA Pill Buttons */}
          <div className="lg:col-span-5 flex flex-col justify-between pt-1 sm:pt-2 lg:pl-4">
            <p className="text-xs sm:text-[13px] md:text-sm text-[#67776e] leading-relaxed font-sans max-w-md">
              The world&apos;s first autonomous contract war room — four adversarial AI agents expose hidden liabilities, cross-contract traps, and silent revenue leakage in real time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-5 sm:pt-6">
              {/* Primary Pill Button (with Cogwheel / Gear Icon) */}
              <a
                href="#war-room"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14211a] text-white text-xs sm:text-[13px] font-medium hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <svg
                  className="w-3.5 h-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Install now</span>
              </a>

              {/* Secondary Pill Button */}
              <button
                type="button"
                onClick={onTriggerAnalysis}
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#f3f8f5] text-[#14211a] hover:bg-[#e8f2ec] text-xs sm:text-[13px] font-medium border border-[#dce8e1] transition-all cursor-pointer"
              >
                Try for free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Partner & Ecosystem Trust Strip with Vertical Hairline Dividers */}
      <div className="w-full border-y border-[#dce8e1] bg-white">
        <div className="grid grid-cols-4 md:grid-cols-8 divide-x divide-[#dce8e1]">
          {/* 1. eBay */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <span className="font-bold text-base sm:text-lg tracking-tight lowercase font-sans">
              ebay
            </span>
          </div>

          {/* 2. Cal.com */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <span className="font-semibold text-xs sm:text-sm tracking-tight font-sans">
              Cal.com
            </span>
          </div>

          {/* 3. Wanderlust / W Mark */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <svg
              className="h-4 sm:h-5 w-auto fill-current"
              viewBox="0 0 32 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 5c2 0 3.5 1.5 4.5 4 1 2.5 2.2 6 4.5 6s3.5-3.5 4.5-6c1-2.5 2.5-4 4.5-4s3.5 1.5 4.5 4-1.8 8-5 8-4.2-3.5-5-6c-.8-2.5-1.8-4-3.5-4s-2.8 1.5-3.5 4-1.8 8-5 8-3.5-1.5-4.5-4 1.8-8 5-8z" />
            </svg>
          </div>

          {/* 4. Stripe */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <span className="font-bold text-sm sm:text-base tracking-tight lowercase italic font-sans">
              stripe
            </span>
          </div>

          {/* 5. GoDaddy */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <div className="flex items-center gap-1 font-bold text-xs sm:text-sm tracking-tight font-sans">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>GoDaddy</span>
            </div>
          </div>

          {/* 6. Meta Infinity */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <svg
              className="h-3.5 sm:h-4 w-auto fill-current"
              viewBox="0 0 38 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 13.7c-2.4 3.7-5.1 5.8-8.2 5.8-4.9 0-8.8-4.1-8.8-9.8S5.9 0 10.8 0c3.4 0 6.2 2.3 8.2 5.8C21 2.3 23.8 0 27.2 0c4.9 0 8.8 4.1 8.8 9.8s-3.9 9.8-8.8 9.8c-3.1 0-5.8-2.1-8.2-5.9zm-8.2 2.6c2.4 0 4.5-1.7 6.4-4.8-1.9-3.1-4-4.8-6.4-4.8-3.1 0-5.4 2.5-5.4 6.2s2.3 6.2 5.4 6.2zm16.4 0c3.1 0 5.4-2.5 5.4-6.2s-2.3-6.2-5.4-6.2c-2.4 0-4.5 1.7-6.4 4.8 1.9 3.1 4 4.8 6.4 4.8z" />
            </svg>
          </div>

          {/* 7. Inflection */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <span className="font-serif font-medium text-xs sm:text-sm tracking-normal">
              Inflection
            </span>
          </div>

          {/* 8. AWS */}
          <div className="h-16 flex items-center justify-center px-3 sm:px-4 text-[#67776e] hover:text-[#14211a] transition-colors">
            <div className="flex flex-col items-center">
              <span className="font-bold text-xs sm:text-sm tracking-tight lowercase leading-none">
                aws
              </span>
              <svg className="w-5 sm:w-6 h-1 mt-0.5 fill-current" viewBox="0 0 32 8">
                <path d="M1 2c8 4 18 4 26 0l2 2C20 8 8 8 1 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
