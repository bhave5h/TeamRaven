import React from "react";

export function LogoMark({ className = "w-6 h-6 text-[#191919]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Boomerang Logo Mark"
    >
      <path d="M 144 256 L 27.598 256 L 144 139.598 Z" />
      <path d="M 256 207.5 L 200 256 L 200 56 L 0 56 L 48 0 L 256 0 Z" />
      <path d="M 0 204.402 L 0 112 L 92.402 112 Z" />
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="flex items-center gap-[10px] select-none">
      <LogoMark className="w-6 h-6 text-[#191919]" />
      <span className="font-semibold text-base tracking-tight text-[#191919]">
        Boomerang
      </span>
    </div>
  );
}
