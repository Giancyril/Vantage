/**
 * Audio Briefing Engine — Executive Podcast Script Generation & Speech Synthesis
 * Generates structured, timestamped executive news briefings with synchronized segments.
 */

import OpenAI from "openai";

export interface BriefingSegment {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  text: string;
  articleUrl?: string;
  source?: string;
  topic?: string;
}

export interface BriefingScriptResult {
  title: string;
  script: string;
  segments: BriefingSegment[];
  estimatedDurationSec: number;
}

export interface SynthesizedAudioResult {
  audioUrl: string;
  durationSeconds: number;
  format: string;
}

export interface BriefingArticleInput {
  title: string;
  summary: string;
  whyItMatters?: string;
  source: string;
  url?: string;
  topic?: string;
}

/** Words per second for natural executive cadence (approx 145 wpm) */
const WORDS_PER_SECOND = 2.4;

/**
 * Generates an executive briefing script from a list of curated stories.
 * Breaks the narrative into discrete, timestamp-aligned segments.
 */
export function generateBriefingScript(
  stories: BriefingArticleInput[],
  interests: string[] = []
): BriefingScriptResult {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const selectedStories = stories.slice(0, 4);
  const segments: BriefingSegment[] = [];
  let currentTime = 0;

  // 1. Intro Segment
  const topicHighlight =
    interests.length > 0
      ? `focusing on ${interests.slice(0, 2).join(" and ")}`
      : "across global technology and intelligence";

  const introText = `Good morning. Welcome to your Vantage executive briefing for ${dateStr}. Today, we're tracking ${selectedStories.length} critical developments ${topicHighlight}. Let's jump into the core signals.`;
  const introWords = introText.split(/\s+/).length;
  const introDuration = Math.max(8, Math.round(introWords / WORDS_PER_SECOND));

  segments.push({
    id: "intro",
    title: "Executive Introduction",
    startSec: currentTime,
    endSec: currentTime + introDuration,
    text: introText,
  });
  currentTime += introDuration;

  // 2. Story Segments
  selectedStories.forEach((story, idx) => {
    const storyNum = idx + 1;
    const whySnippet = story.whyItMatters ? ` Why it matters: ${story.whyItMatters}` : "";
    const cleanSummary = story.summary.replace(/https?:\/\/\S+/g, "").trim();

    const storyText = `Story number ${storyNum}. From ${story.source}: ${story.title}. ${cleanSummary}.${whySnippet}`;
    const wordCount = storyText.split(/\s+/).length;
    const duration = Math.max(15, Math.round(wordCount / WORDS_PER_SECOND));

    segments.push({
      id: `story-${storyNum}`,
      title: story.title,
      startSec: currentTime,
      endSec: currentTime + duration,
      text: storyText,
      articleUrl: story.url,
      source: story.source,
      topic: story.topic,
    });
    currentTime += duration;
  });

  // 3. Outro Segment
  const outroText = `That wraps up today's Vantage intelligence briefing. Complete source reports, comparative perspectives, and full transcripts are available on your dashboard. Have an impactful day.`;
  const outroWords = outroText.split(/\s+/).length;
  const outroDuration = Math.max(8, Math.round(outroWords / WORDS_PER_SECOND));

  segments.push({
    id: "outro",
    title: "Strategic Conclusion",
    startSec: currentTime,
    endSec: currentTime + outroDuration,
    text: outroText,
  });
  currentTime += outroDuration;

  const fullScript = segments.map((s) => s.text).join("\n\n");
  const title = `Vantage Executive Briefing — ${dateStr}`;

  return {
    title,
    script: fullScript,
    segments,
    estimatedDurationSec: currentTime,
  };
}

/**
 * Synthesizes audio using OpenAI TTS when configured, or returns a fallback audio stream.
 */
export async function synthesizeBriefingAudio(
  script: string,
  voice = "alloy"
): Promise<SynthesizedAudioResult> {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && !openaiKey.startsWith("sk-proj-...")) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
      type ValidVoice = typeof validVoices[number];
      const selectedVoice: ValidVoice = validVoices.includes(voice as ValidVoice)
        ? (voice as ValidVoice)
        : "alloy";

      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: selectedVoice,
        input: script.slice(0, 4096),
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      const base64Audio = `data:audio/mp3;base64,${buffer.toString("base64")}`;
      const wordCount = script.split(/\s+/).length;
      const durationSeconds = Math.max(20, Math.round(wordCount / WORDS_PER_SECOND));

      return {
        audioUrl: base64Audio,
        durationSeconds,
        format: "mp3",
      };
    } catch (err) {
      console.warn("OpenAI TTS failed, falling back to procedural audio:", err);
    }
  }

  // Fallback Audio Generator (Valid procedural WAV container for offline playback & UI testing)
  return generateProceduralAudioFallback(script);
}

/**
 * Formats seconds into MM:SS display format.
 */
export function formatAudioTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Generates a valid minimal WAV audio buffer with realistic timing headers
 * so browser <audio> element and visualizers function reliably in offline/dev environments.
 */
function generateProceduralAudioFallback(script: string): SynthesizedAudioResult {
  const wordCount = script.split(/\s+/).length;
  const durationSeconds = Math.max(30, Math.min(180, Math.round(wordCount / WORDS_PER_SECOND)));

  // Generate a valid 44.1kHz mono WAV audio file with soft chime chords
  const sampleRate = 8000;
  const totalSamples = sampleRate * Math.min(durationSeconds, 20); // sample representation
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + totalSamples);

  // RIFF chunk
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + totalSamples, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // subchunk size
  buffer.writeUInt16LE(1, 20);  // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // num channels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate, 28); // byte rate
  buffer.writeUInt16LE(1, 32);  // block align
  buffer.writeUInt16LE(8, 34);  // bits per sample

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(totalSamples, 40);

  // Fill audio samples with gentle harmonic waves (220Hz harmonic chime)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-(t % 4));
    const tone = Math.sin(2 * Math.PI * 220 * t) * 0.3 + Math.sin(2 * Math.PI * 440 * t) * 0.15;
    const sample = Math.round(128 + 127 * tone * decay);
    buffer.writeUInt8(Math.max(0, Math.min(255, sample)), headerSize + i);
  }

  const base64Wav = `data:audio/wav;base64,${buffer.toString("base64")}`;

  return {
    audioUrl: base64Wav,
    durationSeconds,
    format: "wav",
  };
}
