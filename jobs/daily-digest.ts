import { getUserInterests } from "@/lib/interests";
import { discoverArticlesForInterests } from "@/lib/discovery";
import { extractBatch } from "@/lib/extraction";
import { analyzeBatchForUser } from "@/lib/analysis";
import { assembleDigest } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/delivery";

export interface PipelineExecutionReport {
  timestamp: string;
  userId: string;
  interestsCount: number;
  discoveredCount: number;
  extractedCount: number;
  analyzedCount: number;
  digestId: string;
  deliverySuccess: boolean;
}

/**
 * Executes the complete 6-stage daily digest pipeline:
 * 1. Read user active interest profile
 * 2. Search & discover candidate articles (Tavily/fallback)
 * 3. Scrape full content (Firecrawl/fallback)
 * 4. Executive AI analysis & "Why it matters" scoring
 * 5. Composite ranking & editorial digest assembly
 * 6. Email delivery (Resend/fallback)
 */
export async function runDailyDigestPipeline(
  userId: string = "00000000-0000-0000-0000-000000000001",
  targetEmail: string = "reader@example.com"
): Promise<PipelineExecutionReport> {
  console.log(`[PIPELINE] Starting daily digest for user ${userId}...`);

  // Step 1: User interests
  const userInterests = await getUserInterests(userId);
  console.log(`[PIPELINE] Step 1: Loaded ${userInterests.length} user interests.`);

  // Step 2: Source Discovery
  const candidates = await discoverArticlesForInterests(userInterests);
  console.log(`[PIPELINE] Step 2: Discovered ${candidates.length} candidate articles.`);

  // Step 3: Content Extraction
  const extracted = await extractBatch(candidates);
  console.log(`[PIPELINE] Step 3: Extracted ${extracted.length} articles.`);

  // Step 4: AI Analysis
  const analyzed = await analyzeBatchForUser(extracted, userInterests);
  console.log(`[PIPELINE] Step 4: Analyzed ${analyzed.length} articles with personal significance.`);

  // Step 5: Assembly
  const digest = await assembleDigest(userId, analyzed, userInterests);
  console.log(`[PIPELINE] Step 5: Assembled digest ${digest.id} with ${digest.totalStories} curated stories.`);

  // Step 6: Delivery
  const delivery = await sendDigestEmail(digest, targetEmail);
  console.log(`[PIPELINE] Step 6: Delivery completed. Success: ${delivery.success}`);

  return {
    timestamp: new Date().toISOString(),
    userId,
    interestsCount: userInterests.length,
    discoveredCount: candidates.length,
    extractedCount: extracted.length,
    analyzedCount: analyzed.length,
    digestId: digest.id,
    deliverySuccess: delivery.success,
  };
}
