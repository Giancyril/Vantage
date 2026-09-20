"use client";

import React, { useState } from "react";
import { ExternalLink, Play, Search, Check } from "lucide-react";
import type { BriefingSegment } from "@/lib/audio-briefing";
import { formatAudioTime } from "@/lib/audio-briefing";

export interface SynchronizedTranscriptProps {
  segments: BriefingSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function SynchronizedTranscript({
  segments,
  currentTime,
  onSeek,
  className = "",
}: SynchronizedTranscriptProps) {
  const [filterText, setFilterText] = useState("");

  const filteredSegments = segments.filter((s) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.text.toLowerCase().includes(q);
  });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Transcript Header & Quick Filter */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7A746B]">
            Synchronized Transcript
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE6DF] text-[#524E48] font-mono">
            {segments.length} segments
          </span>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A746B]" />
          <input
            type="text"
            placeholder="Filter transcript..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8 pr-2.5 py-1 text-xs bg-white border border-[#E8E4DC] rounded-lg text-[#181715] placeholder-[#7A746B] focus:outline-hidden focus:border-[#181715] transition-colors"
          />
        </div>
      </div>

      {/* Segments Stream */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filteredSegments.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#7A746B] italic bg-[#FAF8F5] rounded-xl border border-[#E8E4DC]">
            No matching segments found in this briefing.
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isActive =
              currentTime >= segment.startSec &&
              (segment.endSec === undefined || currentTime < segment.endSec);
            const isCompleted = currentTime >= segment.endSec;

            return (
              <div
                key={segment.id}
                onClick={() => onSeek(segment.startSec)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group select-none ${
                  isActive
                    ? "bg-amber-50/70 border-amber-400 shadow-xs ring-1 ring-amber-300"
                    : isCompleted
                    ? "bg-white/60 border-[#E8E4DC] hover:border-[#D5CFC5] opacity-80"
                    : "bg-white border-[#E8E4DC] hover:border-[#D5CFC5]"
                }`}
              >
                {/* Segment Meta Bar */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md transition-colors ${
                        isActive
                          ? "bg-amber-500 text-white font-semibold"
                          : "bg-[#F3F0EA] text-[#524E48] group-hover:bg-[#E8E4DC]"
                      }`}
                    >
                      {isActive ? (
                        <Play className="w-2.5 h-2.5 fill-current animate-pulse" />
                      ) : isCompleted ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : null}
                      <span>{formatAudioTime(segment.startSec)}</span>
                    </span>

                    <h4
                      className={`text-xs font-bold truncate ${
                        isActive ? "text-amber-950 font-editorial text-sm" : "text-[#181715]"
                      }`}
                    >
                      {segment.title}
                    </h4>
                  </div>

                  {/* External Article Link */}
                  {segment.articleUrl && (
                    <a
                      href={segment.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A746B] hover:text-[#C35824] px-2 py-0.5 rounded hover:bg-white transition-colors shrink-0"
                      title="Read original article"
                    >
                      <span>{segment.source || "Article"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Segment Spoken Text */}
                <p
                  className={`text-xs leading-relaxed transition-colors ${
                    isActive
                      ? "text-[#181715] font-medium"
                      : "text-[#524E48]"
                  }`}
                >
                  {segment.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
