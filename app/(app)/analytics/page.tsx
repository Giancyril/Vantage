"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/StatCard";
import { TopicWeightChart } from "@/components/TopicWeightChart";
import { EmergentKeywordRadar } from "@/components/EmergentKeywordRadar";
import { KnowledgeDepthBar } from "@/components/KnowledgeDepthBar";
import { ExportAnalyticsButton } from "@/components/ExportAnalyticsButton";
import {
  Zap, BookOpen, Brain, BarChart2, Loader2, RefreshCw, AlertTriangle,
} from "lucide-react";
import type { AnalyticsDashboard } from "@/lib/analytics";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#EAE6DF] rounded-xl ${className}`} />
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshotting, setSnapshotting] = useState(false);
  const [snapshotDone, setSnapshotDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics?days=30");
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError("Failed to load analytics.");
    } catch {
      setError("Network error loading analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSnapshot = async () => {
    setSnapshotting(true);
    try {
      await fetch("/api/analytics/snapshot", { method: "POST" });
      setSnapshotDone(true);
      setTimeout(() => setSnapshotDone(false), 3000);
      await load();
    } finally {
      setSnapshotting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-editorial text-2xl font-bold text-[#181715] tracking-tight">
            Intelligence Analytics
          </h1>
          <p className="mt-1 text-sm text-[#8A8278]">
            Quantify your reading velocity, topic momentum, and knowledge depth.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSnapshot}
            disabled={snapshotting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[#E9E5DE] text-[#625C54] hover:border-[#181715] hover:text-[#181715] transition-colors disabled:opacity-50"
          >
            {snapshotting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            {snapshotDone ? "Saved!" : "Snapshot Today"}
          </button>
          {data && <ExportAnalyticsButton data={data} />}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#9B1C1C] bg-[#FEE2E2] px-4 py-3 rounded-lg border border-[#FCA5A5]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-28" />)
        ) : data ? (
          <>
            <StatCard
              label="Reading Velocity"
              value={data.velocity.today}
              subLabel={`${data.velocity.weeklyAvg} avg / day (7-day)`}
              trend={data.velocity.trend}
              trendLabel={data.velocity.trend === "up" ? "Accelerating" : data.velocity.trend === "down" ? "Slowing" : "Steady"}
              variant="velocity"
              icon={<Zap className="w-4 h-4" />}
            />
            <StatCard
              label="Articles Saved"
              value={data.savedCount}
              subLabel="Saved in the last 30 days"
              variant="depth"
              icon={<BookOpen className="w-4 h-4" />}
            />
            <StatCard
              label="Avg Knowledge Depth"
              value={
                data.knowledgeDepth.length > 0
                  ? `${Math.round((data.knowledgeDepth.reduce((s, d) => s + d.depth, 0) / data.knowledgeDepth.length) * 100)}%`
                  : "—"
              }
              subLabel="Composite engagement score"
              variant="breadth"
              icon={<Brain className="w-4 h-4" />}
            />
            <StatCard
              label="Active Topics"
              value={`${data.activeTopics} / ${data.knowledgeDepth.length}`}
              subLabel="Topics with recent engagement"
              variant={data.knowledgeDepth.some((d) => d.gap) ? "gap" : "default"}
              icon={<BarChart2 className="w-4 h-4" />}
            />
          </>
        ) : null}
      </div>

      {/* Row 2: Topic Weight Chart */}
      <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#181715]">Topic Weight Trajectory</h2>
            <p className="text-xs text-[#8A8278] mt-0.5">
              30-day interest weight evolution across all tracked topics
            </p>
          </div>
        </div>
        {loading ? (
          <SkeletonBlock className="h-52" />
        ) : data ? (
          <TopicWeightChart data={data.topicWeightHistory} height={220} />
        ) : null}
      </div>

      {/* Row 3: Radar + Depth Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend Radar */}
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#181715]">Trend Radar</h2>
            <p className="text-xs text-[#8A8278] mt-0.5">
              Emergent keywords by frequency surge this week vs last week
            </p>
          </div>
          {loading ? (
            <SkeletonBlock className="h-64" />
          ) : data ? (
            <EmergentKeywordRadar keywords={data.emergentKeywords} />
          ) : null}
        </div>

        {/* Knowledge Depth */}
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 shadow-xs">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#181715]">Knowledge Depth by Topic</h2>
              <p className="text-xs text-[#8A8278] mt-0.5">
                Engagement depth vs tracking weight — gaps flagged in amber
              </p>
            </div>
            {data && data.knowledgeDepth.some((d) => d.gap) && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {data.knowledgeDepth.filter((d) => d.gap).length} gap{data.knowledgeDepth.filter((d) => d.gap).length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {loading ? (
            <SkeletonBlock className="h-64" />
          ) : data ? (
            <KnowledgeDepthBar entries={data.knowledgeDepth} />
          ) : null}
        </div>
      </div>

      {/* Row 4: Top Articles */}
      {!loading && data && data.topArticles.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 shadow-xs">
          <h2 className="text-sm font-bold text-[#181715] mb-4">
            Top Articles by Engagement Score
          </h2>
          <ol className="space-y-3">
            {data.topArticles.map((article, i) => (
              <li key={article.url} className="flex items-start gap-3">
                <span className="text-xs font-bold text-[#C35824] tabular-nums w-4 shrink-0 pt-0.5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#181715] hover:text-[#C35824] transition-colors line-clamp-2"
                  >
                    {article.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    {article.source && (
                      <span className="text-[10px] text-[#8A8278]">{article.source}</span>
                    )}
                    <span className="text-[10px] font-semibold text-[#C35824] bg-[#FEF8F4] px-1.5 py-0.5 rounded">
                      {article.score.toFixed(2)} score
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Export row */}
      {!loading && data && (
        <div className="border-t border-[#E9E5DE] pt-5 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-[#8A8278]">
            Total engagements tracked: <strong className="text-[#181715]">{data.totalEngagements}</strong> events over 30 days
          </p>
          <ExportAnalyticsButton data={data} variant="full" />
        </div>
      )}
    </div>
  );
}
