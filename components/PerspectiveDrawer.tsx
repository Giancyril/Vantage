"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers,
  Scale,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { ClusteredGroup } from "@/lib/clustering";
import type { SynthesizedStory, Perspective, Contradiction } from "@/lib/synthesis";

interface PerspectiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cluster: ClusteredGroup | null;
}

export function PerspectiveDrawer({
  isOpen,
  onClose,
  cluster,
}: PerspectiveDrawerProps) {
  const [synthesis, setSynthesis] = useState<SynthesizedStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !cluster) {
      setSynthesis(null);
      return;
    }

    const fetchSynthesis = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = cluster.id || encodeURIComponent(cluster.clusterKey);
        const res = await fetch(`/api/clusters/${id}`);
        if (!res.ok) throw new Error("Failed to load synthesis");
        const data = await res.json();
        setSynthesis(data.synthesis);
      } catch (e) {
        console.error(e);
        setError("Could not load comparative synthesis.");
      } finally {
        setLoading(false);
      }
    };

    fetchSynthesis();
  }, [isOpen, cluster]);

  const handleRefreshSynthesis = async () => {
    if (!cluster) return;
    setLoading(true);
    setError(null);
    try {
      const id = cluster.id || encodeURIComponent(cluster.clusterKey);
      const res = await fetch(`/api/clusters/${id}?synthesize=true`);
      if (!res.ok) throw new Error("Failed to re-synthesize");
      const data = await res.json();
      setSynthesis(data.synthesis);
    } catch (e) {
      console.error(e);
      setError("Re-synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cluster) return null;

  const sentimentColor = (sentiment: Perspective["sentiment"]) => {
    switch (sentiment) {
      case "bullish":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cautious":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "skeptical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181715]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-[#FAF8F5] border-l border-[#E8E4DC] shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#E8E4DC] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#181715] text-white">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  360° Comparative Synthesis
                </span>
                <span className="text-xs text-[#7A746B]">
                  {cluster.articles.length} Reporting Outlets
                </span>
              </div>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#181715] leading-tight">
                {cluster.headline}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && !synthesis && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-[#C35824] animate-spin" />
                <p className="text-sm font-medium text-[#4A453E]">
                  Synthesizing multi-source perspectives...
                </p>
                <p className="text-xs text-[#8A8378] max-w-sm">
                  Corroborating reporting claims, highlighting nuances, and classifying media angles.
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {synthesis && (
              <>
                {/* Executive Harmonized Summary */}
                <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8378] block mb-1.5">
                    Executive Harmonized Summary
                  </span>
                  <p className="text-sm leading-relaxed text-[#181715]">
                    {synthesis.executiveSummary}
                  </p>
                </div>

                {/* Consensus Corroboration */}
                <div className="bg-[#EDF7EE] rounded-xl border border-[#D0EBD2] p-5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E6F40] mb-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cross-Source Consensus Facts</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#1B4B27]">
                    {synthesis.consensus}
                  </p>
                </div>

                {/* Contradictions & Divergent Claims */}
                {synthesis.contradictions && synthesis.contradictions.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#E9E5DE] p-5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#C35824]">
                      <Scale className="w-4 h-4" />
                      <span>Conflicting Claims & Reporting Tension</span>
                    </div>

                    {synthesis.contradictions.map((c: Contradiction, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg bg-[#FAF8F5] border border-[#EBE7DF] p-3.5 space-y-2 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2.5 rounded bg-white border border-[#E9E5DE]">
                            <span className="font-semibold text-[#181715] block mb-1">
                              {c.sourceA}
                            </span>
                            <p className="text-[#4A453E]">{c.claimA}</p>
                          </div>
                          <div className="p-2.5 rounded bg-white border border-[#E9E5DE]">
                            <span className="font-semibold text-[#181715] block mb-1">
                              {c.sourceB}
                            </span>
                            <p className="text-[#4A453E]">{c.claimB}</p>
                          </div>
                        </div>
                        {c.resolutionNote && (
                          <div className="pt-1.5 text-[11px] text-[#7A746B] italic">
                            Analysis: {c.resolutionNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 360 Perspectives Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A746B]">
                      360° Outlet Perspective Matrix
                    </h3>
                    <span className="text-[11px] text-[#8A8378]">
                      {synthesis.perspectives.length} Analyzed Angles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {synthesis.perspectives.map((p: Perspective, i: number) => {
                      const bias = synthesis.biasRatings[p.source];
                      return (
                        <div
                          key={i}
                          className="bg-white rounded-xl border border-[#E9E5DE] p-4 space-y-2 hover:border-[#D5CFC5] transition-all"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#181715]">
                                {p.source}
                              </span>
                              {bias && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F2EB] text-[#555048] border border-[#E5E0D6]">
                                  {bias.category} &bull; {bias.stance}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${sentimentColor(
                                p.sentiment
                              )}`}
                            >
                              {p.sentiment}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#C35824]">
                            Angle: {p.angle}
                          </div>

                          <p className="text-xs leading-relaxed text-[#4A453E] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EFECE4]">
                            &ldquo;{p.quoteOrPoint}&rdquo;
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-[#8A8378] pt-1">
                            <span>Focus: {p.focusArea}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Divergent Takeaways */}
                {synthesis.divergentTakeaways && synthesis.divergentTakeaways.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#E9E5DE] p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8378] block mb-2">
                      Key Nuances & Divergent Points
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#4A453E]">
                      {synthesis.divergentTakeaways.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#C35824] font-bold">&bull;</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-white border-t border-[#E8E4DC] flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleRefreshSynthesis}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#E5E0D6] bg-[#FAF8F5] text-[#4A453E] hover:bg-[#F3F0EA] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Re-Synthesize</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#181715] text-white hover:bg-[#2C2926] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
