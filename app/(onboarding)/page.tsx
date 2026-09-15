"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Compass, ArrowRight, Check, Sparkles, Sliders, Mail, Loader2 } from "lucide-react";
import type { CuratedTopic } from "@/lib/interests";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [curated, setCurated] = useState<CuratedTopic[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [email, setEmail] = useState("subscriber@example.com");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/interests?curated=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.curatedTopics) {
          setCurated(data.curatedTopics);
          // Default pre-select top 2
          setSelectedIds([data.curatedTopics[0]?.id, data.curatedTopics[1]?.id].filter(Boolean));
        }
      })
      .catch(console.error);
  }, []);

  const toggleTopic = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Seed chosen topics
      await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedIds }),
      });

      // 2. Trigger initial synthesis pipeline
      await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      router.push("/feed");
    } catch (err) {
      console.error(err);
      router.push("/feed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12">
      {/* Progress header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAE5DC] text-xs font-semibold text-[#6E675C] mb-4">
          <Compass className="w-3.5 h-3.5 text-[#C35824]" />
          <span>ONBOARDING WIZARD &bull; STEP {step} OF 3</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#181715] mb-3">
          {step === 1 && "What domains are you tracking?"}
          {step === 2 && "Fine-tune keywords & focus"}
          {step === 3 && "Daily delivery & synthesis schedule"}
        </h1>
        <p className="text-sm sm:text-base text-[#6E675C] max-w-lg mx-auto">
          {step === 1 && "Select the strategic frontiers that matter most to your work. The agent will read hundreds of publications and filter for high-signal breakthroughs."}
          {step === 2 && "Each domain monitors targeted keywords. The agent adapts these weights automatically based on stories you engage with or dismiss."}
          {step === 3 && "Set your email briefing preferences. Every morning at 6:00 AM, receive a synthesized intelligence brief explaining why each story matters."}
        </p>
      </div>

      {/* Step 1: Select Topics */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {curated.map((ct) => {
              const isSelected = selectedIds.includes(ct.id);
              return (
                <div
                  key={ct.id}
                  onClick={() => toggleTopic(ct.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#181715] shadow-sm ring-1 ring-[#181715]"
                      : "bg-white/60 border-[#E5E0D6] hover:bg-white hover:border-[#CDC5B8]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8378]">
                      {ct.category}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#181715] text-white" : "border border-[#D2CBC0]"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-[#181715] mb-1">{ct.topic}</h3>
                  <p className="text-xs text-[#6E675C] leading-relaxed line-clamp-2">
                    {ct.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {ct.defaultKeywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4EFE7] text-[#555048]">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={selectedIds.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#181715] text-white text-xs font-semibold hover:bg-[#33302B] transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Continue ({selectedIds.length} Selected)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Keywords review */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
            <span className="text-xs font-semibold text-[#8A8378] uppercase tracking-wider">
              Selected Interest Horizons
            </span>
            <span className="text-xs text-[#C35824] font-medium">
              Dynamic Relevance Matching Enabled
            </span>
          </div>

          {curated.filter((c) => selectedIds.includes(c.id)).map((topic) => (
            <div key={topic.id} className="p-4 rounded-lg bg-[#FAF8F5] border border-[#EFEBE3]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-[#181715]">{topic.topic}</h4>
                <span className="text-xs px-2 py-0.5 rounded bg-white text-[#706A60] font-medium border border-[#E8E3DA]">
                  Weight: 1.0x
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topic.defaultKeywords.map((kw, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#E2DDD5] text-[#3D3933]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-[#706A60] hover:text-[#181715] cursor-pointer"
            >
              Back to Domain Selection
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#181715] text-white text-xs font-semibold hover:bg-[#33302B] transition-all cursor-pointer"
            >
              <span>Delivery Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Delivery schedule */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-[#E9E5DE] p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A8378] mb-2">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8A8378] absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#DCD5CB] text-sm text-[#181715] focus:outline-none focus:ring-2 focus:ring-[#C35824]/30 focus:border-[#C35824]"
                placeholder="your.email@firm.com"
              />
            </div>
            <p className="text-xs text-[#8A8378] mt-2">
              A clean, distraction-free HTML email delivered daily at 6:00 AM UTC.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#EFEBE3] text-xs text-[#555048] space-y-2">
            <div className="flex items-center space-x-2 font-semibold text-[#181715]">
              <Sparkles className="w-3.5 h-3.5 text-[#C35824]" />
              <span>What happens next:</span>
            </div>
            <p>1. The agent discovers candidate stories across your {selectedIds.length} chosen domains.</p>
            <p>2. Full content is extracted and scored for relevance.</p>
            <p>3. Every article receives a tailored "Why this matters to you" briefing.</p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-[#706A60] hover:text-[#181715] cursor-pointer"
            >
              Back to Keywords
            </button>
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#C35824] hover:bg-[#AB4B1C] text-white text-xs font-semibold shadow transition-all disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Initial Feed...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Agent & Open Feed</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
