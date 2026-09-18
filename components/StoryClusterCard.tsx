"use client";

import React from "react";
import { ExternalLink, Compass, ArrowRight } from "lucide-react";
import { ClusterBadge } from "./ClusterBadge";
import type { ClusteredGroup } from "@/lib/clustering";

interface StoryClusterCardProps {
  cluster: ClusteredGroup;
  onOpenPerspectives?: (cluster: ClusteredGroup) => void;
}

export function StoryClusterCard({
  cluster,
  onOpenPerspectives,
}: StoryClusterCardProps) {
  const sources = Array.from(new Set(cluster.articles.map((a) => a.source)));

  return (
    <article className="group bg-white rounded-xl border border-[#E9E5DE] p-5 sm:p-6 transition-all hover:border-[#D5CFC5] hover:shadow-sm">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <ClusterBadge
          sourceCount={cluster.articles.length}
          sources={sources}
          consensusScore={cluster.relevanceScore}
        />

        {cluster.topic && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] border border-[#E8E4DC] text-[#7A746B]">
            {cluster.topic}
          </span>
        )}
      </div>

      {/* Cluster Headline */}
      <h3 className="font-editorial text-xl sm:text-2xl font-bold leading-snug text-[#181715] mb-2.5 group-hover:text-[#C35824] transition-colors">
        {cluster.headline}
      </h3>

      {/* Cross-Source Synthesis Summary */}
      <p className="text-sm leading-relaxed text-[#4A453E] mb-4">
        {cluster.summary}
      </p>

      {/* Corroborating Outlets & Coverage Breakdown */}
      <div className="pt-3.5 border-t border-[#F0ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#7A746B]">
          <span className="font-semibold text-[#181715]">Coverage:</span>
          {cluster.articles.map((art, idx) => (
            <a
              key={art.url || idx}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#C35824] hover:text-[#C35824] transition-colors text-[11px]"
              title={art.title}
            >
              <span className="font-medium">{art.source}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          ))}
        </div>

        {/* 360 Action Button */}
        {onOpenPerspectives && (
          <button
            type="button"
            onClick={() => onOpenPerspectives(cluster)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181715] text-white hover:bg-[#2C2926] transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>360° Perspectives</span>
            <ArrowRight className="w-3 h-3 text-white/70" />
          </button>
        )}
      </div>
    </article>
  );
}
