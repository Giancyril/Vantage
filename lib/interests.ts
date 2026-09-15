import { db } from "@/lib/db";
import { interests, users, type Interest, type NewInterest } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface CuratedTopic {
  id: string;
  topic: string;
  description: string;
  defaultKeywords: string[];
  defaultSources: string[];
  category: "AI & Technology" | "Science & Space" | "Markets & Finance" | "Energy & Climate" | "Culture & Ideas";
}

export const CURATED_TOPICS: CuratedTopic[] = [
  {
    id: "ai-systems",
    topic: "AI Agents & Autonomous Systems",
    description: "LLM agents, tool-use architectures, reinforcement learning from environment feedback, and cognitive agent patterns.",
    defaultKeywords: ["AI agents", "autonomous systems", "reasoning models", "tool calling", "multi-agent architecture", "inference scaling"],
    defaultSources: ["https://news.ycombinator.com", "https://arxiv.org/list/cs.AI/recent", "https://theverge.com"],
    category: "AI & Technology"
  },
  {
    id: "ml-infra",
    topic: "Machine Learning Infrastructure & Silicon",
    description: "GPU clusters, custom AI accelerators, distributed training pipelines, and quantized inference runtimes.",
    defaultKeywords: ["Nvidia GPUs", "TPUs", "inference optimization", "CUDA", "vLLM", "semiconductor packaging"],
    defaultSources: ["https://semianalysis.com", "https://anandtech.com"],
    category: "AI & Technology"
  },
  {
    id: "clean-energy",
    topic: "Clean Energy & Grid Modernization",
    description: "Next-gen solar, solid-state batteries, modular nuclear fission/fusion, and virtual power plants.",
    defaultKeywords: ["grid storage", "sodium-ion batteries", "SMR nuclear", "geothermal energy", "power transmission"],
    defaultSources: ["https://canarymedia.com", "https://cleantechnica.com"],
    category: "Energy & Climate"
  },
  {
    id: "venture-tech",
    topic: "Venture Capital & Tech Ecosystems",
    description: "Seed & Series A funding rounds, software multiples, founder trends, and tech IPO dynamics.",
    defaultKeywords: ["venture capital", "seed rounds", "tech valuation", "SaaS metrics", "founder liquidity"],
    defaultSources: ["https://techcrunch.com", "https://theinformation.com"],
    category: "Markets & Finance"
  },
  {
    id: "biotech-crispr",
    topic: "Synthetic Biology & CRISPR Therapeutics",
    description: "Gene editing breakthroughs, mRNA platforms, computational protein folding, and longevity trials.",
    defaultKeywords: ["CRISPR Cas9", "mRNA vaccines", "protein design", "AlphaFold", "cellular reprogramming"],
    defaultSources: ["https://nature.com", "https://statnews.com"],
    category: "Science & Space"
  },
  {
    id: "space-aerospace",
    topic: "Commercial Space & Aerospace",
    description: "Orbital launch economics, reusable heavy-lift rockets, lunar missions, and satellite mega-constellations.",
    defaultKeywords: ["Starship", "reusable rockets", "lunar lander", "LEO satellites", "propulsion systems"],
    defaultSources: ["https://spacenews.com", "https://arstechnica.com"],
    category: "Science & Space"
  }
];

// Fallback in-memory store for dev / local testing when DATABASE_URL is not yet connected
const inMemoryInterests: Record<string, Interest[]> = {};

export async function getUserInterests(userId: string): Promise<Interest[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      return await db.select().from(interests).where(eq(interests.userId, userId));
    }
  } catch (err) {
    console.warn("DB not reachable, using in-memory store for interests:", err);
  }

  return inMemoryInterests[userId] || seedMemoryInterests(userId);
}

function seedMemoryInterests(userId: string): Interest[] {
  const defaults: Interest[] = CURATED_TOPICS.slice(0, 3).map((ct, idx) => ({
    id: `local-interest-${idx + 1}`,
    userId,
    topic: ct.topic,
    keywords: ct.defaultKeywords,
    sourceUrls: ct.defaultSources,
    weight: 1.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  inMemoryInterests[userId] = defaults;
  return defaults;
}

export async function addInterest(userId: string, data: { topic: string; keywords: string[]; sourceUrls?: string[]; weight?: number }): Promise<Interest> {
  const newRecord: Interest = {
    id: `interest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    topic: data.topic,
    keywords: data.keywords,
    sourceUrls: data.sourceUrls || [],
    weight: data.weight ?? 1.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const [inserted] = await db.insert(interests).values({
        userId,
        topic: data.topic,
        keywords: data.keywords,
        sourceUrls: data.sourceUrls || [],
        weight: data.weight ?? 1.0,
      }).returning();
      return inserted;
    }
  } catch (err) {
    console.warn("DB insert failed, falling back to in-memory:", err);
  }

  if (!inMemoryInterests[userId]) inMemoryInterests[userId] = [];
  inMemoryInterests[userId].push(newRecord);
  return newRecord;
}

export async function updateInterestWeight(id: string, weight: number): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      await db.update(interests).set({ weight, updatedAt: new Date() }).where(eq(interests.id, id));
      return true;
    }
  } catch (err) {
    console.warn("DB update failed, updating in-memory:", err);
  }

  for (const uid in inMemoryInterests) {
    const item = inMemoryInterests[uid].find((i) => i.id === id);
    if (item) {
      item.weight = weight;
      item.updatedAt = new Date();
      return true;
    }
  }
  return false;
}

export async function removeInterest(id: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      await db.delete(interests).where(eq(interests.id, id));
      return true;
    }
  } catch (err) {
    console.warn("DB delete failed, deleting from in-memory:", err);
  }

  for (const uid in inMemoryInterests) {
    const idx = inMemoryInterests[uid].findIndex((i) => i.id === id);
    if (idx !== -1) {
      inMemoryInterests[uid].splice(idx, 1);
      return true;
    }
  }
  return false;
}

export async function seedStarterTopics(userId: string, topicIds: string[]): Promise<Interest[]> {
  const selectedTopics = CURATED_TOPICS.filter((ct) => topicIds.includes(ct.id));
  const created: Interest[] = [];

  for (const topic of selectedTopics) {
    const record = await addInterest(userId, {
      topic: topic.topic,
      keywords: topic.defaultKeywords,
      sourceUrls: topic.defaultSources,
      weight: 1.0,
    });
    created.push(record);
  }

  return created;
}

export async function adjustWeights(userId: string, signals: Array<{ topic: string; delta: number }>): Promise<void> {
  const current = await getUserInterests(userId);
  for (const signal of signals) {
    const matching = current.find(
      (i) => i.topic.toLowerCase().includes(signal.topic.toLowerCase()) || signal.topic.toLowerCase().includes(i.topic.toLowerCase())
    );
    if (matching) {
      const newWeight = Math.max(0.2, Math.min(3.0, matching.weight + signal.delta));
      await updateInterestWeight(matching.id, Number(newWeight.toFixed(2)));
    }
  }
}
