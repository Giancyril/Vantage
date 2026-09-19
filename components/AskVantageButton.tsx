"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import type { ChatContext } from "@/lib/chat";
import { ChatDrawer } from "@/components/ChatDrawer";

export interface AskVantageButtonProps {
  /** Mode: "floating" (fixed bottom-right action) or "inline" (button to embed inside cards or headers) */
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
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      setIsOpen(true);
    }
  };

  if (variant === "inline") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] text-[#181715] hover:bg-[#181715] hover:text-white border border-[#E8E4DC] hover:border-[#181715] transition-all shadow-2xs group ${className}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300 transition-colors" />
          <span>{label || "Ask Vantage"}</span>
        </button>

        {!onClick && (
          <ChatDrawer
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            context={context}
            initialMessage={initialMessage}
          />
        )}
      </>
    );
  }

  if (variant === "pill") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#181715] text-white hover:bg-black transition-all shadow-xs group ${className}`}
        >
          <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>{label || "Ask Vantage"}</span>
        </button>

        {!onClick && (
          <ChatDrawer
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            context={context}
            initialMessage={initialMessage}
          />
        )}
      </>
    );
  }

  // Floating variant (default)
  return (
    <>
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#181715] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 border border-stone-800 transition-all group"
          aria-label="Ask Vantage AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            {label || "Ask Vantage"}
          </span>
        </button>
      </div>

      {!onClick && (
        <ChatDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          context={context}
          initialMessage={initialMessage}
        />
      )}
    </>
  );
}
