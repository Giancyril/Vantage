import { db } from "@/lib/db";
import { engagementEvents, type EngagementEvent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adjustWeights } from "@/lib/interests";

const inMemoryEvents: EngagementEvent[] = [];

export interface TrackEventPayload {
  userId: string;
  articleUrl: string;
  eventType: "open" | "click" | "save" | "dismiss" | "more_like_this" | "less_like_this";
  topic?: string;
  metadata?: Record<string, any>;
}

export async function recordEngagement(payload: TrackEventPayload): Promise<EngagementEvent> {
  const record: EngagementEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: payload.userId,
    articleUrl: payload.articleUrl,
    eventType: payload.eventType,
    metadata: { ...payload.metadata, topic: payload.topic },
    createdAt: new Date(),
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const [inserted] = await db.insert(engagementEvents).values({
        userId: payload.userId,
        articleUrl: payload.articleUrl,
        eventType: payload.eventType,
        metadata: { ...payload.metadata, topic: payload.topic },
      }).returning();
      return inserted;
    }
  } catch (err) {
    console.warn("DB insert error for engagement event:", err);
  }

  inMemoryEvents.push(record);

  // Immediate adaptive feedback adjustment
  if (payload.topic) {
    let delta = 0;
    if (payload.eventType === "save" || payload.eventType === "click") delta = 0.05;
    if (payload.eventType === "more_like_this") delta = 0.15;
    if (payload.eventType === "dismiss" || payload.eventType === "less_like_this") delta = -0.10;

    if (delta !== 0) {
      await adjustWeights(payload.userId, [{ topic: payload.topic, delta }]);
    }
  }

  return record;
}

export async function getRecentEngagementEvents(userId: string): Promise<EngagementEvent[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      return await db.select().from(engagementEvents).where(eq(engagementEvents.userId, userId));
    }
  } catch (err) {
    console.warn("DB select failed for engagement events:", err);
  }

  return inMemoryEvents.filter((e) => e.userId === userId);
}

export async function getSavedArticles(userId: string): Promise<string[]> {
  const events = await getRecentEngagementEvents(userId);
  const savedUrls = new Set<string>();

  for (const ev of events) {
    if (ev.eventType === "save") {
      savedUrls.add(ev.articleUrl);
    } else if (ev.eventType === "dismiss") {
      savedUrls.delete(ev.articleUrl);
    }
  }

  return Array.from(savedUrls);
}
