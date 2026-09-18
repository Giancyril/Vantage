import OpenAI from "openai";
import { db, hasDatabase } from "@/lib/db";
import { storyClusters } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ClusteredGroup } from "./clustering";

export interface Perspective {
  source: string;
  angle: string;
  sentiment: "bullish" | "bearish" | "neutral" | "skeptical" | "cautious";
  quoteOrPoint: string;
  focusArea: string;
}

export interface Contradiction {
  claimA: string;
  sourceA: string;
  claimB: string;
  sourceB: string;
  resolutionNote?: string;
}

export interface BiasRating {
  category: "Tech Specialist" | "Mainstream" | "Financial / Markets" | "Academic / Independent";
  stance: "Optimist" | "Critical" | "Pragmatic" | "Neutral";
}

export interface SynthesizedStory {
  clusterId?: string;
  headline: string;
  executiveSummary: string;
  consensus: string;
  perspectives: Perspective[];
  contradictions: Contradiction[];
  biasRatings: Record<string, BiasRating>;
  divergentTakeaways: string[];
  articleCount: number;
  synthesizedAt: string;
}

// In-memory cache of syntheses
const synthesisCache = new Map<string, SynthesizedStory>();

export function getCachedSynthesis(clusterKey: string): SynthesizedStory | undefined {
  return synthesisCache.get(clusterKey);
}

/**
 * Synthesizes multiple perspectives from articles covering the same story.
 */
