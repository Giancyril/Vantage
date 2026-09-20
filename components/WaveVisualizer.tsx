"use client";

import React, { useMemo } from "react";

export interface WaveVisualizerProps {
  isPlaying: boolean;
  progressPercent: number; // 0 to 100
  onSeekPercent?: (percent: number) => void;
  className?: string;
  barCount?: number;
}

export function WaveVisualizer({
  isPlaying,
  progressPercent,
  onSeekPercent,
  className = "",
  barCount = 36,
}: WaveVisualizerProps) {
  // Generate a realistic, natural soundwave profile
  const baseHeights = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const normalizedX = (i / barCount) * Math.PI * 2;
      const wave1 = Math.sin(normalizedX * 2);
      const wave2 = Math.cos(normalizedX * 5) * 0.4;
      const wave3 = Math.sin(normalizedX * 9) * 0.2;
      const combined = Math.abs(wave1 + wave2 + wave3);
      // Map to 20% - 95% height
      return Math.round(20 + combined * 45);
    });
  }, [barCount]);

  const handleBarClick = (index: number) => {
    if (!onSeekPercent) return;
    const pct = Math.max(0, Math.min(100, (index / barCount) * 100));
    onSeekPercent(pct);
  };

  return (
    <div
      className={`flex items-center justify-between gap-1 h-12 px-3 py-2 bg-white/70 rounded-xl border border-[#E8E4DC] select-none ${className}`}
    >
      {baseHeights.map((baseH, idx) => {
        const barPercent = (idx / barCount) * 100;
        const isPast = barPercent <= progressPercent;

        // Dynamic animation delay for staggered lively ripple when playing
        const animDelay = (idx % 8) * 0.12;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleBarClick(idx)}
            className="h-full flex-1 flex items-center justify-center group focus:outline-hidden cursor-pointer"
            title={`Seek to ${Math.round(barPercent)}%`}
          >
            <div
              style={{
                height: `${baseH}%`,
                animationDelay: `${animDelay}s`,
              }}
              className={`w-full rounded-full transition-all duration-150 ${
                isPlaying
                  ? "animate-pulse"
                  : ""
              } ${
                isPast
                  ? "bg-[#C35824] group-hover:bg-[#AB4B1C]"
                  : "bg-[#E8E4DC] group-hover:bg-[#D5CFC5]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
