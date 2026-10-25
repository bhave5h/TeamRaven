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
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#191919] dark:text-[#f4f4f6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#22222a] flex items-center justify-between bg-white dark:bg-[#121216] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded bg-[#F4F3F3] dark:bg-[#181820] text-[#191919]/70 dark:text-neutral-300 border border-gray-200 dark:border-[#26262e]">
                FORMAL LEGAL ARTIFACT • DRAFTED BY TYR
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  notice.status === "approved"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                }`}
              >
                {notice.status.toUpperCase()}
              </span>
            </div>
            <h3 className="mt-1.5 text-lg sm:text-xl font-serif font-normal text-[#191919] dark:text-white">
              {notice.subject}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#191919] dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#181820] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notice Meta Details */}
        <div className="px-6 py-3 bg-[#fafafa] dark:bg-[#16161c] border-b border-gray-100 dark:border-[#22222a] text-xs grid grid-cols-2 gap-4 shrink-0">
          <div>
            <span className="text-[#191919]/50 dark:text-neutral-400 block">Recipient Entity:</span>
            <span className="font-medium text-[#191919] dark:text-white">{notice.recipient}</span>
            <span className="text-[#191919]/60 dark:text-neutral-400 block text-[11px] font-mono mt-0.5">
              {notice.recipientAddress}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[#191919]/50 dark:text-neutral-400 block">Financial Recourse:</span>
            <span suppressHydrationWarning className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
              ${formatNumber(notice.financialImpact)}
            </span>
            <button
              onClick={() => onOpenCitation(notice.primaryCitation)}
              className="mt-1 text-[11px] text-[#191919]/70 dark:text-neutral-300 hover:text-[#191919] dark:hover:text-white underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Grounding: {notice.primaryCitation.docId} {notice.primaryCitation.section}</span>
            </button>
          </div>
        </div>

        {/* Notice Body */}
        <div className="p-6 overflow-y-auto flex-1 font-serif text-sm leading-relaxed text-[#191919]/90 dark:text-neutral-200 bg-white dark:bg-[#121216]">
          {isEditing ? (
            <textarea
              value={currentBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={12}
              className="w-full p-4 border border-gray-300 dark:border-[#26262e] rounded-lg font-mono text-xs focus:border-[#191919] dark:focus:border-white outline-none bg-white dark:bg-[#181820] text-[#191919] dark:text-white"
            />
          ) : (
            <div className="whitespace-pre-line p-4 bg-[#F4F3F3]/50 dark:bg-[#181820] rounded-xl border border-gray-100 dark:border-[#26262e]">
              {currentBody}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white dark:bg-[#121216] border-t border-gray-100 dark:border-[#22222a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-[#26262e] text-xs font-medium text-[#191919] dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-[#181820] transition-colors cursor-pointer"
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
              className="px-3.5 py-1.5 border border-gray-200 dark:border-[#26262e] text-xs font-medium text-[#191919] dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-[#181820] transition-colors cursor-pointer"
            >
              Export Letter (.txt)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#191919]/70 dark:text-neutral-400 hover:text-[#191919] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-5 py-2 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              Sign & Approve Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
