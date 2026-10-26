import React from "react";
import Image from "next/image";

export function OdinLogoMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/logo.png"
        alt="Odin Logo"
        width={24}
        height={24}
        className="object-contain"
      />
    </div>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none cursor-pointer">
      <Image
        src="/logo.png"
        alt="Odin Logo"
        width={33}
        height={33}
        className="object-contain shrink-0"
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-lg tracking-tight text-[#14211a]">
            Odin Force
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
