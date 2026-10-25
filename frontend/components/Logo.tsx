import React from "react";

export function OdinLogoMark({ className = "w-6 h-6 text-[#14211a]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Odin Aegis Mark"
    >
      {/* Outer Aegis / Raven Shield */}
      <path
        d="M24 4L8 12V24C8 33.6 14.8 42.4 24 44C33.2 42.4 40 33.6 40 24V12L24 4Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Raven Eye & Core Geometry */}
      <path
        d="M24 16L16 26H32L24 16Z"
        fill="currentColor"
      />
      <circle cx="24" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-3 select-none cursor-pointer">
      <OdinLogoMark className="w-6 h-6 text-[#14211a]" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-serif font-medium text-lg tracking-tight text-[#14211a]">
            ODIN
          </span>
          <span className="text-[10px] font-mono tracking-[0.16em] uppercase px-1.5 py-0.5 bg-[#f3f8f5] border border-[#dce8e1] rounded text-[#14211a] font-semibold">
            WAR ROOM
          </span>
        </div>
        <span className="text-[10px] text-[#67776e] tracking-wide font-sans">
          Autonomous Contract Intelligence
        </span>
      </div>
    </div>
  );
}
