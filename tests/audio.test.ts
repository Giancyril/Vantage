/**
 * Unit tests for Vantage Audio Briefing Engine & Storage
 */
import {
  generateBriefingScript,
  synthesizeBriefingAudio,
  formatAudioTime,
  type BriefingArticleInput,
} from "../lib/audio-briefing";
import {
  saveAudioBriefing,
  getAudioBriefing,
  getLatestAudioBriefing,
  listAudioBriefings,
  deleteAudioBriefing,
} from "../lib/audio-storage";

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

export async function runAudioTests() {
  console.log("--> Testing formatAudioTime helper...");
  assertEqual(formatAudioTime(0), "0:00", "0 seconds should format to 0:00");
  assertEqual(formatAudioTime(65), "1:05", "65 seconds should format to 1:05");
  assertEqual(formatAudioTime(180), "3:00", "180 seconds should format to 3:00");
  assertEqual(formatAudioTime(205), "3:25", "205 seconds should format to 3:25");

  console.log("--> Testing generateBriefingScript and segment timing...");
  const mockStories: BriefingArticleInput[] = [
    {
      title: "OpenAI Launches Next-Generation Reasoning Architecture",
      summary: "The new architecture utilizes dynamic test-time search and multi-step verification.",
      whyItMatters: "Directly improves reliability on high-stakes software and quantitative reasoning.",
      source: "TechCrunch",
      url: "https://techcrunch.com/openai-reasoning",
      topic: "AI Agents",
    },
    {
      title: "Anthropic Publishes Model Safety & Interpretability Findings",
      summary: "Researchers demonstrated circuit-level interpretability across frontier transformer layers.",
      whyItMatters: "Accelerates enterprise security compliance for mission-critical deployments.",
      source: "Ars Technica",
      url: "https://arstechnica.com/anthropic-safety",
      topic: "AI Safety",
    },
  ];

  const scriptResult = generateBriefingScript(mockStories, ["AI Agents", "AI Safety"]);

  assert(scriptResult.title.includes("Vantage Executive Briefing"), "Title should have briefing branding");
  assert(scriptResult.segments.length === 4, "Should have 4 segments: intro + 2 stories + outro");
  assert(scriptResult.estimatedDurationSec > 30, "Briefing should have reasonable duration");

  // Check segment alignment
  const [intro, story1, story2, outro] = scriptResult.segments;
  assertEqual(intro.startSec, 0, "Intro must start at 0s");
  assertEqual(story1.startSec, intro.endSec, "Story 1 start must match Intro end");
  assertEqual(story2.startSec, story1.endSec, "Story 2 start must match Story 1 end");
  assertEqual(outro.startSec, story2.endSec, "Outro start must match Story 2 end");
  assertEqual(outro.endSec, scriptResult.estimatedDurationSec, "Outro end must match total duration");

  assert(story1.articleUrl === mockStories[0].url, "Story 1 segment must retain original articleUrl");
  assert(story2.source === mockStories[1].source, "Story 2 segment must retain source");

  console.log("--> Testing synthesizeBriefingAudio (Fallback Procedural Audio Engine)...");
  const audioResult = await synthesizeBriefingAudio(scriptResult.script, "alloy");
  assert(!!audioResult.audioUrl, "Audio URL must not be empty");
  assert(
    audioResult.audioUrl.startsWith("data:audio/"),
    "Audio URL should be a valid audio data URI"
  );
  assert(audioResult.durationSeconds > 0, "Duration must be greater than 0");

  console.log("--> Testing saveAudioBriefing & getAudioBriefing...");
  const testUserId = "test-audio-user-" + Date.now();
  const saved = await saveAudioBriefing({
    userId: testUserId,
    title: scriptResult.title,
    durationSeconds: audioResult.durationSeconds,
    audioUrl: audioResult.audioUrl,
    script: scriptResult.script,
    voice: "alloy",
    segments: scriptResult.segments,
    status: "ready",
  });

  assert(!!saved.id, "Saved record must have an id");
  assertEqual(saved.userId, testUserId, "Saved record must match userId");
  assertEqual(saved.segments.length, 4, "Saved record must preserve segments");

  const fetched = await getAudioBriefing(saved.id, testUserId);
  assert(!!fetched, "Should successfully fetch saved briefing");
  assertEqual(fetched?.id, saved.id, "Fetched ID must match");
  assertEqual(fetched?.title, scriptResult.title, "Fetched title must match");

  console.log("--> Testing getLatestAudioBriefing and listAudioBriefings...");
  const latest = await getLatestAudioBriefing(testUserId);
  assert(!!latest, "Latest briefing must exist");
  assertEqual(latest?.id, saved.id, "Latest briefing ID should match saved ID");

  const list = await listAudioBriefings(testUserId);
  assert(list.length >= 1, "Briefing list should contain at least 1 item");

  console.log("--> Testing deleteAudioBriefing...");
  const deleted = await deleteAudioBriefing(saved.id, testUserId);
  assertEqual(deleted, true, "deleteAudioBriefing should return true");

  console.log("✓ All Audio Briefing Engine & Storage tests passed successfully!");
}

runAudioTests().catch((err) => {
  console.error("Audio test execution failed:", err);
  process.exit(1);
});
