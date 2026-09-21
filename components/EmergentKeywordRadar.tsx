"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { EmergentKeyword } from "@/lib/analytics";

interface EmergentKeywordRadarProps {
  keywords: EmergentKeyword[];
}

interface PositionedBubble {
  keyword: EmergentKeyword;
  cx: number;
  cy: number;
  size: number;
  isSurging: boolean;
  isRising: boolean;
  isFading: boolean;
  fill: string;
  stroke: string;
  textColor: string;
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
  const cxCenter = W / 2;
  const cyCenter = H / 2;

  // Compute collision-free bubble positions using repulsion physics
  const bubbles = useMemo<PositionedBubble[]>(() => {
    if (!keywords || keywords.length === 0) return [];

    const items = keywords.slice(0, 10);
    const maxScore = Math.max(...items.map((k) => k.score), 0.01);

    // 1. Initial radial placement spread out by angle and distance
    const nodes = items.map((kw, i) => {
      // Size between 22px and 35px radius (diameter 44px - 70px)
      const size = Math.max(22, Math.min(35, 22 + (kw.score / maxScore) * 13));

      // Golden ratio angle dispersion to prevent radial alignment
      const angle = (i * 2.39996) + 0.3;
      // Elliptical radius spread (wide cards need wider horizontal spread)
      const rDist = 65 + (i % 3) * 45;
      const x = cxCenter + rDist * Math.cos(angle) * 1.35;
      const y = cyCenter + rDist * Math.sin(angle) * 0.85;

      const isSurging = kw.delta > 25;
      const isFading = kw.delta < 0;
      const isRising = !isSurging && !isFading;

      const fill = isSurging
        ? "#FEF3C7"
        : isRising
        ? "#ECFDF5"
        : "#FEF2F2";

      const stroke = isSurging
        ? "#D97706"
        : isRising
        ? "#059669"
        : "#E11D48";

      const textColor = isSurging
        ? "#92400E"
        : isRising
        ? "#065F46"
        : "#9F1239";

      return {
        keyword: kw,
        cx: x,
        cy: y,
        size,
        isSurging,
        isRising,
        isFading,
        fill,
        stroke,
        textColor,
      };
    });

    // 2. Iterative repulsion relaxation loop to eliminate ALL overlaps
    for (let iter = 0; iter < 45; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].cx - nodes[i].cx;
          const dy = nodes[j].cy - nodes[i].cy;
          const dist = Math.hypot(dx, dy);
          const minRequiredDist = nodes[i].size + nodes[j].size + 8; // 8px buffer

          if (dist < minRequiredDist && dist > 0.01) {
            const overlap = (minRequiredDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            nodes[i].cx -= nx * overlap;
            nodes[i].cy -= ny * overlap;
            nodes[j].cx += nx * overlap;
            nodes[j].cy += ny * overlap;
          }
        }

        // Keep inside canvas bounds with margin
        const r = nodes[i].size;
        nodes[i].cx = Math.max(r + 16, Math.min(W - r - 16, nodes[i].cx));
        nodes[i].cy = Math.max(r + 16, Math.min(H - r - 30, nodes[i].cy));
      }
    }

