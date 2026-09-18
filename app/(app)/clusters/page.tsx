"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Compass,
  RefreshCw,
  Sparkles,
  Filter,
  CheckCircle2,
  Newspaper,
} from "lucide-react";
import { StoryClusterCard } from "@/components/StoryClusterCard";
import { PerspectiveDrawer } from "@/components/PerspectiveDrawer";
import type { ClusteredGroup } from "@/lib/clustering";

export default function ClustersPage() {
  const [clusters, setClusters] = useState<ClusteredGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [clusteringActive, setClusteringActive] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "multi">("multi");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [activeClusterForDrawer, setActiveClusterForDrawer] = useState<ClusteredGroup | null>(null);
  const [stats, setStats] = useState({
    totalClusters: 0,
    multiArticleCount: 0,
    totalArticlesGrouped: 0,
  });

  const loadClusters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clusters");
      const data = await res.json();
      if (data.clusters) {
        setClusters(data.clusters);
        setStats(data.stats || {
          totalClusters: data.clusters.length,
          multiArticleCount: data.clusters.filter((c: ClusteredGroup) => c.articles.length > 1).length,
          totalArticlesGrouped: data.clusters.reduce((a: number, c: ClusteredGroup) => a + c.articles.length, 0),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const handleRunReclustering = async () => {
    setClusteringActive(true);
    try {
      const res = await fetch("/api/clusters", { method: "POST" });
      const data = await res.json();
      if (data.clusters) {
        setClusters(data.clusters);
        setStats({
          totalClusters: data.clusters.length,
          multiArticleCount: data.clusters.filter((c: ClusteredGroup) => c.articles.length > 1).length,
          totalArticlesGrouped: data.clusters.reduce((a: number, c: ClusteredGroup) => a + c.articles.length, 0),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClusteringActive(false);
    }
  };

  const topics = ["all", ...Array.from(new Set(clusters.map((c) => c.topic || "AI & Tech")))];

  const filteredClusters = clusters.filter((c) => {
    if (filterMode === "multi" && c.articles.length < 2) return false;
    if (selectedTopic !== "all" && c.topic !== selectedTopic) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-[#E8E4DC]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C35824] text-white">
              Day 2 Intelligence
            </span>
            <span className="text-xs text-[#7A746B] font-medium">
              Multi-Article Story Clustering & Synthesis
            </span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#181715] tracking-tight">
            Cross-Outlet Story Clusters
          </h1>
          <p className="text-sm text-[#7A746B] mt-1 max-w-2xl leading-relaxed">
            Deduplicating duplicate announcements, identifying cross-source consensus facts, and surfacing subtle narrative tensions across outlets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunReclustering}
          disabled={clusteringActive}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#181715] text-white hover:bg-[#2C2926] transition-colors shrink-0 shadow-xs disabled:opacity-60 cursor-pointer self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${clusteringActive ? "animate-spin" : ""}`} />
          <span>{clusteringActive ? "Re-clustering..." : "Re-cluster Stories"}</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-4 text-center">
          <span className="text-2xl font-bold text-[#181715] font-serif block">
            {stats.totalClusters}
          </span>
          <span className="text-[11px] font-medium text-[#7A746B] uppercase tracking-wider">
            Story Clusters
          </span>
        </div>
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-4 text-center">
          <span className="text-2xl font-bold text-[#C35824] font-serif block">
            {stats.multiArticleCount}
          </span>
          <span className="text-[11px] font-medium text-[#7A746B] uppercase tracking-wider">
            Multi-Source Stories
          </span>
        </div>
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-4 text-center">
          <span className="text-2xl font-bold text-[#2E6F40] font-serif block">
            {stats.totalArticlesGrouped}
          </span>
          <span className="text-[11px] font-medium text-[#7A746B] uppercase tracking-wider">
            Grouped Articles
          </span>
        </div>
      </div>

      {/* Filter Tabs & Topics */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E4DC]">
          <button
            type="button"
            onClick={() => setFilterMode("multi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === "multi"
                ? "bg-[#181715] text-white shadow-xs"
                : "text-[#7A746B] hover:text-[#181715]"
            }`}
          >
            Multi-Source Stories ({stats.multiArticleCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-[#181715] text-white shadow-xs"
                : "text-[#7A746B] hover:text-[#181715]"
            }`}
          >
            All Stories ({stats.totalClusters})
          </button>
        </div>

        {topics.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8A8378]" />
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTopic(t)}
                className={`px-2.5 py-1 rounded-full capitalize text-xs font-medium border transition-colors cursor-pointer ${
                  selectedTopic === t
                    ? "bg-[#EFECE4] border-[#D5CFC5] text-[#181715]"
                    : "border-[#E8E4DC] text-[#7A746B] hover:border-[#D5CFC5]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clusters List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#C35824] animate-spin" />
          <p className="text-sm font-medium text-[#4A453E]">
            Loading story clusters...
          </p>
        </div>
      ) : filteredClusters.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-[#8A8378] mx-auto opacity-50" />
          <h3 className="font-editorial text-lg font-bold text-[#181715]">
            No clusters match current filter
          </h3>
          <p className="text-xs text-[#7A746B] max-w-sm mx-auto">
            Try switching to &quot;All Stories&quot; or click &quot;Re-cluster Stories&quot; to synthesize fresh incoming news.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClusters.map((cluster) => (
            <StoryClusterCard
              key={cluster.id || cluster.clusterKey}
              cluster={cluster}
              onOpenPerspectives={(c) => setActiveClusterForDrawer(c)}
            />
          ))}
        </div>
      )}

      {/* 360 Perspective Modal Drawer */}
      <PerspectiveDrawer
        isOpen={Boolean(activeClusterForDrawer)}
        onClose={() => setActiveClusterForDrawer(null)}
        cluster={activeClusterForDrawer}
      />
    </div>
  );
}
