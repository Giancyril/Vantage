"use client";

import React, { useRef, useState, useCallback } from "react";
import type { TopicWeightPoint } from "@/lib/analytics";

interface TopicWeightChartProps {
  data: TopicWeightPoint[];
  height?: number;
}

const TOPIC_COLORS = [
  "#C35824", "#2D6A4F", "#2B4C8C", "#7B2D8B", "#B45309",
  "#0E7490", "#92400E", "#065F46", "#1E3A5F", "#6B21A8",
];

type Range = "7d" | "14d" | "30d";

// Layout constants
const W = 680;
const padL = 36;
const padR = 12;
const padT = 12;
const padB = 24;

export function TopicWeightChart({ data, height = 220 }: TopicWeightChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [range, setRange] = useState<Range>("30d");
  const [crosshair, setCrosshair] = useState<number | null>(null);
  const [hiddenTopics, setHiddenTopics] = useState<Set<string>>(new Set());

  // Filter by range
  const rangeDays: Record<Range, number> = { "7d": 7, "14d": 14, "30d": 30 };
  const filteredData = data.slice(-rangeDays[range]);

  // All topics
  const allTopics = filteredData.length > 0
    ? Object.keys(filteredData[0].weights)
    : [];

  const visibleTopics = allTopics.filter((t) => !hiddenTopics.has(t));

  const toggleTopic = (topic: string) => {
    setHiddenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const innerW = W - padL - padR;
  const innerH = height - padT - padB;

  // useCallback must be called unconditionally (above any early returns)
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaledInnerW = innerW * (rect.width / W);
    const xRatio = (e.clientX - rect.left - padL * (rect.width / W)) / scaledInnerW;
    const dataLen = filteredData.length;
    const idx = Math.round(xRatio * (dataLen - 1));
    setCrosshair(Math.max(0, Math.min(dataLen - 1, idx)));
  }, [filteredData.length, innerW]);

  if (!filteredData || filteredData.length < 2 || allTopics.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[#8A8278]">
        No weight history yet &mdash; interact with articles to build your trajectory.
      </div>
    );
  }

  // Y axis: always 0-1
  const toY = (v: number) => padT + (1 - v) * innerH;
  const toX = (i: number) => padL + (i / (filteredData.length - 1)) * innerW;

  const crosshairPoint = crosshair !== null ? filteredData[crosshair] : null;
  const crosshairX = crosshair !== null ? toX(crosshair) : null;

  return (
    <div className="w-full">
      {/* Range selector */}
      <div className="flex items-center justify-end gap-1 mb-3">
        {(["7d", "14d", "30d"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
              range === r
                ? "bg-[#181715] text-white border-[#181715]"
                : "bg-transparent text-[#8A8278] border-[#E9E5DE] hover:border-[#181715] hover:text-[#181715]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* SVG chart */}
      <div className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${height}`}
          className="w-full"
          style={{ height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCrosshair(null)}
        >
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line
                x1={padL}
                y1={toY(v)}
                x2={W - padR}
                y2={toY(v)}
                stroke="#E9E5DE"
                strokeWidth={0.8}
                strokeDasharray="4 3"
              />
              <text
                x={padL - 4}
                y={toY(v) + 3.5}
                textAnchor="end"
                fontSize={8}
                fill="#A09890"
                fontFamily="system-ui"
              >
                {v.toFixed(2)}
              </text>
            </g>
          ))}

          {/* X-axis labels (every ~5 days) */}
          {filteredData.map((point, i) => {
            if (i % Math.ceil(filteredData.length / 6) !== 0 && i !== filteredData.length - 1) return null;
            return (
              <text
                key={i}
                x={toX(i)}
                y={height - 6}
                textAnchor="middle"
                fontSize={8}
                fill="#A09890"
                fontFamily="system-ui"
              >
                {point.date.slice(5)}
              </text>
            );
          })}

          {/* Topic lines */}
          {visibleTopics.map((topic, ti) => {
            const color = TOPIC_COLORS[allTopics.indexOf(topic) % TOPIC_COLORS.length];
            const pts = filteredData
              .map((d, i) => `${toX(i)},${toY(d.weights[topic] ?? 0)}`)
              .join(" ");

            // Shaded area under highest-weight topic
            const isFirst = ti === 0;
            const areaD = filteredData
              .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d.weights[topic] ?? 0)}`)
              .join(" ") +
              ` L ${toX(filteredData.length - 1)},${toY(0)} L ${toX(0)},${toY(0)} Z`;

            return (
              <g key={topic}>
                {isFirst && (
                  <path d={areaD} fill={color} opacity={0.06} />
                )}
                <polyline
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Crosshair */}
          {crosshairX !== null && crosshairPoint && (
            <g>
              <line
                x1={crosshairX}
                y1={padT}
                x2={crosshairX}
                y2={height - padB}
                stroke="#181715"
                strokeWidth={0.8}
                strokeDasharray="3 2"
                opacity={0.4}
              />
              {/* Tooltip box */}
              <rect
                x={Math.min(crosshairX + 6, W - 110)}
                y={padT + 4}
                width={104}
                height={14 + visibleTopics.length * 12}
                rx={5}
                fill="#181715"
                opacity={0.88}
              />
              <text
                x={Math.min(crosshairX + 58, W - 58)}
                y={padT + 15}
                textAnchor="middle"
                fontSize={8.5}
                fill="#D1C9C0"
                fontFamily="system-ui"
              >
                {crosshairPoint.date}
              </text>
              {visibleTopics.map((topic, ti) => {
                const color = TOPIC_COLORS[allTopics.indexOf(topic) % TOPIC_COLORS.length];
                const v = crosshairPoint.weights[topic] ?? 0;
                return (
                  <text
                    key={topic}
                    x={Math.min(crosshairX + 58, W - 58)}
                    y={padT + 26 + ti * 12}
                    textAnchor="middle"
                    fontSize={8}
                    fill={color}
                    fontFamily="system-ui"
                  >
                    {topic.slice(0, 18)}: {v.toFixed(2)}
                  </text>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {allTopics.map((topic, ti) => {
          const color = TOPIC_COLORS[ti % TOPIC_COLORS.length];
          const hidden = hiddenTopics.has(topic);
          return (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                hidden
                  ? "opacity-35 border-[#E9E5DE] text-[#8A8278]"
                  : "border-transparent text-[#181715] hover:opacity-80"
              }`}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: hidden ? "#C8C3BB" : color }}
              />
              {topic.length > 22 ? topic.slice(0, 20) + "..." : topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}