    return nodes;
  }, [keywords, cxCenter, cyCenter]);

  if (!keywords || keywords.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[#8A8278]">
        No trend data yet — run the pipeline to generate keywords.
      </div>
    );
  }

  const activeHoveredBubble = bubbles.find((b) => b.keyword.keyword === hovered);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: H }}>
      {/* Radial guide grid */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {[0.3, 0.6, 0.88].map((r) => (
          <ellipse
            key={r}
            cx={cxCenter}
            cy={cyCenter}
            rx={(W / 2 - 25) * r}
            ry={(H / 2 - 25) * r}
            fill="none"
            stroke="#E9E5DE"
            strokeWidth={0.8}
            strokeDasharray="4 4"
          />
        ))}

        {/* Crosshair guidelines */}
        <line
          x1={cxCenter}
          y1={15}
          x2={cxCenter}
          y2={H - 35}
          stroke="#EAE6DF"
          strokeWidth={0.6}
          strokeDasharray="2 2"
        />
        <line
          x1={25}
          y1={cyCenter}
          x2={W - 25}
          y2={cyCenter}
          stroke="#EAE6DF"
          strokeWidth={0.6}
          strokeDasharray="2 2"
        />

        {/* Center hub */}
        <circle cx={cxCenter} cy={cyCenter} r={3} fill="#C5BEB3" />
      </svg>

      {/* Keyword bubbles layer */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {bubbles.map((b, i) => {
          const isHovered = hovered === b.keyword.keyword;
          const words = b.keyword.keyword.split(" ");
          const hasTwoLines = words.length >= 2 && b.keyword.keyword.length > 9;

          return (
            <g
              key={b.keyword.keyword}
              style={{
                transform: mounted ? "scale(1)" : "scale(0)",
                transformOrigin: `${b.cx}px ${b.cy}px`,
                transition: `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 35}ms`,
              }}
              onMouseEnter={() => setHovered(b.keyword.keyword)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              {/* Pulse animation beacon for surging keywords */}
              {b.isSurging && (
                <circle
                  cx={b.cx}
                  cy={b.cy}
                  r={b.size + 4}
                  fill="none"
                  stroke={b.stroke}
                  strokeWidth={1}
                  opacity={0.3}
                  className="animate-ping"
                  style={{ animationDuration: "2.8s" }}
                />
              )}

              {/* Main bubble circle */}
              <circle
                cx={b.cx}
                cy={b.cy}
                r={isHovered ? b.size + 3 : b.size}
                fill={b.fill}
                stroke={b.stroke}
                strokeWidth={isHovered ? 2 : 1.2}
                style={{
                  transition: "r 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease",
                  filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" : "none",
                }}
              />

              {/* Keyword text inside bubble with smart multi-line wrapping */}
              {hasTwoLines ? (
                <text
                  x={b.cx}
                  y={b.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.max(8.5, Math.min(10.5, b.size * 0.34))}
                  fontWeight="600"
                  fill={b.textColor}
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  <tspan x={b.cx} dy="-0.55em">
                    {words[0]}
                  </tspan>
                  <tspan x={b.cx} dy="1.15em">
                    {words.slice(1).join(" ").slice(0, 10)}
                  </tspan>
                </text>
              ) : (
                <text
                  x={b.cx}
                  y={b.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.max(9, Math.min(11, b.size * 0.38))}
                  fontWeight="600"
                  fill={b.textColor}
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {b.keyword.keyword.length > 11
                    ? b.keyword.keyword.slice(0, 10) + "…"
                    : b.keyword.keyword}
                </text>
              )}
            </g>
          );
        })}

        {/* Top-layer hover tooltip to prevent any clipping from neighboring bubbles */}
        {activeHoveredBubble && (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={Math.max(10, Math.min(W - 140, activeHoveredBubble.cx - 65))}
              y={Math.max(10, activeHoveredBubble.cy - activeHoveredBubble.size - 44)}
              width={130}
              height={38}
              rx={7}
              fill="#181715"
              opacity={0.94}
            />
            <text
              x={Math.max(10, Math.min(W - 140, activeHoveredBubble.cx - 65)) + 65}
              y={Math.max(10, activeHoveredBubble.cy - activeHoveredBubble.size - 44) + 16}
              textAnchor="middle"
              fontSize={10}
              fontWeight="700"
              fill="#FAF8F5"
              fontFamily="system-ui, sans-serif"
            >
              {activeHoveredBubble.keyword.keyword}
            </text>
            <text
              x={Math.max(10, Math.min(W - 140, activeHoveredBubble.cx - 65)) + 65}
              y={Math.max(10, activeHoveredBubble.cy - activeHoveredBubble.size - 44) + 29}
              textAnchor="middle"
              fontSize={9}
              fill="#C5BEB3"
              fontFamily="system-ui, sans-serif"
            >
              {activeHoveredBubble.keyword.delta >= 0 ? "+" : ""}
              {activeHoveredBubble.keyword.delta}% momentum • {activeHoveredBubble.keyword.currentCount} read
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-4 text-[10px] text-[#8A8278]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FEF3C7] border border-[#D97706]" />
          Surging (&gt;+25%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ECFDF5] border border-[#059669]" />
          Rising (0–25%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FEF2F2] border border-[#E11D48]" />
          Fading (&lt;0%)
        </span>
      </div>
    </div>
  );
}
