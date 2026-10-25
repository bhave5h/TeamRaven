"use client";

import React, { useState } from "react";
import { CheckpointDate, AlertItem, ActionNotice, Citation } from "@/lib/types";
import { ALERTS_LIST, ACTION_NOTICES } from "@/lib/odinData";
import { formatNumber } from "@/lib/format";

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
      {/* Column 1: Prioritized Alert Feed [FR9.5] */}
      <div className="bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              OPERATIONAL ALERTS & DEADLINES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#14211a] mt-0.5">
              Notice Window Countdown & Risks
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-[#f3f8f5] text-[#14211a] rounded border border-[#dce8e1]">
            {activeAlerts.length} Active
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-white border border-[#dce8e1] rounded-xl hover:border-[#14211a]/40 transition-all space-y-2 shadow-2xs"
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
                  <span className="text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Due: {alert.deadline}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-[#14211a]">
                {alert.title}
              </h4>
              <p className="text-xs text-[#67776e] leading-relaxed font-sans">
                {alert.description}
              </p>

              <div className="pt-2 border-t border-[#dce8e1] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#67776e] font-mono">
                  {alert.contractId}
                </span>
                <button
                  onClick={() => onOpenCitation(alert.citation)}
                  className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  View Clause Quote →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Action Center & Drafted Legal Notices [FR9.5] */}
      <div className="bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
              ACTION CENTER & LEGAL NOTICES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#14211a] mt-0.5">
              Drafted Letters Ready for Human Sign-Off
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
            Human-in-the-Loop
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 bg-white border border-[#dce8e1] rounded-xl hover:border-[#14211a]/40 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e] block">
                    {notice.type.replace("_", " ")}
                  </span>
                  <h4 className="text-sm font-semibold text-[#14211a] mt-0.5">
                    {notice.recipient}
                  </h4>
                </div>

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

              <p className="text-xs text-[#14211a]/85 line-clamp-2 font-serif italic">
                &ldquo;{notice.subject}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#dce8e1]">
                <span suppressHydrationWarning className="text-xs font-mono font-semibold text-emerald-700">
                  +${formatNumber(notice.financialImpact)} recovery
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenNotice(notice)}
                    className="px-3 py-1.5 border border-[#dce8e1] text-xs font-medium rounded-lg hover:bg-[#f3f8f5] text-[#14211a] transition-colors cursor-pointer"
                  >
                    Review Letter
                  </button>
                  {notice.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(notice.id)}
                      className="px-3 py-1.5 bg-[#14211a] text-white text-xs font-medium rounded-lg hover:bg-[#14211a]/90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
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
