/**
 * Unit tests for Similarity, Agglomerative Clustering, and Comparative Synthesis
 */
import {
  cosineSimilarity,
  jaccardTitleSimilarity,
  articleSimilarity,
  generateClusterKey,
  extractKeywordFingerprint,
} from "../lib/similarity";
import { clusterArticleList, type ClusterCandidate } from "../lib/clustering";
import { synthesizeCluster } from "../lib/synthesis";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${actual} !== ${expected}. ${message || ""}`);
  }
}

export async function runClusteringTests() {
  console.log("--> Testing cosineSimilarity...");
  const vecA = new Map<string, number>([
    ["reasoning", 0.5],
    ["model", 0.5],
  ]);
  const vecB = new Map<string, number>([
    ["reasoning", 0.5],
    ["model", 0.5],
  ]);
  const vecC = new Map<string, number>([
    ["gardening", 0.8],
    ["flowers", 0.6],
  ]);

  const simIdentical = cosineSimilarity(vecA, vecB);
  assertEqual(Math.round(simIdentical * 100) / 100, 1, "Identical vectors must have cosine sim 1.0");

  const simDisjoint = cosineSimilarity(vecA, vecC);
  assertEqual(simDisjoint, 0, "Disjoint vectors must have cosine sim 0.0");

  console.log("--> Testing jaccardTitleSimilarity...");
  const titleA = "OpenAI Unveils New Test-Time Reasoning Model Architecture";
  const titleB = "New Reasoning Model Architecture Unveiled by OpenAI";
  const titleC = "Premier League Football Weekend Results and Standings";

  const simOverlap = jaccardTitleSimilarity(titleA, titleB);
  assert(simOverlap >= 0.5, `Expected high lexical overlap, got ${simOverlap}`);

  const simZero = jaccardTitleSimilarity(titleA, titleC);
  assertEqual(simZero, 0, "Unrelated headlines must have zero jaccard overlap");

  console.log("--> Testing generateClusterKey...");
  const title = "Frontier Labs Unveil Test-Time Compute Scaling at Low Cost";
  const key = generateClusterKey(title);
  assert(key.length > 5, "Cluster key must be generated");
  assert(!key.includes(" "), "Cluster key must not contain spaces");

  console.log("--> Testing clusterArticleList agglomerative grouping...");
  const candidates: ClusterCandidate[] = [
    {
      url: "https://techcrunch.com/article1",
      title: "Frontier Labs Unveil Test-Time Compute Scaling",
      summary: "Dynamic test-time compute can dramatically outperform traditional pretraining scaling.",
      source: "TechCrunch",
      relevanceScore: 0.95,
      topic: "Reasoning Models",
    },
    {
      url: "https://theverge.com/article2",
      title: "Why AI Labs Are Betting on Test-Time Compute and Reasoning",
      summary: "Developers report 4x lower training budgets but higher inference reasoning costs.",
      source: "The Verge",
      relevanceScore: 0.92,
      topic: "Reasoning Models",
    },
    {
      url: "https://wired.com/article3",
      title: "Sandboxing Protocols Established for Autonomous Agent Security",
      summary: "Security researchers establish cryptographically isolated kernel sandboxes.",
      source: "Wired",
      relevanceScore: 0.88,
      topic: "Agentic Security",
    },
  ];

  const clusters = clusterArticleList(candidates);
  assert(clusters.length >= 2, "Should partition candidates into at least 2 distinct clusters");

  const reasoningCluster = clusters.find((c) => c.articles.length === 2);
  assert(Boolean(reasoningCluster), "Should form a 2-source cluster for the reasoning story");
  assertEqual(reasoningCluster?.articles.length, 2, "Reasoning cluster must have 2 articles");

  const securityCluster = clusters.find((c) => c.articles.some((a) => a.source === "Wired"));
  assert(Boolean(securityCluster), "Wired story should be in its own cluster");
  assertEqual(securityCluster?.articles.length, 1, "Security cluster must have 1 article");

  console.log("--> Testing synthesizeCluster heuristics & perspective matrix...");
  const sampleCluster = {
    clusterKey: "compute-frontier-reasoning-scaling",
    headline: "Frontier Labs Unveil Test-Time Compute Scaling",
    summary: "Dynamic test-time compute can dramatically outperform traditional pretraining scaling.",
    relevanceScore: 0.94,
    articleCount: 2,
    articles: [
      {
        url: "https://techcrunch.com/a1",
        title: "Frontier Labs Unveil Test-Time Compute Scaling",
        summary: "Dynamic test-time compute can dramatically outperform traditional pretraining scaling.",
        source: "TechCrunch",
        relevanceScore: 0.95,
      },
      {
        url: "https://bloomberg.com/a2",
        title: "Wall Street Recalibrates Chip Projections on Inference Shift",
        summary: "Financial analysts project datacenter utilization will pivot toward memory bandwidth.",
        source: "Bloomberg",
        relevanceScore: 0.90,
      },
    ],
  };

  const synthesis = await synthesizeCluster(sampleCluster);
  assert(synthesis.consensus.length > 10, "Consensus facts should be present");
  assertEqual(synthesis.perspectives.length, 2, "Should extract 2 perspective angles");
  assert(synthesis.perspectives.some((p) => p.source === "TechCrunch"), "Should contain TechCrunch perspective");
  assert(synthesis.perspectives.some((p) => p.source === "Bloomberg"), "Should contain Bloomberg perspective");
  assert(Boolean(synthesis.biasRatings["TechCrunch"]), "Should classify TechCrunch bias rating");
  assert(Boolean(synthesis.biasRatings["Bloomberg"]), "Should classify Bloomberg bias rating");

  console.log("[PASS] All story clustering and synthesis tests passed successfully.");
}

runClusteringTests().catch((err: unknown) => {
  console.error("[FAIL] Clustering test failed:", err);
  process.exit(1);
});
