"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [email, setEmail] = useState("");
  const [institutionType, setInstitutionType] = useState("Credit Union");
  const [channel, setChannel] = useState("Omnichannel");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-2xl p-6 sm:p-8 overflow-hidden transition-all duration-200 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#191919] p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close dialog"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {!submitted ? (
          <div>
            <div className="mb-6">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#191919]/50 font-medium">
                FINANCIAL AI CONSULTATION
              </span>
              <h2 className="mt-2 text-2xl font-serif font-normal text-[#191919] tracking-tight">
                Experience Boomerang in Action
              </h2>
              <p className="mt-2 text-sm text-[#191919]/70 leading-relaxed">
                See how conversational AI agents manage the borrower lifecycle
                with strict compliance and real-time core banking integration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#191919]/80 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First National Credit Union"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F4F3F3] border border-transparent rounded-lg focus:bg-white focus:border-[#191919] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#191919]/80 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F4F3F3] border border-transparent rounded-lg focus:bg-white focus:border-[#191919] outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#191919]/80 mb-1">
                    Institution Type
                  </label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#F4F3F3] border border-transparent rounded-lg focus:bg-white focus:border-[#191919] outline-none transition-colors"
                  >
                    <option value="Credit Union">Credit Union</option>
                    <option value="Commercial Bank">Commercial Bank</option>
                    <option value="Mortgage Lender">Mortgage Lender</option>
                    <option value="Fintech">Fintech / Neo-Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#191919]/80 mb-1">
                    Deployment Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-[#F4F3F3] border border-transparent rounded-lg focus:bg-white focus:border-[#191919] outline-none transition-colors"
                  >
                    <option value="Omnichannel">Omnichannel (Voice, SMS, Email)</option>
                    <option value="Voice Only">Voice & IVR Agent</option>
                    <option value="SMS / Messaging">Two-Way SMS & Chat</option>
                    <option value="Email / Underwriting">Email & Document Ingestion</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Confirm Scheduled Demo</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="w-12 h-12 mx-auto bg-green-50 text-green-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-serif font-normal text-[#191919]">
              Demo Session Reserved
            </h3>
            <p className="mt-2 text-sm text-[#191919]/70 max-w-sm mx-auto">
              We&apos;ve sent a calendar invitation and sandbox credentials for{" "}
              <strong className="text-[#191919]">{institutionName || "your institution"}</strong>{" "}
              to <strong className="text-[#191919]">{email}</strong>.
            </p>
            <div className="mt-6 p-4 bg-[#F4F3F3] rounded-lg text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#191919]/50">Session Type:</span>
                <span className="font-medium text-[#191919]">Live Agent Sandboxing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#191919]/50">Focus Channel:</span>
                <span className="font-medium text-[#191919]">{channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#191919]/50">Compliance Scope:</span>
                <span className="font-medium text-[#191919]">GLBA & CFPB Audited</span>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-2.5 bg-[#191919] text-white text-sm font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
