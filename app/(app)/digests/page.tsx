"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function DigestsArchivePage() {
  const [digests, setDigests] = useState<any[]>([]);

  useEffect(() => {
    // Generate recent archives
    const dates = [
      { id: "today", date: "Today's Executive Briefing", count: 6, status: "Delivered" },
      { id: "yesterday", date: "Yesterday's Intelligence Briefing", count: 5, status: "Delivered" },
      { id: "weekly", date: "Weekly Synthesis & Horizon Scan", count: 12, status: "Delivered" },
    ];
    setDigests(dates);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-5 border-b border-[#E9E5DE]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#8A8378] tracking-widest uppercase mb-1">
          <History className="w-3.5 h-3.5 text-[#C35824]" />
          <span>Email Editions</span>
        </div>
        <h1 className="font-editorial text-3xl font-bold tracking-tight text-[#181715]">
          Daily Digest Archive
        </h1>
        <p className="text-xs sm:text-sm text-[#6E675C] mt-1">
          Browse past daily intelligence briefings and editorial syntheses delivered to your inbox.
        </p>
      </div>

      <div className="space-y-3">
        {digests.map((d) => (
          <Link
            key={d.id}
            href={`/digest/${d.id}`}
            className="block bg-white rounded-xl border border-[#E9E5DE] p-5 transition-all hover:border-[#C35824] hover:shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-[#F2F8F4] text-[#2C6E49] font-semibold text-[10px] flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{d.status}</span>
                  </span>
                  <span className="text-[#8A8378]">&bull;</span>
                  <span className="text-[#8A8378] font-medium">{d.count} Curated Stories</span>
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#181715] group-hover:text-[#C35824] transition-colors">
                  {d.date}
                </h3>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8A8378] group-hover:text-[#C35824] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
