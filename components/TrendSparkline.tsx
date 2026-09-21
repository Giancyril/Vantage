"use client";

import React, { useRef, useState } from "react";

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface TrendSparklineProps {
  data: SparklinePoint[];
  color?: string;
  width?: number;
  height?: number;
  label?: string;
}

export function TrendSparkline({
  data,
  color = "#C35824",
  width = 120,
  height = 36,
}: TrendSparklineProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#E9E5DE" strokeWidth={1.5} />
      </svg>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const pad = 2;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + ((1 - (d.value - minVal) / range) * (height - pad * 2));
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Trend color
  const first = values[0];
  const last = values[values.length - 1];
  const lineColor = last > first * 1.05 ? "#2D6A4F" : last < first * 0.95 ? "#9B1C1C" : color;

  // Area fill path
  const areaPath = `M ${points[0].x},${height} L ${polylinePoints.split(" ").map(p => p).join(" L ")} L ${points[points.length - 1].x},${height} Z`;

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#sg-${color.replace("#","")})`} />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="white"
            stroke={lineColor}
            strokeWidth={1.5}
            className="opacity-0 hover:opacity-100 transition-opacity cursor-crosshair"
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, date: p.date, value: p.value })}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 bg-[#181715] text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 32,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold">{tooltip.value.toFixed(2)}</div>
          <div className="opacity-60">{tooltip.date}</div>
        </div>
      )}
    </div>
  );
}
