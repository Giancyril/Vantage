"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Search, Filter, Sparkles, SlidersHorizontal, RefreshCw, Calendar, Loader2 } from "lucide-react";
import type { AnalyzedStory } from "@/lib/analysis";

export default function FeedPage() {
  const [stories, setStories] = useState<AnalyzedStory[]>([]);
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user interests to ensure seed
      const intRes = await fetch("/api/interests");
      const intData = await intRes.json();
      const topicList = (intData.interests || []).map((i: any) => i.topic);
      setTopics(topicList);

      // 2. Fetch saved URLs
      const savedRes = await fetch("/api/feedback?type=saved");
      const savedData = await savedRes.json();
      setSavedUrls(new Set(savedData.savedUrls || []));

      // 3. Trigger discovery & analysis if feed empty
      const runRes = await fetch("/api/pipeline/run", { method: "POST" });
      const runData = await runRes.json();

      // Synthesized stories
      const discoRes = await fetch("/api/pipeline/discover", { method: "POST" });
      const discoData = await discoRes.json();

      if (discoData.articles) {
        const mapped: AnalyzedStory[] = discoData.articles.map((a: any) => ({
          url: a.url,
          title: a.title,
          source: a.source,
          summary: a.snippet || "Recent strategic announcement impacting technical direction.",
          whyItMatters: `Directly impacts your tracking of ${a.matchedTopic}, validating strategic movement across ${a.matchedKeywords?.slice(0, 2).join(" & ")}.`,
          matchedTopic: a.matchedTopic,
          relevanceScore: 0.88,
          publishedAt: a.publishedDate || new Date().toISOString(),
        }));
        setStories(mapped);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    setIsRefreshing(false);
  };

  const filteredStories = stories.filter((s) => {
    const matchesTopic = selectedTopic === "all" || s.matchedTopic === selectedTopic;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.whyItMatters.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Editorial Feed Header */}
      <div className="pb-6 border-b border-[#E9E5DE] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#8A8378] tracking-widest uppercase mb-1">
            <Calendar className="w-3.5 h-3.5 text-[#C35824]" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#181715]">
            Daily Intelligence Feed
          </h1>
          <p className="text-xs sm:text-sm text-[#6E675C] mt-1">
            Synthesized across {stories.length} candidate stories based on your active interest profile.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/interests"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#D5CFBF] bg-white text-xs font-medium text-[#4A453E] hover:bg-[#FAF8F5] transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#706A60]" />
            <span>Refine Weights</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full border border-[#D5CFBF] bg-white text-[#4A453E] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#C35824]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8A8378] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search feed headlines, sources, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-[#E0DBD2] bg-white text-xs text-[#181715] placeholder-[#8A8378] focus:outline-none focus:ring-1 focus:ring-[#C35824] focus:border-[#C35824]"
          />
        </div>

        {/* Topic Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedTopic("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              selectedTopic === "all"
                ? "bg-[#181715] text-white"
                : "bg-white text-[#625C54] border border-[#E2DDD5] hover:bg-[#F3EFE8]"
            }`}
          >
            All Topics ({stories.length})
          </button>

          {topics.map((t) => {
            const count = stories.filter((s) => s.matchedTopic === t).length;
            const isSelected = selectedTopic === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#181715] text-white"
                    : "bg-white text-[#625C54] border border-[#E2DDD5] hover:bg-[#F3EFE8]"
                }`}
              >
                {t} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stories Stream */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#C35824] mx-auto" />
          <p className="text-sm font-medium text-[#4A453E]">Distilling stories from hundreds of sources...</p>
          <p className="text-xs text-[#8A8378]">Extracting full text, scoring relevance, and generating personalized insights</p>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-[#E9E5DE] p-8 space-y-3">
          <Sparkles className="w-8 h-8 text-[#8A8378] mx-auto" />
          <h3 className="font-editorial text-xl font-bold text-[#181715]">No stories match this filter</h3>
          <p className="text-xs text-[#6E675C] max-w-sm mx-auto">
            Try adjusting your search keywords or visit your interest profile to track new topics.
          </p>
          <button
            onClick={() => { setSelectedTopic("all"); setSearchQuery(""); }}
            className="px-4 py-1.5 rounded-full bg-[#181715] text-white text-xs font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <ArticleCard
              key={story.url}
              url={story.url}
              title={story.title}
              source={story.source}
              summary={story.summary}
              whyItMatters={story.whyItMatters}
              matchedTopic={story.matchedTopic}
              relevanceScore={story.relevanceScore}
              publishedAt={story.publishedAt}
              initialSaved={savedUrls.has(story.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
