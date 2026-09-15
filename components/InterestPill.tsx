"use client";

import React from "react";
import { Check, Plus } from "lucide-react";

interface InterestPillProps {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  keywordsCount?: number;
}

export function InterestPill({ label, selected, onToggle, keywordsCount }: InterestPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3.5 py-2 rounded-full text-xs font-medium border flex items-center space-x-2 transition-colors select-none cursor-pointer ${
        selected
          ? "bg-[#181715] text-white border-[#181715] shadow-sm"
          : "bg-white text-[#4A453E] border-[#E2DDD5] hover:border-[#BFB7AA] hover:bg-[#FAF8F5]"
      }`}
    >
      {selected ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-[#8A8378]" />}
      <span>{label}</span>
      {keywordsCount !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selected ? "bg-white/20 text-white" : "bg-[#F0ECE4] text-[#7A746B]"}`}>
          {keywordsCount}
        </span>
      )}
    </button>
  );
}
