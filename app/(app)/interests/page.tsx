"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sliders, Plus, Trash2 } from "lucide-react";
import type { Interest } from "@/db/schema";

export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const loadInterests = useCallback(async () => {
    try {
      const res = await fetch("/api/interests");
      const data = (await res.json()) as { interests: Interest[] };
      if (data.interests) setInterests(data.interests);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInterests();
  }, [loadInterests]);

  const handleWeightChange = async (id: string, newWeight: number) => {
    setInterests((prev) =>
      prev.map((i) => (i.id === id ? { ...i, weight: newWeight } : i))
    );
    try {
      await fetch("/api/interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, weight: newWeight }),
      });
      showToast("Topic weight adjusted");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    setInterests((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/interests?id=${id}`, { method: "DELETE" });
      showToast("Topic removed");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    const kwArray = newKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopic.trim(),
          keywords: kwArray.length > 0 ? kwArray : [newTopic.trim()],
          weight: 1.0,
        }),
      });
      const data = (await res.json()) as { interest: Interest };
      if (data.interest) {
        setInterests((prev) => [...prev, data.interest]);
        setNewTopic("");
        setNewKeywords("");
        showToast("New interest topic added");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-[#E9E5DE] flex items-end justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#8A8378] tracking-widest uppercase mb-1">
            <Sliders className="w-3.5 h-3.5 text-[#C35824]" />
            <span>Autonomous Profile</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[#181715]">
            Interest Profile &amp; Weights
          </h1>
          <p className="text-xs sm:text-sm text-[#6E675C] mt-1">
            Visible, editable signals shaping your feed. Weights adapt dynamically as you read, save, and rate stories.
          </p>
        </div>
        {toast && (
          <span className="text-xs font-medium text-[#2C6E49] bg-[#F2F8F4] border border-[#BDE0CE] px-3 py-1 rounded-full animate-pulse-subtle">
            {toast}
          </span>
        )}
      </div>

      {/* Active Interests List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A8378]">
          Active Domains ({interests.length})
        </h2>
        <div className="space-y-3">
          {interests.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-[#E9E5DE] p-5 transition-colors hover:border-[#D0CAC0]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-base text-[#181715]">{item.topic}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#C35824] border border-[#EADFCF]">
                      {item.weight.toFixed(1)}x Priority
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.keywords.map((kw, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-0.5 rounded-md bg-[#F4EFE7] text-[#4A453E] border border-[#E9E4DC]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-[#9A9388] hover:text-[#9E2A2B] hover:bg-[#FBECEC] rounded-lg transition-colors cursor-pointer"
                  title="Remove Topic"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F4EFE7] flex items-center space-x-4">
                <span className="text-[11px] font-medium text-[#8A8378] uppercase tracking-wider shrink-0">Priority Weight:</span>
                <input
                  type="range" min="0.2" max="2.5" step="0.1"
                  value={item.weight}
                  onChange={(e) => handleWeightChange(item.id, parseFloat(e.target.value))}
                  className="w-full accent-[#C35824] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#181715] w-8 text-right">{item.weight.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Topic Form */}
      <div className="bg-white rounded-xl border border-[#E9E5DE] p-6 space-y-4">
        <h3 className="font-editorial text-lg font-bold text-[#181715] flex items-center space-x-2">
          <Plus className="w-4 h-4 text-[#C35824]" />
          <span>Track a Custom Domain</span>
        </h3>
        <form onSubmit={handleAddCustom} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A8378] mb-1">Domain / Topic Title</label>
            <input
              type="text"
              placeholder="e.g. Neuromorphic Computing & Spiking Networks"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#DCD5CB] text-xs text-[#181715] focus:outline-none focus:ring-1 focus:ring-[#C35824]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A8378] mb-1">Key Concepts &amp; Phrases (Comma separated)</label>
            <input
              type="text"
              placeholder="e.g. memristors, event-driven sensors, synaptic plasticity, Intel Loihi"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#DCD5CB] text-xs text-[#181715] focus:outline-none focus:ring-1 focus:ring-[#C35824]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit" disabled={!newTopic.trim()}
              className="px-4 py-2 rounded-full bg-[#181715] text-white text-xs font-semibold hover:bg-[#33302B] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Add Domain to Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
