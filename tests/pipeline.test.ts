/**
 * End-to-end Pipeline Verification Test
 * Tests: Discovery -> Extraction -> Analysis -> Assembly -> Delivery
 */
import { runDailyDigestPipeline } from "../jobs/daily-digest";

async function runPipelineTests() {
  console.log("--> Executing End-to-End Pipeline test...");
  const report = await runDailyDigestPipeline("test-user-pipeline", "verify@example.com");

  console.log("--> Pipeline Execution Report:", report);
  if (report.discoveredCount === 0) throw new Error("Pipeline discovered 0 articles");
  if (report.analyzedCount === 0) throw new Error("Pipeline analyzed 0 articles");
  if (!report.digestId) throw new Error("Missing digestId in execution report");
  if (!report.deliverySuccess) throw new Error("Delivery failed in test");

  console.log("[PASS] End-to-End Pipeline test passed successfully.");
}

runPipelineTests().catch((err) => {
  console.error("[FAIL] Pipeline test failed:", err);
  process.exit(1);
});
