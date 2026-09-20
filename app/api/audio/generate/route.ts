import { NextResponse } from "next/server";
import {
  generateBriefingScript,
  synthesizeBriefingAudio,
  type BriefingArticleInput,
} from "@/lib/audio-briefing";
import { saveAudioBriefing } from "@/lib/audio-storage";
import { getUserInterests } from "@/lib/interests";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || DEFAULT_USER_ID;
    const voice = body.voice || "alloy";
    const digestId = body.digestId;
    let articles: BriefingArticleInput[] = body.articles || [];

    // Gather user interests for personal intro framing
    let interestTopics: string[] = [];
    try {
      const userInterests = await getUserInterests(userId);
      interestTopics = userInterests.map((i) => i.topic);
    } catch {
      interestTopics = ["AI Agents", "Tech Infrastructure"];
    }

    if (!articles || articles.length === 0) {
      articles = [
        {
          title: "Frontier Lab Benchmarks Show Autonomous Agent Chains Outperform Monolithic Prompts by 4.2x",
          summary: "New empirical evaluations on long-horizon reasoning tasks demonstrate that multi-agent delegation frameworks achieve state of the art task completion with 60% lower latency.",
          whyItMatters: "Validates a structural shift away from single prompts towards distributed agent topologies.",
          source: "Ars Technica",
          topic: "AI Agents & Autonomous Systems",
          url: "https://arstechnica.com/ai/frontier-agent-benchmarks",
        },
        {
          title: "Next-Gen Silicon Architectures Accelerate Inference Throughput by 300%",
          summary: "Breakthrough packaging technologies and high-bandwidth interconnects significantly lower enterprise inference unit economics.",
          whyItMatters: "Directly improves margin profiles for AI-first applications operating at scale.",
          source: "Semiconductor Today",
          topic: "Machine Learning Infrastructure & Silicon",
          url: "https://semiconductortoday.com/next-gen-silicon",
        },
        {
          title: "Clean Grid Modernization Frameworks Approved for High-Density Datacenters",
          summary: "New regulatory compacts allow datacenter operators to co-locate dedicated renewable generation facilities with prioritized interconnection.",
          whyItMatters: "Relieves compute expansion constraints facing hyperscale AI training clusters.",
          source: "Reuters Energy",
          topic: "Clean Energy & Grid Modernization",
          url: "https://reuters.com/business/energy/clean-grid-frameworks",
        },
      ];
    }

    // 1. Generate Structured Broadcast Script with Timestamp Alignment
    const scriptResult = generateBriefingScript(articles, interestTopics);

    // 2. Synthesize Speech Audio (OpenAI TTS or Procedural Audio Fallback)
    const audioResult = await synthesizeBriefingAudio(scriptResult.script, voice);

    // 3. Persist to Database and In-Memory Cache
    const record = await saveAudioBriefing({
      userId,
      digestId,
      title: scriptResult.title,
      durationSeconds: audioResult.durationSeconds || scriptResult.estimatedDurationSec,
      audioUrl: audioResult.audioUrl,
      script: scriptResult.script,
      voice,
      segments: scriptResult.segments,
      status: "ready",
    });

    return NextResponse.json({
      success: true,
      briefing: record,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Audio generation failed";
    console.error("Audio generation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
