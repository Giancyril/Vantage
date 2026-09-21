"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  variant?: "velocity" | "depth" | "breadth" | "gap" | "default";
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  velocity: "border-[#C35824]/20 bg-gradient-to-br from-[#FEF8F4] to-[#FDF5EE]",
  depth:    "border-[#2D6A4F]/20 bg-gradient-to-br from-[#F4FAF6] to-[#EBF6EF]",
  breadth:  "border-[#2B4C8C]/20 bg-gradient-to-br from-[#F0F4FC] to-[#E6EDFA]",
  gap:      "border-[#B45309]/20 bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]",
  default:  "border-[#E9E5DE] bg-white",
};

const trendColors = {
  up:   "text-[#2D6A4F] bg-[#E6F4EC]",
  down: "text-[#9B1C1C] bg-[#FEE2E2]",
  flat: "text-[#6B7280] bg-[#F3F4F6]",
};

export function StatCard({
  label,
  value,
  subLabel,
  trend,
  trendLabel,
  variant = "default",
  icon,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">
          {label}
        </span>
        {icon && <span className="text-[#C35824] opacity-70">{icon}</span>}
      </div>

      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-[#181715] leading-none tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-0.5 ${trendColors[trend]}`}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {trend === "flat" && <Minus className="w-3 h-3" />}
            {trendLabel ?? trend}
          </span>
        )}
      </div>

      {subLabel && (
        <p className="mt-1.5 text-xs text-[#8A8278] leading-snug">{subLabel}</p>
      )}
    </div>
  );
}
