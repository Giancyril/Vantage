"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatAudioTime } from "@/lib/audio-briefing";

export interface AudioPlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onSeek: (newTime: number) => void;
  onSkip: (deltaSeconds: number) => void;
  onRateChange: (newRate: number) => void;
  onMuteToggle: () => void;
  className?: string;
}

const PLAYBACK_RATES = [1.0, 1.25, 1.5, 2.0, 0.75];

export function AudioPlayerControls({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  isMuted,
  onPlayPause,
  onSeek,
  onSkip,
  onRateChange,
  onMuteToggle,
  className = "",
}: AudioPlayerControlsProps) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const cycleRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onRateChange(PLAYBACK_RATES[nextIndex]);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek((val / 100) * duration);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Scrubber and Timestamps */}
      <div className="space-y-1">
        <div className="relative flex items-center group">
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent || 0}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-[#E8E4DC] rounded-lg appearance-none cursor-pointer accent-[#C35824] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#7A746B]">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Playback Speed Toggle */}
        <button
          type="button"
          onClick={cycleRate}
          className="px-2 py-1 text-xs font-semibold rounded-md bg-[#FAF8F5] text-[#524E48] hover:bg-[#E8E4DC] border border-[#E8E4DC] transition-colors cursor-pointer"
          title="Change playback speed"
        >
          {playbackRate}x
        </button>

        {/* Center Transport: Skip Back, Play/Pause, Skip Forward */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSkip(-15)}
            className="p-2 rounded-full text-[#524E48] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors cursor-pointer"
            title="Rewind 15 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            className="w-11 h-11 rounded-full bg-[#181715] text-white hover:bg-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? "Pause briefing" : "Play briefing"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSkip(15)}
            className="p-2 rounded-full text-[#524E48] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors cursor-pointer"
            title="Fast forward 15 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Mute */}
        <button
          type="button"
          onClick={onMuteToggle}
          className="p-1.5 rounded-md text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors cursor-pointer"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
