"use client";

import React, { useState } from "react";
import { Sparkles, User, Copy, Check, ExternalLink } from "lucide-react";
import type { ChatCitation } from "@/lib/chat";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  citations?: ChatCitation[];
  createdAt?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  citations = [],
  createdAt,
  isStreaming = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const isAssistant = role === "assistant";
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;

  // Simple Markdown Parser for clean rendering of AI responses
  const renderFormattedContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Headings
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-semibold text-base text-[#181715] mt-3 mb-1 font-editorial">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-bold text-lg text-[#181715] mt-3.5 mb-1.5 font-editorial">
            {line.replace("## ", "")}
          </h3>
        );
      }
      // Blockquotes
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-amber-500/60 pl-3 py-1 my-2 bg-amber-50/50 rounded-r text-xs text-[#524E48] italic"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      }
      // Unordered lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-[#2E2C29] leading-relaxed my-0.5">
            {renderInlineMarkdown(line.slice(2))}
          </li>
        );
      }
      // Numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 text-sm text-[#2E2C29] leading-relaxed my-1">
            <span className="font-mono text-xs font-bold text-amber-600 shrink-0 mt-0.5">
              {numberedMatch[1]}.
            </span>
            <span>{renderInlineMarkdown(numberedMatch[2])}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="text-sm text-[#2E2C29] leading-relaxed my-1">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (line: string) => {
    // Bold parsing: **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#181715]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div
      className={`flex gap-3 my-3 transition-opacity ${
        isAssistant ? "items-start" : "items-start flex-row-reverse"
      }`}
    >
      {/* Avatar / Icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
          isAssistant
            ? "bg-[#181715] text-amber-400"
            : "bg-[#E8E4DC] text-[#524E48]"
        }`}
      >
        {isAssistant ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      </div>

      {/* Message Body */}
      <div
        className={`max-w-[85%] rounded-2xl p-4 text-sm transition-all ${
          isAssistant
            ? "bg-white border border-[#E8E4DC] shadow-xs text-[#2E2C29]"
            : "bg-[#181715] text-white shadow-xs rounded-tr-xs"
        }`}
      >
        {/* Header (Role & Time) */}
        <div
          className={`flex items-center justify-between gap-2 mb-1.5 text-xs ${
            isAssistant ? "text-[#7A746B]" : "text-stone-300"
          }`}
        >
          <span className="font-medium tracking-tight">
            {isAssistant ? "Vantage Intelligence" : "You"}
          </span>
          {formattedTime && <span className="text-[11px] opacity-75">{formattedTime}</span>}
        </div>

        {/* Content */}
        <div className="space-y-1">
          {isAssistant ? (
            renderFormattedContent(content)
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          )}

          {isStreaming && (
            <div className="flex items-center gap-1.5 py-1 text-xs text-amber-600 animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>Synthesizing response...</span>
            </div>
          )}
        </div>

        {/* Citations Footer */}
        {citations.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#E8E4DC]/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A746B]">
              Grounding Sources
            </div>
            <div className="flex flex-wrap gap-1.5">
              {citations.map((cite, idx) => (
                <a
                  key={idx}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F0EA] text-[#524E48] hover:bg-[#E8E4DC] hover:text-[#181715] transition-colors border border-[#E8E4DC]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{cite.title}</span>
                  <span className="text-[10px] text-[#7A746B]">({cite.source})</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Assistant Actions Toolbar */}
        {isAssistant && (
          <div className="mt-2.5 pt-1.5 flex items-center justify-end gap-2 border-t border-[#F3F0EA]">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] rounded transition-colors"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
