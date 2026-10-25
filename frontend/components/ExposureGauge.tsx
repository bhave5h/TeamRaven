"use client";

import React from "react";
import { CheckpointDate } from "@/lib/types";
import { FINANCIAL_METRICS } from "@/lib/odinData";
import { formatNumber } from "@/lib/format";

interface ExposureGaugeProps {
  checkpoint: CheckpointDate;
}

export default function ExposureGauge({ checkpoint }: ExposureGaugeProps) {
  const metric = FINANCIAL_METRICS[checkpoint] || FINANCIAL_METRICS["2027-03-15"];

  const maxScale = 300000;
  const ratio = Math.min(1, metric.totalGrossExposure / maxScale);
  const strokeDashoffset = 283 - 283 * ratio * 0.75; // 270 deg arc

  return (
    <div className="w-full bg-white border border-[#dce8e1] rounded-xl p-4 sm:p-5 shadow-2xs select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[#dce8e1]">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-[#67776e]">
            FINANCIAL EXPOSURE & RISK GAUGES [FR9.3]
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-normal text-[#14211a] mt-0.5">
            Portfolio Liability & Recovery Waterfall
          </h3>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 bg-[#f3f8f5] text-[#14211a] rounded border border-[#dce8e1]">
          Checkpoint: {checkpoint}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 items-center">
        {/* Radial Risk Gauge */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#f3f8f5] border border-[#dce8e1] rounded-xl relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                className="text-[#dce8e1]"
                strokeWidth="9"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                className="text-[#14211a]"
                strokeWidth="9"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transition-all="true"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#67776e]">
                GROSS EXPOSURE
              </span>
              <span className="text-xl sm:text-2xl font-serif font-semibold text-[#14211a]">
                ${(metric.totalGrossExposure / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-rose-700 font-mono font-semibold">
                {metric.contractsAtRisk} contracts at risk
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#67776e] text-center font-sans">
            Worst-case unmitigated exposure computed by `timeline_engine.py`
          </p>
        </div>

        {/* Net Financial Recovery Waterfall Chart */}
        <div className="md:col-span-2 space-y-4">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-[#67776e] block">
            NET RECOVERY WATERFALL ANALYSIS
          </span>

          {/* Bar 1: Downstream Customer Credits Claimed (Loss) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-[#14211a]">Downstream Customer Penalties Owed</span>
              <span suppressHydrationWarning className="font-mono font-semibold text-rose-700">
                -${formatNumber(metric.downstreamOwed)}
              </span>
            </div>
            <div className="h-3 w-full bg-[#f3f8f5] rounded-full overflow-hidden border border-[#dce8e1]">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (metric.downstreamOwed / 150000) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#67776e] mt-0.5 block">
              Incurred from Apex Retail & Harbor Logistics downtime claims
            </span>
          </div>

          {/* Bar 2: Upstream Cloud Recoveries Claimed (Gain) */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-[#14211a]">Upstream Recoveries Claimed (StratoNode)</span>
              <span suppressHydrationWarning className="font-mono font-semibold text-emerald-700">
                +${formatNumber(metric.upstreamRecoverable)}
              </span>
            </div>
            <div className="h-3 w-full bg-[#f3f8f5] rounded-full overflow-hidden border border-[#dce8e1]">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (metric.upstreamRecoverable / 150000) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#67776e] mt-0.5 block">
              Offset demand enforced under Amendment A3 §2.1 within 15-day window
            </span>
          </div>

          {/* Bar 3: Net Financial Leakage (Gap) */}
          <div className="p-3.5 bg-[#f3f8f5] rounded-xl border border-[#dce8e1] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#14211a] uppercase tracking-wider block">
                NET FINANCIAL LEAKAGE
              </span>
              <span className="text-[11px] text-[#67776e]">
                Direct bottom-line friction resulting from contract SLA asymmetry
              </span>
            </div>
            <div className="text-right">
              <span suppressHydrationWarning className="text-lg font-serif font-bold text-rose-700">
                -${formatNumber(metric.netFinancialLeakage)}
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 border border-emerald-200 px-1.5 py-0.5 rounded block mt-0.5">
                Saved $36k via Tyr Invalidation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
