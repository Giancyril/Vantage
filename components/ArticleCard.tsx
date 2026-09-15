"use client";

import React, { useState } from "react";
import { ExternalLink, Bookmark, ThumbsUp, ThumbsDown, Check, Sparkles } from "lucide-react";
import { WhyItMatters } from "@/components/WhyItMatters";

export interface ArticleCardProps {
  url: string;
  title: string;
  source: string;
  summary: string;
  whyItMatters: string;
  matchedTopic: string;
  relevanceScore: number;
  publishedAt?: string;
  initialSaved?: boolean;
}

export function ArticleCard({
  url,
  title,
  source,
  summary,
  whyItMatters,
  matchedTopic,
  relevanceScore,
  publishedAt,
  initialSaved = false,
}: ArticleCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveToggle = async () => {
    const next = !isSaved;
    setIsSaved(next);
    showToast(next ? "Saved to reading list" : "Removed from saved");

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: url,
          eventType: next ? "save" : "dismiss",
          topic: matchedTopic,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedback = async (type: "up" | "down") => {
    if (feedback === type) return;
    setFeedback(type);
    showToast(type === "up" ? "More stories like this" : "Fewer stories like this");

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleUrl: url,
          eventType: type === "up" ? "more_like_this" : "less_like_this",
          topic: matchedTopic,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const relevancePct = Math.round(relevanceScore * 100);

  return (
    <article className="group bg-white rounded-xl border border-[#E9E5DE] p-5 sm:p-6 transition-all hover:border-[#D5CFC5] hover:shadow-sm relative">
      {/* Top Meta */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[#8A8378] text-[11px]">
            {source}
          </span>
          <span className="text-[#D0CAC0]">&bull;</span>
          <span className="text-[11px] text-[#8A8378]">
            {matchedTopic}
          </span>
        </div>

        {/* Relevance badge */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#F3F0EA] text-[#555048] text-[11px] font-medium">
          <Sparkles className="w-3 h-3 text-[#C35824]" />
          <span>{relevancePct}% Match</span>
        </div>
      </div>

      {/* Headline */}
      <h3 className="font-editorial text-xl sm:text-2xl font-bold leading-snug text-[#181715] mb-2.5 group-hover:text-[#C35824] transition-colors">
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1.5">
          <span>{title}</span>
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[#8A8378]" />
        </a>
      </h3>

      {/* Summary */}
      <p className="text-sm leading-relaxed text-[#4A453E] font-normal">
        {summary}
      </p>

      {/* Personalized Why It Matters */}
      <WhyItMatters topic={matchedTopic} explanation={whyItMatters} />

      {/* Bottom Actions Bar */}
      <div className="mt-4 pt-3.5 border-t border-[#F2EEE8] flex items-center justify-between text-xs text-[#7A746B]">
        <div className="flex items-center space-x-1">
          <span className="text-[11px] mr-2 text-[#9A9388]">Teach Agent:</span>
          <button
            onClick={() => handleFeedback("up")}
            title="More stories like this"
            className={`p-1.5 rounded-md hover:bg-[#F3EFE8] transition-colors cursor-pointer ${
              feedback === "up" ? "text-[#2C6E49] bg-[#EAF4EE]" : "text-[#7A746B]"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("down")}
            title="Fewer stories like this"
            className={`p-1.5 rounded-md hover:bg-[#F3EFE8] transition-colors cursor-pointer ${
              feedback === "down" ? "text-[#9E2A2B] bg-[#FBECEC]" : "text-[#7A746B]"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {toastMsg && (
            <span className="text-[11px] text-[#2C6E49] font-medium animate-pulse-subtle">
              {toastMsg}
            </span>
          )}
          <button
            onClick={handleSaveToggle}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors select-none cursor-pointer ${
              isSaved
                ? "bg-[#181715] text-white"
                : "bg-[#F3EFE8] text-[#555048] hover:bg-[#EAE4DC]"
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{isSaved ? "Saved" : "Save for Later"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
