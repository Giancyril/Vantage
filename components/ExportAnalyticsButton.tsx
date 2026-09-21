"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Share2, Check, Loader2, ChevronDown, Database } from "lucide-react";
import type { AnalyticsDashboard } from "@/lib/analytics";

interface ExportAnalyticsButtonProps {
  data?: AnalyticsDashboard | null;
  variant?: "compact" | "full";
}

export function ExportAnalyticsButton({
  data,
  variant = "compact",
}: ExportAnalyticsButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleExport = async (format: "pdf" | "notion" | "json") => {
    setLoading(format);
    try {
      if (format === "json") {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `intelligence-analytics-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess("JSON downloaded");
      } else {
        const res = await fetch("/api/analytics/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        });

        if (format === "pdf") {
          if (!res.ok) throw new Error("Export failed");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `intelligence-briefing-${new Date().toISOString().slice(0, 10)}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccess("Briefing exported");
        } else if (format === "notion") {
          const json = await res.json();
          if (json.success) {
            setSuccess(json.message || "Pushed to Notion");
          } else {
            alert(json.error || "Notion integration not configured. Please check your NOTION_API_KEY.");
          }
        }
      }
    } catch (err: any) {
      alert(err?.message || "Export failed. Please try again.");
    } finally {
      setLoading(null);
      setOpen(false);
      setTimeout(() => setSuccess(null), 3500);
    }
  };

  const isCompact = variant === "compact";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading !== null}
        className={`inline-flex items-center gap-2 font-medium transition-all duration-150 ${
          isCompact
            ? "px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 shadow-sm"
            : "px-4 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700 shadow-sm"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
        ) : success ? (
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Download className="w-4 h-4 text-stone-600 dark:text-stone-300" />
        )}
        <span>{success ? success : isCompact ? "Export" : "Export Intelligence Report"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl overflow-hidden">
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => handleExport("pdf")}
              disabled={loading !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Briefing Snapshot (HTML/PDF)</div>
                <div className="text-[10px] text-stone-400">Printable executive summary</div>
              </div>
            </button>

            <button
              onClick={() => handleExport("notion")}
              disabled={loading !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Push to Notion</div>
                <div className="text-[10px] text-stone-400">Sync to your workspace database</div>
              </div>
            </button>

            <button
              onClick={() => handleExport("json")}
              disabled={loading !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1">
                <div className="font-medium">Export Raw JSON</div>
                <div className="text-[10px] text-stone-400">Full metric payload</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
