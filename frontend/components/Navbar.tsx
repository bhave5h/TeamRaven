"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { CheckpointDate } from "@/lib/types";

interface NavbarProps {
  currentCheckpoint?: CheckpointDate;
  onSelectCheckpoint?: (cp: CheckpointDate) => void;
  onTriggerAnalysis?: () => void;
}

export default function Navbar({
  currentCheckpoint = "2027-03-15",
  onSelectCheckpoint,
  onTriggerAnalysis,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "War Room Console", href: "/" },
    { label: "Live Debate Arena", href: "/debate" },
    { label: "Portfolio Reports", href: "/reports" },
    { label: "Guardrail Telemetry", href: "/guardrails" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-3.5 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Odin War Room Logo */}
        <Link href="/" className="no-underline">
          <Logo />
        </Link>

        {/* Center: Navigation Links (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F4F3F3] p-1 rounded-xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-[#191919] shadow-2xs font-semibold"
                    : "text-[#191919]/60 hover:text-[#191919]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Checkpoint & Run Action */}
        <div className="flex items-center gap-3">
          {/* Active Checkpoint Indicator */}
          {onSelectCheckpoint && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#fafafa] border border-gray-200 rounded-lg text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#191919]/50">Clock:</span>
              <span className="font-semibold text-[#191919]">{currentCheckpoint}</span>
            </div>
          )}

          {/* Trigger Analysis Button */}
          {onTriggerAnalysis && (
            <button
              onClick={onTriggerAnalysis}
              className="px-4 py-2 bg-[#191919] text-white text-xs font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Run Agent Pipeline</span>
              <span>⚡</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden pt-4 pb-2 border-t border-gray-100 mt-3 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-[#F4F3F3] text-[#191919] font-semibold" : "text-[#191919]/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
