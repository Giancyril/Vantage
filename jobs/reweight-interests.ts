import { adjustWeights } from "@/lib/interests";
import { getRecentEngagementEvents } from "@/lib/feedback";

/**
 * Adaptive Feedback Loop:
 * Reads engagement events from the past 24 hours and adapts topic weights:
 * - Read / Save: +0.05
 * - Explicit 'More like this': +0.15
 * - Dismiss / 'Less like this': -0.10
 */
export async function runReweightJob(userId: string = "00000000-0000-0000-0000-000000000001"): Promise<{ updatedCount: number }> {
  const events = await getRecentEngagementEvents(userId);
  const signals: Array<{ topic: string; delta: number }> = [];

  for (const ev of events) {
    const meta = ev.metadata as Record<string, string> | null;
    const topic = meta?.topic;
    if (!topic) continue;

    if (ev.eventType === "save" || ev.eventType === "click") {
      signals.push({ topic, delta: 0.05 });
    } else if (ev.eventType === "more_like_this") {
      signals.push({ topic, delta: 0.15 });
    } else if (ev.eventType === "dismiss" || ev.eventType === "less_like_this") {
      signals.push({ topic, delta: -0.10 });
    }
  }

  if (signals.length > 0) {
    await adjustWeights(userId, signals);
  }

  return { updatedCount: signals.length };
}
