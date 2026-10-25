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
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    if (urgency === "warning") {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    return "bg-blue-50 text-blue-800 border-blue-200";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Column 1: Prioritized Alert Feed [FR9.5] */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50">
              OPERATIONAL ALERTS & DEADLINES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#191919] mt-0.5">
              Notice Window Countdown & Risks
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-[#F4F3F3] text-[#191919]/70 rounded">
            {activeAlerts.length} Active
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all space-y-2 shadow-2xs"
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
                  <span className="text-[11px] font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    Due: {alert.deadline}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-[#191919]">
                {alert.title}
              </h4>
              <p className="text-xs text-[#191919]/70 leading-relaxed font-sans">
                {alert.description}
              </p>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#191919]/60 font-mono">
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
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#191919]/50">
              ACTION CENTER & LEGAL NOTICES [FR9.5]
            </span>
            <h3 className="text-lg font-serif font-normal text-[#191919] mt-0.5">
              Drafted Letters Ready for Human Sign-Off
            </h3>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded">
            Human-in-the-Loop
          </span>
        </div>

        <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#191919]/50 block">
                    {notice.type.replace("_", " ")}
                  </span>
                  <h4 className="text-sm font-semibold text-[#191919] mt-0.5">
                    {notice.recipient}
                  </h4>
                </div>

                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                    notice.status === "approved"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {notice.status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-[#191919]/70 line-clamp-2 font-serif italic">
                &ldquo;{notice.subject}&rdquo;
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  +${notice.financialImpact.toLocaleString()} recovery
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenNotice(notice)}
                    className="px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg hover:bg-[#F4F3F3] transition-colors cursor-pointer"
                  >
                    Review Letter
                  </button>
                  {notice.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(notice.id)}
                      className="px-3 py-1.5 bg-[#191919] text-white text-xs font-medium rounded-lg hover:bg-[#191919]/90 active:scale-[0.98] transition-all cursor-pointer"
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
