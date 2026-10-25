"use client";

import React, { useState } from "react";
import { ActionNotice, Citation } from "@/lib/types";
import { formatNumber } from "@/lib/format";

interface NoticeModalProps {
  notice: ActionNotice | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onOpenCitation: (cit: Citation) => void;
}

export default function NoticeModal({
  notice,
  onClose,
  onApprove,
  onOpenCitation,
}: NoticeModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState("");

  if (!notice) return null;

  const currentBody = editedBody || notice.body;

  const handleApprove = () => {
    onApprove(notice.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-[#dce8e1] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#14211a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#dce8e1] flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded bg-[#f3f8f5] text-[#14211a] border border-[#dce8e1]">
                FORMAL LEGAL ARTIFACT • DRAFTED BY TYR
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  notice.status === "approved"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {notice.status.toUpperCase()}
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-serif font-normal text-[#14211a]">
              {notice.subject}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-[#67776e] hover:text-[#14211a] p-2 rounded-lg hover:bg-[#f3f8f5] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notice Meta Details */}
        <div className="px-6 py-3 bg-[#f3f8f5] border-b border-[#dce8e1] text-xs grid grid-cols-2 gap-4 shrink-0">
          <div>
            <span className="text-[#67776e] block">Recipient Entity:</span>
            <span className="font-medium text-[#14211a]">{notice.recipient}</span>
            <span className="text-[#67776e] block text-[11px] font-mono mt-0.5">
              {notice.recipientAddress}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#67776e] block">Financial Recourse:</span>
            <span suppressHydrationWarning className="font-semibold text-emerald-700 text-sm">
              ${formatNumber(notice.financialImpact)}
            </span>
            <button
              onClick={() => onOpenCitation(notice.primaryCitation)}
              className="mt-1 text-[11px] text-[#67776e] hover:text-[#14211a] underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Grounding: {notice.primaryCitation.docId} {notice.primaryCitation.section}</span>
            </button>
          </div>
        </div>

        {/* Notice Body */}
        <div className="p-6 overflow-y-auto flex-1 font-serif text-sm leading-relaxed text-[#14211a]/90 bg-white">
          {isEditing ? (
            <textarea
              value={currentBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={12}
              className="w-full p-4 border border-[#dce8e1] rounded-lg font-mono text-xs focus:border-[#14211a] outline-none bg-white text-[#14211a]"
            />
          ) : (
            <div className="whitespace-pre-line p-4 bg-[#f3f8f5] rounded-xl border border-[#dce8e1]">
              {currentBody}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#dce8e1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-1.5 border border-[#dce8e1] text-xs font-medium text-[#14211a] rounded-lg hover:bg-[#f3f8f5] transition-colors cursor-pointer"
            >
              {isEditing ? "Save Edits" : "Edit Letter"}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([currentBody], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${notice.id}_letter.txt`;
                a.click();
              }}
              className="px-3.5 py-1.5 border border-[#dce8e1] text-xs font-medium text-[#14211a] rounded-lg hover:bg-[#f3f8f5] transition-colors cursor-pointer"
            >
              Export Letter (.txt)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#67776e] hover:text-[#14211a] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-5 py-2 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              Sign & Approve Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
