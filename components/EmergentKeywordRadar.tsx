"use client";

import React, { useEffect, useState } from "react";
import type { EmergentKeyword } from "@/lib/analytics";

interface EmergentKeywordRadarProps {
  keywords: EmergentKeyword[];
}

// Deterministic placement using golden-angle spiral
function getPlacement(index: number, total: number, containerW: number, containerH: number) {
  const goldenAngle = 2.39996; // radians
  const angle = index * goldenAngle;
  const radius = 30 + (index / total) * (Math.min(containerW, containerH) / 2 - 60);
  const cx = containerW / 2 + radius * Math.cos(angle);
  const cy = containerH / 2 + radius * Math.sin(angle);
  return { cx, cy };
}

export function EmergentKeywordRadar({ keywords }: EmergentKeywordRadarProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const W = 520;
  const H = 320;

  if (!keywords || keywords.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[#8A8278]">
        No trend data yet — run the pipeline to generate keywords.
      </div>
    );
  }

  const maxScore = Math.max(...keywords.map((k) => k.score), 0.01);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: H }}>
      {/* Radial grid lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <ellipse
            key={r}
            cx={W / 2}
            cy={H / 2}
            rx={(W / 2 - 20) * r}
            ry={(H / 2 - 20) * r}
            fill="none"
            stroke="#E9E5DE"
            strokeWidth={0.8}
            strokeDasharray="4 4"
          />
        ))}
        {/* Center dot */}
        <circle cx={W / 2} cy={H / 2} r={3} fill="#E9E5DE" />
      </svg>

      {/* Keyword bubbles */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {keywords.map((kw, i) => {
          const { cx, cy } = getPlacement(i, keywords.length, W, H);
          const size = 18 + (kw.score / maxScore) * 28;
          const isPositive = kw.delta >= 0;
          const isHot = kw.delta > 30;

          const fill = isHot
            ? "#FEF3C7"
            : isPositive
            ? "#EBF6EF"
            : "#FEE2E2";
          const stroke = isHot
            ? "#D97706"
            : isPositive
            ? "#2D6A4F"
            : "#9B1C1C";
          const textColor = isHot
            ? "#92400E"
            : isPositive
            ? "#1A4731"
            : "#7F1D1D";

          const isHovered = hovered === kw.keyword;

          return (
            <g
              key={kw.keyword}
              style={{
                transform: mounted ? "scale(1)" : "scale(0)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms`,
              }}
              onMouseEnter={() => setHovered(kw.keyword)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-default"
            >
              {/* Pulse ring for hot keywords */}
              {isHot && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={size + 4}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={1}
                  opacity={0.35}
                  className="animate-ping"
                  style={{ animationDuration: "2.5s" }}
                />
              )}

              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? size + 4 : size}
                fill={fill}
                stroke={stroke}
                strokeWidth={isHovered ? 2 : 1.2}
                style={{ transition: "all 0.2s ease" }}
              />

              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.max(8, Math.min(11, size * 0.45))}
                fontWeight="600"
                fill={textColor}
                fontFamily="system-ui, sans-serif"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {kw.keyword.length > 12 ? kw.keyword.slice(0, 11) + "…" : kw.keyword}
              </text>

              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={cx - 60}
                    y={cy - size - 44}
                    width={120}
                    height={38}
                    rx={6}
                    fill="#181715"
                    opacity={0.92}
                  />
                  <text
                    x={cx}
                    y={cy - size - 30}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="700"
                    fill="white"
                    fontFamily="system-ui, sans-serif"
                  >
                    {kw.keyword}
                  </text>
                  <text
                    x={cx}
                    y={cy - size - 16}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#D1C9C0"
                    fontFamily="system-ui, sans-serif"
                  >
                    {kw.delta >= 0 ? "+" : ""}{kw.delta}% · score {(kw.score * 100).toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex items-center gap-3 text-[10px] text-[#8A8278]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FEF3C7] border border-[#D97706]" />
          Surging
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EBF6EF] border border-[#2D6A4F]" />
          Rising
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FEE2E2] border border-[#9B1C1C]" />
          Fading
        </span>
      </div>
    </div>
  );
}
