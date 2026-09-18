"use client";

import React from "react";
import { Layers, CheckCircle2 } from "lucide-react";

interface ClusterBadgeProps {
  sourceCount: number;
  sources?: string[];
  consensusScore?: number;
  className?: string;
}

export function ClusterBadge({
  sourceCount,
  sources = [],
  consensusScore,
  className = "",
}: ClusterBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F5F2EB] border border-[#E5E0D6] text-xs font-medium text-[#4A453E] ${className}`}
    >
      <div className="flex items-center gap-1 text-[#C35824]">
        <Layers className="w-3.5 h-3.5" />
        <span className="font-semibold">{sourceCount} {sourceCount === 1 ? "Source" : "Sources"}</span>
      </div>

      {sources.length > 0 && (
        <>
          <span className="text-[#D0CAC0]">&bull;</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sources.slice(0, 3).map((src) => (
              <span
                key={src}
                className="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold tracking-wider bg-white border border-[#E9E5DE] text-[#6A645A]"
              >
                {src}
              </span>
            ))}
            {sources.length > 3 && (
              <span className="text-[10px] text-[#8A8378]">+{sources.length - 3} more</span>
            )}
          </div>
        </>
      )}

      {consensusScore !== undefined && (
        <>
          <span className="text-[#D0CAC0]">&bull;</span>
          <div className="flex items-center gap-1 text-[#2E6F40] text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            <span>{Math.round(consensusScore * 100)}% Corroborated</span>
          </div>
        </>
      )}
    </div>
  );
}
