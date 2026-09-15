import type { AnalyzedStory } from "@/lib/analysis";
import type { Interest } from "@/db/schema";
import { db } from "@/lib/db";
import { digests, digestItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface DigestSection {
  topic: string;
  weight: number;
  stories: (AnalyzedStory & { rankScore: number })[];
}

export interface AssembledDigest {
  id: string;
  userId: string;
  date: string;
  status: "pending" | "sent" | "failed";
  sections: DigestSection[];
  totalStories: number;
}

// In-memory cache for past digests
const inMemoryDigests: Record<string, AssembledDigest> = {};

export async function assembleDigest(
  userId: string,
  stories: AnalyzedStory[],
  interestsList: Interest[]
): Promise<AssembledDigest> {
  const digestId = `digest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const interestMap = new Map<string, number>();
  for (const i of interestsList) {
    interestMap.set(i.topic, i.weight);
  }

  // 1. Group stories by topic and compute rankScore: relevance * weight
  const grouped: Record<string, (AnalyzedStory & { rankScore: number })[]> = {};

  for (const story of stories) {
    const topicWeight = interestMap.get(story.matchedTopic) ?? 1.0;
    const rankScore = Number((story.relevanceScore * topicWeight).toFixed(3));
    const scoredStory = { ...story, rankScore };

    if (!grouped[story.matchedTopic]) grouped[story.matchedTopic] = [];
    grouped[story.matchedTopic].push(scoredStory);
  }

  // 2. Sort within each topic by rankScore descending, cap top 3 stories per section
  const sections: DigestSection[] = [];
  let totalStories = 0;

  for (const [topic, items] of Object.entries(grouped)) {
    const sorted = items.sort((a, b) => b.rankScore - a.rankScore).slice(0, 3);
    const weight = interestMap.get(topic) ?? 1.0;
    sections.push({ topic, weight, stories: sorted });
    totalStories += sorted.length;
  }

  // Sort sections by interest weight descending
  sections.sort((a, b) => b.weight - a.weight);

  const assembled: AssembledDigest = {
    id: digestId,
    userId,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: "pending",
    sections,
    totalStories,
  };

  // 3. Persist to DB or memory
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const [dRecord] = await db.insert(digests).values({
        userId,
        status: "pending",
      }).returning();

      assembled.id = dRecord.id;

      let rankIdx = 1;
      for (const sec of sections) {
        for (const st of sec.stories) {
          await db.insert(digestItems).values({
            digestId: dRecord.id,
            articleUrl: st.url,
            relevanceScore: st.relevanceScore,
            summary: st.summary,
            whyItMatters: st.whyItMatters,
            rank: rankIdx++,
          });
        }
      }
    }
  } catch (err) {
    console.warn("DB insert failed for digest, using in-memory:", err);
  }

  inMemoryDigests[assembled.id] = assembled;
  return assembled;
}

export async function getDigestById(id: string): Promise<AssembledDigest | null> {
  if (inMemoryDigests[id]) return inMemoryDigests[id];

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const [record] = await db.select().from(digests).where(eq(digests.id, id));
      if (!record) return null;

      const items: Array<{ articleUrl: string; summary: string; relevanceScore: number; whyItMatters: string }> = await db.select().from(digestItems).where(eq(digestItems.digestId, id));
      // Reconstitute sections
      const sections: DigestSection[] = [{
        topic: "Daily Intelligence Briefing",
        weight: 1.0,
        stories: items.map((it) => ({
          url: it.articleUrl,
          title: "Saved Article",
          source: "Publisher",
          summary: it.summary,
          relevanceScore: it.relevanceScore,
          whyItMatters: it.whyItMatters,
          matchedTopic: "General",
          publishedAt: new Date().toISOString(),
          rankScore: it.relevanceScore,
        })),
      }];

      return {
        id: record.id,
        userId: record.userId,
        date: record.createdAt.toLocaleDateString(),
        status: record.status as "pending" | "sent" | "failed",
        sections,
        totalStories: items.length,
      };
    }
  } catch (err) {
    console.warn("Error fetching digest from DB:", err);
  }

  return null;
}

export async function getLatestDigests(userId: string): Promise<AssembledDigest[]> {
  const userDigests = Object.values(inMemoryDigests).filter((d) => d.userId === userId);
  return userDigests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
