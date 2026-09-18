"use client";

import React, { useEffect, useState, useTransition } from "react";
import type { FeedSource } from "@/db/schema";
import type { CuratedFeedPreset } from "@/lib/sources";
import { SourceCard } from "@/components/SourceCard";
import { AddFeedModal } from "@/components/AddFeedModal";
import {
  Rss,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [presets, setPresets] = useState<CuratedFeedPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingAll, startSyncTransition] = useTransition();

  const fetchSourcesAndPresets = async () => {
    try {
      const [sourcesRes, presetsRes] = await Promise.all([
        fetch("/api/sources"),
        fetch("/api/sources?presets=true"),
      ]);
      const sourcesData = await sourcesRes.json();
      const presetsData = await presetsRes.json();

      if (sourcesData.sources) setSources(sourcesData.sources);
      if (presetsData.presets) setPresets(presetsData.presets);
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSourcesAndPresets();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSyncSingle = async (id: string) => {
    try {
      const res = await fetch("/api/sources/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: id }),
      });
      const data = await res.json();
      if (data.result?.status === "healthy") {
        showToast(`Discovered ${data.result.newArticlesCount} new articles!`);
      } else if (data.result?.error) {
        showToast(`Sync issue: ${data.result.error}`);
      }
      await fetchSourcesAndPresets();
    } catch {
      showToast("Error syncing feed");
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const res = await fetch(`/api/sources?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Source removed");
        await fetchSourcesAndPresets();
      }
    } catch {
      showToast("Failed to delete source");
    }
  };

  const handleSyncAll = () => {
    startSyncTransition(async () => {
      try {
        const res = await fetch("/api/sources/sync", { method: "POST" });
        const data = await res.json();
        if (data.summary) {
          showToast(
            `Sync finished! Processed ${data.summary.sourcesProcessed} feeds (${data.summary.totalNewArticles} new stories).`
          );
        }
        await fetchSourcesAndPresets();
      } catch {
        showToast("Error syncing all feeds");
      }
    });
  };

  const handleSeedPresets = async () => {
    try {
      setLoading(true);
      for (const preset of presets.slice(0, 3)) {
        await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: preset.feedUrl, title: preset.title }),
        });
      }
      await fetchSourcesAndPresets();
      showToast("Starter feeds added successfully!");
    } catch {
      showToast("Failed to add preset feeds");
    } finally {
      setLoading(false);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      s.feedType.toLowerCase().includes(q)
    );
  });

  const healthyCount = sources.filter((s) => s.fetchStatus === "healthy").length;
  const issuesCount = sources.filter((s) => s.fetchStatus !== "healthy").length;
  const subscribedUrls = new Set(sources.map((s) => s.url));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181715] text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150 border border-white/10">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#181715] tracking-tight font-serif">
              Monitored Sources & Substack
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] text-[#7A746B] font-mono">
              {sources.length} active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7A746B] mt-1">
            Autonomous ingestion pipelines monitoring RSS, Atom, and Substack feeds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncingAll || sources.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#D5CFC4] bg-white text-[#181715] hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin text-[#181715]" : "text-[#7A746B]"}`} />
            <span>{isSyncingAll ? "Syncing..." : "Sync All"}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#181715] text-white hover:bg-[#2C2926] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center text-[#181715] shrink-0">
            <Radio className="w-4 h-4 text-[#D97706]" />
          </div>
          <div>
            <div className="text-xs text-[#7A746B]">Total Subscriptions</div>
            <div className="text-lg font-semibold text-[#181715]">{sources.length}</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#7A746B]">Healthy Pipelines</div>
            <div className="text-lg font-semibold text-emerald-800">{healthyCount}</div>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-[#7A746B]">Attention Required</div>
            <div className="text-lg font-semibold text-amber-800">{issuesCount}</div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      {sources.length > 0 && (
        <div className="mb-6 relative">
          <Search className="w-4 h-4 text-[#8A8378] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter sources by title, domain, or feed type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#E2DDD5] rounded-xl bg-white focus:outline-none focus:border-[#181715] transition-colors shadow-xs"
          />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white border border-[#E8E4DC] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredSources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onSync={handleSyncSingle}
              onDelete={handleDeleteSingle}
            />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center mx-auto mb-4 text-[#7A746B]">
            <Rss className="w-6 h-6 text-[#D97706]" />
          </div>
          <h3 className="text-base font-semibold text-[#181715] mb-1">
            No Monitored Feeds Yet
          </h3>
          <p className="text-xs text-[#7A746B] max-w-md mx-auto mb-6">
            Connect RSS feeds, Substack publications, or research blogs to continuously stream fresh intelligence into Vantage.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSeedPresets}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-[#181715] text-white hover:bg-[#2C2926] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >

              <span>Load Top 3 Recommended Feeds</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-[#D5CFC4] bg-white text-[#181715] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Add Custom Feed
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-[#7A746B]">
          No sources match &ldquo;{searchQuery}&rdquo;.
        </div>
      )}

      {/* Modal */}
      <AddFeedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={fetchSourcesAndPresets}
        presets={presets}
        subscribedUrls={subscribedUrls}
      />
    </div>
  );
}
