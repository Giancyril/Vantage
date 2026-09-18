import { NextResponse } from "next/server";
import {
  getClustersForUser,
  runClusteringForUser,
  clusterArticleList,
  setInMemoryClusters,
  type ClusterCandidate,
} from "@/lib/clustering";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

// Rich seed clusters for instant multi-article comparison demonstration
const SEED_ARTICLES: ClusterCandidate[] = [
  // Story 1: Reasoning Models & Frontier Inference
  {
    url: "https://techcrunch.com/2026/02/frontier-inference-reasoning-breakthrough",
    title: "Frontier Labs Unveil Test-Time Compute Scaling at Fraction of Training Cost",
    summary: "New benchmarks indicate dynamic test-time compute can dramatically outperform traditional pretraining scaling, shifting enterprise architectural spend toward real-time reasoning engines.",
    source: "TechCrunch",
    relevanceScore: 0.96,
    topic: "Reasoning Models",
  },
  {
    url: "https://theverge.com/2026/02/reasoning-model-economics-developer-shift",
    title: "Why AI Labs Are Betting the Farm on Inference-Time Reasoning Over Bigger Weights",
    summary: "Developers report 4x lower training budgets but higher per-query token latency as models spend seconds deliberating before returning verifiable math and code solutions.",
    source: "The Verge",
    relevanceScore: 0.92,
    topic: "Reasoning Models",
  },
  {
    url: "https://bloomberg.com/news/2026/02/wall-street-inference-chip-demand-shift",
    title: "Wall Street Recalibrates Chip Projections as Test-Time Compute Multiplies Token Volume",
    summary: "Financial analysts project datacenter utilization will pivot toward high-memory inference clusters rather than pure training megawatt campuses as reasoning workflows multiply queries.",
    source: "Bloomberg",
    relevanceScore: 0.89,
    topic: "Reasoning Models",
  },

  // Story 2: Autonomous Agent Security & Sandboxing Standards
  {
    url: "https://wired.com/story/autonomous-ai-agents-security-sandboxing-protocols",
    title: "Consortium Publishes First Mandatory Security Protocol for Autonomous Desktop Agents",
    summary: "Top security researchers and AI providers establish cryptographically isolated kernel sandboxes to prevent agentic prompt injection and unintended file deletion.",
    source: "Wired",
    relevanceScore: 0.94,
    topic: "Agentic Security",
  },
  {
    url: "https://arstechnica.com/security/2026/02/agent-sandbox-standards-industry-response",
    title: "Open Agent Security Standard Seeks to Stop Prompt-Injection Jailbreaks in Real-World Tools",
    summary: "Security teams examine vulnerabilities in browser-use and computer-controlling agents, noting that standard firewalls fail to inspect multi-step semantic actions.",
    source: "Ars Technica",
    relevanceScore: 0.91,
    topic: "Agentic Security",
  },
  {
    url: "https://reuters.com/technology/eu-regulators-scrutinize-autonomous-ai-actions",
    title: "EU Regulators Issue Preliminary Compliance Guidance on Autonomous Execution Agents",
    summary: "European digital commission flags financial liability questions when autonomous agents conduct purchasing, contract signing, or code merges without human approval.",
    source: "Reuters",
    relevanceScore: 0.87,
    topic: "Agentic Security",
  },

  // Story 3: Open-Weight Frontier Competition
  {
    url: "https://venturebeat.com/ai/open-weight-models-match-proprietary-coding-benchmarks",
    title: "New Open-Weight Model Family Matches Proprietary Frontier Systems on HumanEval",
    summary: "Community-driven quantized releases demonstrate parity on synthetic reasoning benchmarks, enabling on-premise deployments for sensitive enterprise workloads.",
    source: "VentureBeat",
    relevanceScore: 0.93,
    topic: "Open Source AI",
  },
  {
    url: "https://wsj.com/tech/enterprise-ai-open-source-cost-defiance",
    title: "Fortune 500 CIOs Slash SaaS Spend by Self-Hosting Distilled Open Models",
    summary: "Enterprises migrate from multi-million-dollar proprietary API contracts to specialized fine-tuned open checkpoints hosted on private cloud VPCs.",
    source: "Wall Street Journal",
    relevanceScore: 0.88,
    topic: "Open Source AI",
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || DEFAULT_USER_ID;

  let clusters = await getClustersForUser(userId);

  // If no clusters exist yet, seed and cluster demo articles
  if (!clusters || clusters.length === 0) {
    clusters = clusterArticleList(SEED_ARTICLES);
    setInMemoryClusters(clusters);
  }

  const multiArticleCount = clusters.filter((c) => c.articles.length > 1).length;
  const totalArticlesGrouped = clusters.reduce((acc, c) => acc + c.articles.length, 0);

  return NextResponse.json({
    clusters,
    stats: {
      totalClusters: clusters.length,
      multiArticleCount,
      totalArticlesGrouped,
      lastClusteredAt: new Date().toISOString(),
    },
  });
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const body = await req.json().catch(() => ({}));

    const incomingArticles: ClusterCandidate[] = Array.isArray(body.articles)
      ? body.articles
      : SEED_ARTICLES;

    const clusters = await runClusteringForUser(userId, incomingArticles);

    return NextResponse.json({
      success: true,
      message: `Clustered ${incomingArticles.length} articles into ${clusters.length} story clusters.`,
      clusters,
    });
  } catch (error) {
    console.error("Clustering error:", error);
    return NextResponse.json(
      { error: "Failed to cluster articles", details: String(error) },
      { status: 500 }
    );
  }
}
