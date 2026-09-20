"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Play, Pause, Headphones, Maximize2, X } from "lucide-react";
import type { BriefingRecord } from "@/lib/audio-storage";
import type { BriefingArticleInput } from "@/lib/audio-briefing";
import { formatAudioTime } from "@/lib/audio-briefing";
import { AudioBriefingModal } from "@/components/AudioBriefingModal";

interface AudioContextValue {
  briefing: BriefingRecord | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  isLoading: boolean;
  isModalOpen: boolean;
  playBriefing: (briefing: BriefingRecord) => void;
  generateAndPlay: (articles?: BriefingArticleInput[]) => Promise<void>;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setRate: (rate: number) => void;
  toggleMute: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const AudioStateContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [briefing, setBriefing] = useState<BriefingRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const playBriefing = useCallback((record: BriefingRecord) => {
    setBriefing(record);
    setDuration(record.durationSeconds || 180);
    setCurrentTime(0);

    if (audioRef.current && record.audioUrl) {
      audioRef.current.src = record.audioUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay blocked or audio load error:", err);
      });
    }
  }, [playbackRate, isMuted]);

  const generateAndPlay = useCallback(async (articles?: BriefingArticleInput[]) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles }),
      });

      if (!res.ok) {
        throw new Error("Failed to synthesize briefing audio");
      }

      const data = await res.json();
      if (data.briefing) {
        playBriefing(data.briefing);
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error("generateAndPlay error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [playBriefing]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.warn);
    }
  }, [isPlaying]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const skip = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const nextTime = Math.max(0, Math.min(audioRef.current.currentTime + delta, duration));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [duration]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const value: AudioContextValue = {
    briefing,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isMuted,
    isLoading,
    isModalOpen,
    playBriefing,
    generateAndPlay,
    togglePlay,
    seek,
    skip,
    setRate,
    toggleMute,
    openModal,
    closeModal,
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Floating Mini-Player at bottom of screen when audio is active
  const floatingMiniPlayer = mounted && briefing && !isModalOpen ? (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-[#181715] text-white rounded-full p-2 pl-4 shadow-2xl border border-stone-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
      <div
        onClick={openModal}
        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1 group"
      >
        <div className="w-7 h-7 rounded-full bg-amber-400 text-[#181715] flex items-center justify-center shrink-0 shadow-xs">
          <Headphones className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate group-hover:text-amber-300 transition-colors">
            {briefing.title}
          </div>
          <div className="text-[10px] text-stone-400 font-mono">
            {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 pr-1">
        <button
          type="button"
          onClick={togglePlay}
          className="p-2 rounded-full bg-white text-[#181715] hover:bg-amber-400 transition-colors cursor-pointer"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={openModal}
          className="p-2 rounded-full text-stone-400 hover:text-white transition-colors cursor-pointer"
          title="Expand briefing suite"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            setBriefing(null);
          }}
          className="p-2 rounded-full text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
          title="Dismiss player"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thin Bottom Progress Indicator */}
      <div
        style={{ width: `${progressPct}%` }}
        className="absolute bottom-0 left-4 right-4 h-0.5 bg-amber-400 rounded-full transition-all duration-150"
      />
    </div>
  ) : null;

  return (
    <AudioStateContext.Provider value={value}>
      {children}

      {/* Floating mini bar */}
      {floatingMiniPlayer && createPortal(floatingMiniPlayer, document.body)}

      {/* Full Modal Audio Suite */}
      <AudioBriefingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        briefing={briefing}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        isMuted={isMuted}
        isLoading={isLoading}
        onPlayPause={togglePlay}
        onSeek={seek}
        onSkip={skip}
        onRateChange={setRate}
        onMuteToggle={toggleMute}
        onRegenerate={() => generateAndPlay()}
      />
    </AudioStateContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioStateContext);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
}
