"use client";

function formatLastSync(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "Never synced";
  const date = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

import React, { useState } from "react";
import type { FeedSource } from "@/db/schema";
import { FeedHealthBadge } from "./FeedHealthBadge";
import { Rss, RefreshCw, Trash2, ExternalLink, AlertCircle } from "lucide-react";

interface SourceCardProps {
  source: FeedSource;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SourceCard({ source, onSync, onDelete }: SourceCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(source.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove "${source.title}"?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(source.id);
    } finally {
      setIsDeleting(false);
    }
  };



  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 hover:border-[#BFB7AA] transition-all shadow-xs flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E4DC] flex items-center justify-center shrink-0 text-[#625C54]">
              <Rss className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#181715] truncate">{source.title}</h3>
              <a
                href={source.siteUrl || source.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7A746B] hover:text-[#181715] inline-flex items-center gap-1 transition-colors truncate max-w-full"
              >
                <span>{getDomain(source.siteUrl || source.url)}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
              </a>
            </div>
          </div>
          <FeedHealthBadge status={source.fetchStatus} errorMessage={source.errorMessage} />
        </div>

        {source.errorMessage && source.fetchStatus === "error" && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="line-clamp-2">{source.errorMessage}</p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#7A746B] border border-[#E8E4DC]">
            {source.feedType}
          </span>
          <span className="text-xs text-[#8A8378]">
            {formatLastSync(source.lastFetchedAt)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            title="Fetch latest articles now"
            className="p-1.5 text-[#7A746B] hover:text-[#181715] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#181715]" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Remove feed"
            className="p-1.5 text-[#8A8378] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
