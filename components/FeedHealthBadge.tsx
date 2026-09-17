"use client";

import React from "react";

interface FeedHealthBadgeProps {
  status: "healthy" | "warning" | "error" | string;
  errorMessage?: string | null;
}

export function FeedHealthBadge({ status, errorMessage }: FeedHealthBadgeProps) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Healthy
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span
        title={errorMessage || "Feed reported warnings"}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Warning
      </span>
    );
  }

  return (
    <span
      title={errorMessage || "Feed connection failed"}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Error
    </span>
  );
}
