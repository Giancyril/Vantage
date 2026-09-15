"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Compass, ExternalLink } from "lucide-react";
import { WhyItMatters } from "@/components/WhyItMatters";

export default function DigestViewPage({ params }: { params: Promise<{ id: string }> }) {
  const [digestId, setDigestId] = useState("");
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    params.then((p) => {
      setDigestId(p.id);
    });

    fetch("/api/pipeline/discover", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) setStories(data.articles);
      })
      .catch(console.error);
  }, [params]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 bg-white rounded-2xl border border-[#E9E5DE] p-6 sm:p-10 shadow-sm">
      <Link
        href="/digests"
        className="inline-flex items-center space-x-1.5 text-xs text-[#706A60] hover:text-[#181715]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Digest Archive</span>
      </Link>

      {/* Editorial Header */}
      <div className="text-center pb-6 border-b border-[#EAE6DF] space-y-2">
        <span className="text-[11px] uppercase tracking-widest font-bold text-[#8C8275]">
          THE DAILY DISTILL &bull; WEB ARCHIVE
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#181715]">
          Executive Intelligence Briefing
        </h1>
        <p className="text-xs text-[#7A7368]">
          Delivered to your primary email &bull; Verified multi-source synthesis
        </p>
      </div>

      {/* Stories list */}
      <div className="space-y-8">
        {stories.map((story, idx) => (
          <div key={idx} className="space-y-2 pb-6 border-b border-[#F0ECE4] last:border-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8A8378]">
              {story.source} &bull; {story.matchedTopic}
            </div>

            <h2 className="font-editorial text-xl font-bold leading-snug text-[#181715] hover:text-[#C35824]">
              <a href={story.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1.5">
                <span>{story.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8A8378]" />
              </a>
            </h2>

            <p className="text-sm text-[#4A453E] leading-relaxed">
              {story.snippet}
            </p>

            <WhyItMatters
              topic={story.matchedTopic}
              explanation={`Critical development impacting technical and commercial trajectories across ${story.matchedKeywords?.slice(0, 2).join(" & ")}.`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
