"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Headphones, Sparkles, RefreshCw } from "lucide-react";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioPlayerControls } from "@/components/AudioPlayerControls";
import { SynchronizedTranscript } from "@/components/SynchronizedTranscript";
import type { BriefingRecord } from "@/lib/audio-storage";

export interface AudioBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: BriefingRecord | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (delta: number) => void;
  onRateChange: (rate: number) => void;
  onMuteToggle: () => void;
  onRegenerate: () => void;
}

export function AudioBriefingModal({
  isOpen,
  onClose,
  briefing,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  isMuted,
  isLoading,
  onPlayPause,
  onSeek,
  onSkip,
  onRateChange,
  onMuteToggle,
  onRegenerate,
}: AudioBriefingModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181715]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-2xl rounded-2xl bg-[#FAF8F5] border border-[#E8E4DC] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-[#E8E4DC] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#181715] flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#181715] text-white">
                    Vantage Audio
                  </span>
                  <span className="text-xs text-[#7A746B] font-medium">Executive Podcast</span>
                </div>
                <h3 className="font-editorial text-base sm:text-lg font-bold text-[#181715] truncate mt-0.5">
                  {briefing?.title || "Daily Executive Intelligence Briefing"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors disabled:opacity-50 cursor-pointer"
                title="Regenerate briefing"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Visualizer Hero Section */}
            <div className="space-y-3">
              <WaveVisualizer
                isPlaying={isPlaying}
                progressPercent={progressPct}
                onSeekPercent={(pct) => onSeek((pct / 100) * duration)}
              />

              {/* Player Controls */}
              <AudioPlayerControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                playbackRate={playbackRate}
                isMuted={isMuted}
                onPlayPause={onPlayPause}
                onSeek={onSeek}
                onSkip={onSkip}
                onRateChange={onRateChange}
                onMuteToggle={onMuteToggle}
              />
            </div>

            {/* Synchronized Transcript Section */}
            {briefing?.segments && briefing.segments.length > 0 && (
              <div className="pt-4 border-t border-[#E8E4DC]">
                <SynchronizedTranscript
                  segments={briefing.segments}
                  currentTime={currentTime}
                  onSeek={onSeek}
                />
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3 bg-[#F3F0EA] border-t border-[#E8E4DC] flex items-center justify-between text-[11px] text-[#7A746B]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Synthesized with Vantage Autonomous Reasoning & Neural Speech</span>
            </div>
            <span>Press Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
