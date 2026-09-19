"use client";

import React from "react";
import type { ChatContext } from "@/lib/chat";
import { useChat } from "@/components/ChatProvider";

export interface AskVantageButtonProps {
  /** Mode: "floating" (fixed bottom-right action), "inline" (embedded in cards), or "pill" (in nav) */
  variant?: "floating" | "inline" | "pill";
  context?: ChatContext;
  label?: string;
  className?: string;
  initialMessage?: string;
  onClick?: () => void;
}

export function AskVantageButton({
  variant = "floating",
  context = { mode: "general" },
  label,
  className = "",
  initialMessage,
  onClick,
}: AskVantageButtonProps) {
  const { openChat } = useChat();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      openChat(context, initialMessage);
    }
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] text-[#181715] hover:bg-[#181715] hover:text-white border border-[#E8E4DC] hover:border-[#181715] transition-all shadow-2xs group cursor-pointer ${className}`}
      >

        <span>{label || "Ask Vantage"}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#181715] text-white hover:bg-black transition-all shadow-xs group cursor-pointer ${className}`}
      >

        <span>{label || "Ask Vantage"}</span>
      </button>
    );
  }

  // Floating variant (default)
  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#181715] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 border border-stone-800 transition-all group cursor-pointer"
        aria-label="Ask Vantage AI Assistant"
      >

        <span className="text-xs font-semibold tracking-wide">
          {label || "Ask Vantage"}
        </span>
      </button>
    </div>
  );
}
