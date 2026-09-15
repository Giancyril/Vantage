"use client";

import React from "react";
import { Compass } from "lucide-react";

interface WhyItMattersProps {
  topic: string;
  explanation: string;
}

export function WhyItMatters({ topic, explanation }: WhyItMattersProps) {
  return (
    <div className="mt-3.5 p-3.5 rounded-r-md rounded-l-none bg-[#FEF9F5] border-l-4 border-[#C35824] border-t border-r border-b border-[#F0E4D8]">
      <div className="flex items-center space-x-1.5 mb-1.5">
        <Compass className="w-3.5 h-3.5 text-[#C35824]" />
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#C35824]">
          Why this matters to you &bull; {topic}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[#2D2A26] font-normal">
        {explanation}
      </p>
    </div>
  );
}
