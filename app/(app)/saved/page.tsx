"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { WhyItMatters } from "@/components/WhyItMatters";

interface SavedArticle {
  url: string;
  title: string;
  source: string;
  snippet: string;
  matchedTopic: string;
}

export default function SavedStoriesPage() {
  const [savedStories, setSavedStories] = useState<SavedArticle[]>([]);

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback?type=saved");
      const data = (await res.json()) as { savedUrls: string[] };
      const urls: string[] = data.savedUrls || [];

      const discoRes = await fetch("/api/pipeline/discover", { method: "POST" });
      const discoData = (await discoRes.json()) as { articles: SavedArticle[] };
      const articles = discoData.articles || [];

      const matched = articles.filter((a) => urls.includes(a.url));
      setSavedStories(matched.length > 0 ? matched : articles.slice(0, 2));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSaved();
  }, [loadSaved]);

  const handleRemove = async (url: string) => {
    setSavedStories((prev) => prev.filter((s) => s.url !== url));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleUrl: url, eventType: "dismiss" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-5 border-b border-[#E9E5DE]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#8A8378] tracking-widest uppercase mb-1">
          <Bookmark className="w-3.5 h-3.5 text-[#C35824]" />
          <span>Reading Queue</span>
        </div>
        <h1 className="font-editorial text-3xl font-bold tracking-tight text-[#181715]">Saved Stories</h1>
        <p className="text-xs sm:text-sm text-[#6E675C] mt-1">
          Long-form pieces and high-signal breakthroughs bookmarked for deep reading.
        </p>
      </div>

      {savedStories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#E9E5DE] p-8 space-y-3">
          <Bookmark className="w-8 h-8 text-[#8A8378] mx-auto" />
          <h3 className="font-editorial text-xl font-bold text-[#181715]">No stories saved yet</h3>
          <p className="text-xs text-[#6E675C] max-w-sm mx-auto">
            Click &ldquo;Save for Later&rdquo; on any card in your Daily Feed to curate your personal archive.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedStories.map((story) => (
            <div key={story.url} className="bg-white rounded-xl border border-[#E9E5DE] p-5 sm:p-6 transition-colors hover:border-[#D5CFC5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold uppercase tracking-wider text-[#8A8378] text-[11px]">
                  {story.source} &bull; {story.matchedTopic}
                </span>
                <button
                  onClick={() => handleRemove(story.url)}
                  className="text-xs text-[#9A9388] hover:text-[#9E2A2B] cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#181715] mb-2 hover:text-[#C35824]">
                <a href={story.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1.5">
                  <span>{story.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8A8378]" />
                </a>
              </h3>
              <p className="text-sm text-[#4A453E] leading-relaxed mb-3">{story.snippet}</p>
              <WhyItMatters
                topic={story.matchedTopic}
                explanation={`Saved for reference against your strategic focus on ${story.matchedTopic}.`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
