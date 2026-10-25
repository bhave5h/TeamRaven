"use client";

import React, { useState } from "react";
import { CheckpointDate, AlertItem, ActionNotice, Citation } from "@/lib/types";
import { ALERTS_LIST, ACTION_NOTICES } from "@/lib/odinData";

interface AlertActionPanelProps {
  checkpoint: CheckpointDate;
  onOpenNotice: (notice: ActionNotice) => void;
  onOpenCitation: (cit: Citation) => void;
}

export default function AlertActionPanel({
  checkpoint,
  onOpenNotice,
  onOpenCitation,
}: AlertActionPanelProps) {
  const [notices, setNotices] = useState<ActionNotice[]>(ACTION_NOTICES);

  const activeAlerts = ALERTS_LIST.filter(
    (a) => a.checkpoint === checkpoint || a.urgency === "critical"
  );

  const handleApprove = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "approved" } : n))
    );
  };

  const getUrgencyBadge = (urgency: AlertItem["urgency"]) => {
    if (urgency === "critical") {
      return "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50";
    }
    if (urgency === "warning") {
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50";
    }
    return "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/50";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
      {/* Column 1: Prioritized Alert Feed [FR9.5] */}
      <div className="bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#22222a]">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
              OPERATIONAL ALERTS & DEADLINES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-0.5">
              Notice Window Countdown & Risks
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-[#F4F3F3] dark:bg-[#181820] text-[#191919]/70 dark:text-neutral-300 rounded border border-transparent dark:border-[#26262e]">
            {activeAlerts.length} Active
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-white dark:bg-[#16161c] border border-gray-200 dark:border-[#26262e] rounded-xl hover:border-gray-300 dark:hover:border-neutral-600 transition-all space-y-2 shadow-2xs"
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${getUrgencyBadge(
                    alert.urgency
                  )}`}
                >
                  {alert.urgency} PRIORITY
                </span>
                {alert.deadline && (
                  <span className="text-[11px] font-mono font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-transparent dark:border-rose-900/40">
                    Due: {alert.deadline}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-[#191919] dark:text-[#f4f4f6]">
                {alert.title}
              </h4>
              <p className="text-xs text-[#191919]/70 dark:text-neutral-300 leading-relaxed font-sans">
                {alert.description}
              </p>

              <div className="pt-2 border-t border-gray-100 dark:border-[#22222a] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#191919]/60 dark:text-neutral-400 font-mono">
                  {alert.contractId}
                </span>
                <button
                  onClick={() => onOpenCitation(alert.citation)}
                  className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline cursor-pointer"
                >
                  View Clause Quote →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Action Center & Drafted Legal Notices [FR9.5] */}
      <div className="bg-white dark:bg-[#121216] border border-gray-200 dark:border-[#22222a] rounded-xl p-4 sm:p-5 shadow-2xs transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#22222a]">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50 dark:text-neutral-400">
              ACTION CENTER & LEGAL NOTICES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#191919] dark:text-[#f4f4f6] mt-0.5">
              Drafted Letters Ready for Human Sign-Off
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded">
            Human-in-the-Loop
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 bg-white dark:bg-[#16161c] border border-gray-200 dark:border-[#26262e] rounded-xl hover:border-gray-300 dark:hover:border-neutral-600 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 dark:text-neutral-400 block">
                    {notice.type.replace("_", " ")}
                  </span>
                  <h4 className="text-sm font-semibold text-[#191919] dark:text-[#f4f4f6] mt-0.5">
                    {notice.recipient}
                  </h4>
                </div>

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

              <p className="text-xs text-[#191919]/70 dark:text-neutral-300 line-clamp-2 font-serif italic">
                &ldquo;{notice.subject}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#22222a]">
                <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                  +${notice.financialImpact.toLocaleString()} recovery
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenNotice(notice)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-[#26262e] text-xs font-medium rounded-lg hover:bg-[#F4F3F3] dark:hover:bg-[#181820] text-[#191919] dark:text-[#f4f4f6] transition-colors cursor-pointer"
                  >
                    Review Letter
                  </button>
                  {notice.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(notice.id)}
                      className="px-3 py-1.5 bg-[#191919] dark:bg-white text-white dark:text-[#09090b] text-xs font-medium rounded-lg hover:bg-[#191919]/90 dark:hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
