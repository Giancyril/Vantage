"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { KnowledgeDepthEntry } from "@/lib/analytics";

interface KnowledgeDepthBarProps {
  entries: KnowledgeDepthEntry[];
  onSelectTopic?: (topic: string) => void;
}

export function KnowledgeDepthBar({ entries, onSelectTopic }: KnowledgeDepthBarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[#8A8278]">
        No depth data yet — engage with articles to build your profile.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isHovered = hovered === entry.topic;
        const depthPct = Math.round(entry.depth * 100);
        const weightPct = Math.round(entry.weight * 100);

        return (
          <div
            key={entry.topic}
            className={`group cursor-pointer rounded-lg p-3 transition-colors ${
              isHovered ? "bg-[#F4F1EC]" : "hover:bg-[#F9F8F5]"
            }`}
            onMouseEnter={() => setHovered(entry.topic)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectTopic?.(entry.topic)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#181715] flex items-center gap-1.5">
                {entry.gap && (
                  <span title="Knowledge gap: high interest, low engagement" className="inline-flex items-center">
                    <AlertTriangle
                      className="w-3.5 h-3.5 text-[#D97706] shrink-0"
                    />
                  </span>
                )}
                <span className="truncate max-w-[160px]">{entry.topic}</span>
              </span>
              <span className="text-[10px] text-[#8A8278] tabular-nums shrink-0 ml-2">
                {depthPct}% depth
              </span>
            </div>

            {/* Dual bar: weight (background) + depth (foreground) */}
            <div className="relative h-2 rounded-full bg-[#EAE6DF] overflow-hidden">
              {/* Weight bar (light) */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#C35824]/20 transition-all duration-500"
                style={{ width: `${weightPct}%` }}
              />
              {/* Depth bar (solid) */}
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                  entry.gap
                    ? "bg-[#D97706]"
                    : depthPct > 60
                    ? "bg-[#2D6A4F]"
                    : "bg-[#C35824]"
                }`}
                style={{ width: `${depthPct}%` }}
              />
            </div>

            {isHovered && (
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#8A8278]">
                <span>
                  Weight: <strong className="text-[#181715]">{weightPct}%</strong>
                </span>
                <span>
                  Articles read: <strong className="text-[#181715]">{entry.articleCount}</strong>
                </span>
                {entry.gap && (
                  <span className="text-[#D97706] font-medium">Knowledge gap</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
