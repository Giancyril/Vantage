/**
 * Unit tests for Interest Profile and Adaptive Weight Normalization
 */
import { CURATED_TOPICS, getUserInterests, adjustWeights } from "../lib/interests";

async function runInterestTests() {
  console.log("--> Testing Curated Topics Seed Data...");
  if (CURATED_TOPICS.length < 5) throw new Error("Expected at least 5 curated topics");

  console.log("--> Testing User Interests Retrieval...");
  const testUserId = "test-user-001";
  const interests = await getUserInterests(testUserId);
  if (interests.length === 0) throw new Error("Expected seeded interests for test user");

  console.log("--> Testing Dynamic Weight Adjustment...");
  const initialWeight = interests[0].weight;
  await adjustWeights(testUserId, [{ topic: interests[0].topic, delta: 0.15 }]);
  const updated = await getUserInterests(testUserId);
  const newWeight = updated[0].weight;

  if (Math.abs(newWeight - (initialWeight + 0.15)) > 0.001) {
    throw new Error(`Weight adjustment failed: expected ${initialWeight + 0.15}, got ${newWeight}`);
  }

  console.log("[PASS] All interest tests passed successfully.");
}

runInterestTests().catch((err) => {
  console.error("[FAIL] Interest test failed:", err);
  process.exit(1);
});