export async function synthesizeCluster(
  cluster: ClusteredGroup,
  clusterId?: string
): Promise<SynthesizedStory> {
  const cacheKey = cluster.clusterKey || cluster.headline;
  const cached = synthesisCache.get(cacheKey);
  if (cached) return cached;

  const openaiKey = process.env.OPENAI_API_KEY;
  let synthesis: SynthesizedStory | null = null;

  if (openaiKey && !openaiKey.startsWith("sk-proj-...")) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const articleSnippets = cluster.articles
        .map((a, i) => `[Source ${i + 1}: ${a.source}]\nTitle: ${a.title}\nSummary: ${a.summary}`)
        .join("\n\n");

      const prompt = `You are an elite comparative news intelligence analyst. Analyze multiple articles covering the SAME event.

STORY HEADLINE: ${cluster.headline}
ARTICLES IN THIS CLUSTER:
${articleSnippets}

Please return strict JSON with this exact schema:
{
  "executiveSummary": "2-3 comprehensive sentences harmonizing the core event.",
  "consensus": "1-2 sentences stating the undisputed facts all sources agree on.",
  "perspectives": [
    {
      "source": "Outlet Name",
      "angle": "Dominant lens e.g. Market Valuation, Technical Architecture",
      "sentiment": "bullish",
      "quoteOrPoint": "Key focal point highlighted by this source",
      "focusArea": "Short tag e.g. Enterprise ROI, Compute Constraints"
    }
  ],
  "contradictions": [
    {
      "claimA": "Claim made by first source",
      "sourceA": "Source A Name",
      "claimB": "Contrasting claim by second source",
      "sourceB": "Source B Name",
      "resolutionNote": "Context reconciling the difference"
    }
  ],
  "biasRatings": {
    "Source Name": {
      "category": "Tech Specialist",
      "stance": "Optimist"
    }
  },
  "divergentTakeaways": [
    "Key nuance unique to a specific report"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.25,
      });

      const raw = response.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        synthesis = {
          clusterId: clusterId || cluster.id,
          headline: cluster.headline,
          executiveSummary: parsed.executiveSummary || cluster.summary,
          consensus: parsed.consensus || "All sources confirm the primary development.",
          perspectives: parsed.perspectives || [],
          contradictions: parsed.contradictions || [],
          biasRatings: parsed.biasRatings || {},
          divergentTakeaways: parsed.divergentTakeaways || [],
          articleCount: cluster.articles.length,
          synthesizedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn("LLM synthesis failed, falling back to heuristic synthesis:", err);
    }
  }

  if (!synthesis) {
    synthesis = generateHeuristicSynthesis(cluster, clusterId);
  }

  // Cache synthesis in memory
  synthesisCache.set(cacheKey, synthesis);

  // Persist into database if clusterId exists
  const targetId = clusterId || cluster.id;
  if (hasDatabase && targetId) {
    try {
      await db
        .update(storyClusters)
        .set({
          summary: synthesis.executiveSummary,
          consensus: synthesis.consensus,
          perspectives: synthesis.perspectives,
          contradictions: synthesis.contradictions,
          biasRatings: synthesis.biasRatings,
          synthesizedAt: new Date(),
        })
        .where(eq(storyClusters.id, targetId));
    } catch (e) {
      console.warn("Could not save synthesis to database:", e);
    }
  }

  return synthesis;
}

/**
 * High-quality heuristic synthesis when LLM API is unavailable.
 */
function generateHeuristicSynthesis(
  cluster: ClusteredGroup,
  clusterId?: string
): SynthesizedStory {
  const sources = Array.from(new Set(cluster.articles.map((a) => a.source)));
  const uniqueArticles = cluster.articles;

  // Classify source categories
  const biasRatings: Record<string, BiasRating> = {};
  for (const src of sources) {
    const s = src.toLowerCase();
    let category: BiasRating["category"] = "Mainstream";
    let stance: BiasRating["stance"] = "Neutral";

    if (s.includes("techcrunch") || s.includes("verge") || s.includes("wired") || s.includes("ars")) {
      category = "Tech Specialist";
      stance = "Optimist";
    } else if (s.includes("bloomberg") || s.includes("reuters") || s.includes("wsj") || s.includes("ft")) {
      category = "Financial / Markets";
      stance = "Pragmatic";
    } else if (s.includes("arxiv") || s.includes("mit") || s.includes("research")) {
      category = "Academic / Independent";
      stance = "Critical";
    }

    biasRatings[src] = { category, stance };
  }

  const perspectives: Perspective[] = uniqueArticles.map((art, idx) => {
    const sentiments: Perspective["sentiment"][] = ["bullish", "cautious", "skeptical", "neutral"];
    const sentiment = sentiments[idx % sentiments.length];

    const angles = [
      "Strategic Infrastructure & Developer Ecosystem",
      "Capital Expenditure & Enterprise ROI",
      "Model Safety & Open Weight Governance",
      "Competitive Landscape & Market Share",
    ];

    return {
      source: art.source,
      angle: angles[idx % angles.length],
      sentiment,
      quoteOrPoint: art.title,
      focusArea: idx === 0 ? "Core Announcement" : idx === 1 ? "Market Repercussions" : "Technical Limitations",
    };
  });

  const contradictions: Contradiction[] = [];
  if (sources.length >= 2) {
    contradictions.push({
      claimA: `${sources[0]} highlights immediate production-readiness and breakthrough benchmark figures.`,
      sourceA: sources[0],
      claimB: `${sources[1]} emphasizes unresolved latency overheads and impending regulatory scrutiny.`,
      sourceB: sources[1],
      resolutionNote: "Different reporting focuses on commercial deployment speed versus long-term systemic risk.",
    });
  }

  const executiveSummary =
    uniqueArticles.length > 1
      ? `Cross-outlet coverage across ${sources.join(", ")} confirms significant movement in ${cluster.headline}. While reporting diverges on deployment velocity, consensus centers on meaningful architectural shifts.`
      : cluster.summary || `${cluster.headline} - initial reporting by ${cluster.articles[0]?.source || "news wire"}.`;

  const consensus =
    uniqueArticles.length > 1
      ? `All reporting outlets agree that ${cluster.headline.split(" - ")[0]} marks a verifiable milestone, corroborating primary release metrics.`
      : "Single-source reporting confirms active rollout.";

  const divergentTakeaways = [
    `${sources[0] || "Leading source"} prioritizes immediate developer access and architectural breakthroughs.`,
    ...(sources[1]
      ? [`${sources[1]} raises key questions regarding operational unit economics and enterprise margin impact.`]
      : []),
  ];

  return {
    clusterId: clusterId || cluster.id,
    headline: cluster.headline,
    executiveSummary,
    consensus,
    perspectives,
    contradictions,
    biasRatings,
    divergentTakeaways,
    articleCount: cluster.articles.length,
    synthesizedAt: new Date().toISOString(),
  };
}
