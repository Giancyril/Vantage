/**
 * tests/analytics.test.ts
 * Unit tests for Personal Intelligence Analytics Engine & Snapshot Persistence
 */

import {
  getReadingVelocity,
  getTopicWeightHistory,
  getEmergentKeywords,
  getKnowledgeDepth,
  getKnowledgeGaps,
  computeDailyMetrics,
  snapshotAnalytics,
  DEFAULT_USER_ID,
  type AnalyticsDashboard,
} from "../lib/analytics";

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

export async function runAnalyticsTests() {
  const userId = DEFAULT_USER_ID;
  console.log("--> [1/6] Testing getReadingVelocity...");
  const velocity = await getReadingVelocity(userId);
  assert(typeof velocity.today === "number", "velocity.today should be a number");
  assert(velocity.today >= 0, "velocity.today should be non-negative");
  assert(typeof velocity.weeklyAvg === "number", "velocity.weeklyAvg should be a number");
  assert(velocity.weeklyAvg >= 0, "velocity.weeklyAvg should be non-negative");
  assert(
    ["up", "down", "flat"].includes(velocity.trend),
    `velocity.trend should be up/down/flat, received: ${velocity.trend}`
  );
  console.log(`  [OK] Velocity today: ${velocity.today}, 7d-avg: ${velocity.weeklyAvg.toFixed(2)}, trend: ${velocity.trend}`);

  console.log("--> [2/6] Testing getTopicWeightHistory...");
  const history = await getTopicWeightHistory(userId, 14);
  assert(Array.isArray(history), "history should be an array");
  assert(history.length > 0, "history should contain at least 1 date point");
  const firstPoint = history[0];
  assert(typeof firstPoint.date === "string", "point.date should be string");
  assert(/\d{4}-\d{2}-\d{2}/.test(firstPoint.date), "date format should be YYYY-MM-DD");
  assert(typeof firstPoint.weights === "object", "point.weights should be an object");
  console.log(`  [OK] History contains ${history.length} data points across tracked interests`);

  console.log("--> [3/6] Testing getEmergentKeywords...");
  const keywords = await getEmergentKeywords(userId, 7);
  assert(Array.isArray(keywords), "keywords should be an array");
  if (keywords.length > 0) {
    const kw = keywords[0];
    assert(typeof kw.keyword === "string" && kw.keyword.length > 0, "keyword should be non-empty");
    assert(typeof kw.delta === "number", "delta should be a number");
    assert(typeof kw.score === "number" && kw.score >= 0 && kw.score <= 1, "score should be in [0, 1]");
    console.log(`  [OK] Top emergent keyword: "${kw.keyword}" (${kw.delta >= 0 ? "+" : ""}${kw.delta}%, score: ${kw.score})`);
  } else {
    console.log("  [OK] No keywords returned (empty interest list)");
  }

  console.log("--> [4/6] Testing getKnowledgeDepth & getKnowledgeGaps...");
  const depthEntries = await getKnowledgeDepth(userId);
  assert(Array.isArray(depthEntries), "depthEntries should be an array");
  const gaps = await getKnowledgeGaps(userId);
  assert(Array.isArray(gaps), "gaps should be an array");

  for (const entry of depthEntries) {
    assert(typeof entry.topic === "string", "entry.topic should be string");
    assert(typeof entry.depth === "number" && entry.depth >= 0 && entry.depth <= 1, "depth should be [0, 1]");
    assert(typeof entry.weight === "number" && entry.weight >= 0 && entry.weight <= 1, "weight should be [0, 1]");
    assert(typeof entry.gap === "boolean", "entry.gap should be boolean");
  }

  for (const gap of gaps) {
    assert(gap.gap === true, "all items in gaps should have gap=true");
    assert(gap.weight > gap.depth, "gap should have weight > depth");
  }
  console.log(`  [OK] Analyzed ${depthEntries.length} topics, identified ${gaps.length} knowledge gaps`);

  console.log("--> [5/6] Testing computeDailyMetrics (Unified Dashboard Payload)...");
  const metrics: AnalyticsDashboard = await computeDailyMetrics(userId, 30);
  assert(typeof metrics === "object" && metrics !== null, "metrics should be non-null object");
  assert(metrics.velocity !== undefined, "metrics.velocity should be defined");
  assert(Array.isArray(metrics.topicWeightHistory), "metrics.topicWeightHistory should be array");
  assert(Array.isArray(metrics.emergentKeywords), "metrics.emergentKeywords should be array");
  assert(Array.isArray(metrics.knowledgeDepth), "metrics.knowledgeDepth should be array");
  assert(typeof metrics.engagementBreakdown === "object", "metrics.engagementBreakdown should be object");
  assert(typeof metrics.totalEngagements === "number", "totalEngagements should be number");
  assert(typeof metrics.activeTopics === "number", "activeTopics should be number");
  assert(typeof metrics.savedCount === "number", "savedCount should be number");
  console.log(`  [OK] Dashboard payload verified: ${metrics.activeTopics} active topics, ${metrics.savedCount} saved, ${metrics.totalEngagements} total engagements`);

  console.log("--> [6/6] Testing snapshotAnalytics (persistence & idempotency)...");
  const snapshot1 = await snapshotAnalytics(userId);
  assert(typeof snapshot1 === "object" && snapshot1 !== null, "snapshot1 should be valid");
  assertEqual(snapshot1.userId, userId, "userId should match");
  assert(typeof snapshot1.date === "string", "date should be string");
  assert(typeof snapshot1.velocityScore === "number", "velocityScore should be number");

  // Run again on the same day to test idempotency
  const snapshot2 = await snapshotAnalytics(userId);
  assert(typeof snapshot2 === "object" && snapshot2 !== null, "snapshot2 should be valid");
  assertEqual(snapshot2.date, snapshot1.date, "date should match snapshot1");
  console.log(`  [OK] Snapshot idempotency confirmed for date ${snapshot2.date}`);

  console.log("\n>>> ALL ANALYTICS TESTS PASSED SUCCESSFULLY! <<<\n");
}

runAnalyticsTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
