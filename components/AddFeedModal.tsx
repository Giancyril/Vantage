"use client";

import React, { useState } from "react";
import { X, Search, Plus, Check, Loader2, Sparkles, Rss, Globe } from "lucide-react";
import type { CuratedFeedPreset } from "@/lib/sources";
import type { DiscoveredFeedInfo } from "@/lib/feedDiscovery";

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => Promise<void>;
  presets: CuratedFeedPreset[];
  subscribedUrls: Set<string>;
}

export function AddFeedModal({
  isOpen,
  onClose,
  onAdded,
  presets,
  subscribedUrls,
}: AddFeedModalProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom">("presets");
  const [urlInput, setUrlInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveredFeedInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [presetSubmittingId, setPresetSubmittingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDetect = async () => {
    if (!urlInput.trim()) return;
    setIsDetecting(true);
    setErrorMsg(null);
    setDiscoveryResult(null);

    try {
      const res = await fetch(`/api/sources?discover=${encodeURIComponent(urlInput.trim())}`);
      const data = await res.json();
      if (data.discovery?.found) {
        setDiscoveryResult(data.discovery);
        if (data.discovery.title && !customTitle) {
          setCustomTitle(data.discovery.title);
        }
      } else {
        setErrorMsg(data.discovery?.error || "Could not discover an RSS or Atom feed at this address.");
      }
    } catch {
      setErrorMsg("Network error trying to discover feed. Please check the URL.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const targetUrl = discoveryResult?.feedUrl || urlInput.trim();

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add feed source");
      }

      await onAdded();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error adding feed source");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPreset = async (preset: CuratedFeedPreset) => {
    setPresetSubmittingId(preset.id);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: preset.feedUrl,
          title: preset.title,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe to preset");
      }

      await onAdded();
    } catch (err) {
      console.error("Preset add failed:", err);
    } finally {
      setPresetSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E2DDD5] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0ECE4] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#181715] flex items-center gap-2">
              <Rss className="w-4 h-4 text-[#D97706]" />
              Add News & Content Source
            </h2>
            <p className="text-xs text-[#7A746B] mt-0.5">
              Subscribe to blogs, Substack publications, and RSS feeds
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8378] hover:text-[#181715] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#F0ECE4] px-6 pt-2 bg-[#FAF8F5]">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "presets"
                ? "border-[#181715] text-[#181715]"
                : "border-transparent text-[#7A746B] hover:text-[#181715]"
            }`}
          >
            Curated Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === "custom"
                ? "border-[#181715] text-[#181715]"
                : "border-transparent text-[#7A746B] hover:text-[#181715]"
            }`}
          >
            Custom Feed or Substack
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "presets" ? (
            <div className="space-y-3">
              <p className="text-xs text-[#7A746B] mb-2">
                One-click subscribe to top publications in AI, venture, and tech:
              </p>
              {presets.map((preset) => {
                const isSubscribed = subscribedUrls.has(preset.feedUrl);
                const isPending = presetSubmittingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl border border-[#E8E4DC] hover:border-[#BFB7AA] transition-all bg-[#FAF8F5] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#181715] truncate">
                          {preset.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-white text-[#7A746B] border border-[#E2DDD5]">
                          {preset.feedType}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A746B] mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubscribed || isPending}
                      onClick={() => handleAddPreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default ${
                        isSubscribed
                          ? "bg-[#EFECE6] text-[#7A746B] border border-transparent"
                          : "bg-[#181715] text-white hover:bg-[#2C2926] shadow-xs"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4A453E] mb-1">
                  Website, Substack, or RSS URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-[#8A8378] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. stratechery.com or https://example.com/feed"
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        setDiscoveryResult(null);
                        setErrorMsg(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#D5CFC4] rounded-lg bg-white focus:outline-none focus:border-[#181715] transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDetect}
                    disabled={isDetecting || !urlInput.trim()}
                    className="px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#D5CFC4] text-xs font-medium text-[#181715] hover:bg-[#F0ECE4] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-[#625C54]" />
                    )}
                    <span>Detect</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8A8378] mt-1">
                  Tip: You can paste a homepage like <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#181715]">theverge.com</code> or Substack like <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#181715]">name.substack.com</code>.
                </p>
              </div>

              {discoveryResult && (
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-950 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Feed Auto-Detected!</span>
                  </div>
                  <p className="text-xs text-emerald-900 truncate">
                    <strong>Feed URL:</strong> {discoveryResult.feedUrl}
                  </p>
                  <span className="inline-block uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    {discoveryResult.feedType}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A453E] mb-1">
                  Source Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stratechery by Ben Thompson"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#D5CFC4] rounded-lg bg-white focus:outline-none focus:border-[#181715] transition-colors"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#625C54] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !urlInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#181715] text-white hover:bg-[#2C2926] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Feed Source</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
