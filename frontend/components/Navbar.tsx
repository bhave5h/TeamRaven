"use client";

import React, { useState } from "react";
import Logo from "./Logo";
import { ArrowRight } from "lucide-react";

interface NavbarProps {
  onBookDemo: () => void;
  onOpenWarRoomPlan: () => void;
}

export default function Navbar({ onBookDemo, onOpenWarRoomPlan }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Company", href: "#company" },
  ];

  return (
    <>
      {/* Fixed navbar: transparent over the video */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 md:px-14 py-4 sm:py-5 flex items-center justify-between">
        {/* Left Zone: Logo */}
        <div className="flex items-center gap-4">
          <Logo />
        </div>

        {/* Center Zone: Links (hidden below md) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[#191919]/70 hover:text-[#191919] transition-colors duration-200 select-none font-medium"
            >
              {link.label}
            </a>
          ))}

          {/* Hackathon Plan Pill */}
          <button
            onClick={onOpenWarRoomPlan}
            className="text-xs px-3 py-1 bg-white/80 hover:bg-white text-[#191919]/80 hover:text-[#191919] rounded-full border border-gray-200/80 transition-all duration-200 shadow-2xs font-medium cursor-pointer"
          >
            War Room Plan
          </button>
        </nav>

        {/* Right Zone: CTA Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBookDemo}
            className="px-5 py-2.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-xs"
          >
            Book A Demo
          </button>

          {/* Mobile Menu Toggle (below md) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#191919] rounded-lg hover:bg-white/80 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-16 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3 pb-4 border-b border-gray-100">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-[#191919]/80 hover:text-[#191919]"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWarRoomPlan();
                }}
                className="w-full text-left text-sm font-medium text-emerald-800 py-1"
              >
                View Odin War Room Plan →
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onBookDemo();
              }}
              className="w-full py-3 bg-[#191919] text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
            >
              <span>Book A Demo</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
