import { db } from "@/lib/db";
import { feedSources, type FeedSource, type NewFeedSource } from "@/db/schema";
import { eq } from "drizzle-orm";
import { discoverFeed } from "./feedDiscovery";
import { fetchAndParseFeed } from "./rss";

export interface CuratedFeedPreset {
  id: string;
  title: string;
  feedUrl: string;
  siteUrl: string;
  category: "AI & Tech" | "Venture & Startups" | "Engineering & Research" | "Markets";
  description: string;
  feedType: "rss" | "atom" | "substack";
}

export const CURATED_FEED_PRESETS: CuratedFeedPreset[] = [
  {
    id: "hn-frontpage",
    title: "Hacker News (Top)",
    feedUrl: "https://news.ycombinator.com/rss",
    siteUrl: "https://news.ycombinator.com",
    category: "AI & Tech",
    description: "Curated top engineering, startup, and technology discussions.",
    feedType: "rss",
  },
  {
    id: "simonw",
    title: "Simon Willison's Weblog",
    feedUrl: "https://simonwillison.net/atom/everything/",
    siteUrl: "https://simonwillison.net",
    category: "AI & Tech",
    description: "Deep technical analysis of LLMs, prompt engineering, and modern web architectures.",
    feedType: "atom",
  },
  {
    id: "verge-tech",
    title: "The Verge - Tech",
    feedUrl: "https://www.theverge.com/rss/index.xml",
    siteUrl: "https://www.theverge.com",
    category: "AI & Tech",
    description: "Mainstream technology developments, policy, consumer hardware, and AI.",
    feedType: "rss",
  },
  {
    id: "stratechery",
    title: "Stratechery",
    feedUrl: "https://stratechery.com/feed/",
    siteUrl: "https://stratechery.com",
    category: "Venture & Startups",
    description: "Ben Thompson on tech strategy, aggregation theory, and ecosystem shifts.",
    feedType: "rss",
  },
  {
    id: "mit-tech-review",
    title: "MIT Technology Review",
    feedUrl: "https://www.technologyreview.com/feed/",
    siteUrl: "https://www.technologyreview.com",
    category: "Engineering & Research",
    description: "Authoritative journalism on emerging technologies, biotechnology, and AI ethics.",
    feedType: "rss",
  },
];

const inMemorySources: Record<string, FeedSource> = {};

export async function getFeedSources(userId: string): Promise<FeedSource[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const rows = await db.select().from(feedSources).where(eq(feedSources.userId, userId));
      return rows;
    }
  } catch (err) {
    console.warn("DB select failed, using memory sources:", err);
  }
  return Object.values(inMemorySources).filter((s) => s.userId === userId);
}

export async function addFeedSource(
  userId: string,
  inputUrl: string,
  customTitle?: string
): Promise<{ success: boolean; source?: FeedSource; error?: string }> {
  try {
    // 1. Discover actual feed URL if user gave homepage
    const discovery = await discoverFeed(inputUrl);
    if (!discovery.found) {
      return { success: false, error: discovery.error || "Could not find a valid RSS or Atom feed at this URL." };
    }

    // 2. Validate feed by parsing it
    let feedTitle = customTitle || discovery.title;
    try {
      const parsed = await fetchAndParseFeed(discovery.feedUrl);
      if (!feedTitle) feedTitle = parsed.title;
    } catch {
      // If live test fetch fails, we still allow adding if title is provided
      if (!feedTitle) feedTitle = new URL(discovery.feedUrl).hostname;
    }

    const newSourceData: NewFeedSource = {
      userId,
      url: discovery.feedUrl,
      title: feedTitle || discovery.feedUrl,
      siteUrl: discovery.originalUrl,
      feedType: discovery.feedType,
      fetchStatus: "healthy",
      failureCount: 0,
      isActive: 1,
    };

    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
        const [inserted] = await db.insert(feedSources).values(newSourceData).returning();
        return { success: true, source: inserted };
      }
    } catch (err) {
      console.warn("DB insert failed, using memory fallback:", err);
    }

    const mockId = "source-" + Date.now();
    const fallbackSource: FeedSource = {
      id: mockId,
      userId,
      url: newSourceData.url,
      title: newSourceData.title,
      siteUrl: newSourceData.siteUrl ?? null,
      feedType: newSourceData.feedType ?? "rss",
      fetchStatus: newSourceData.fetchStatus ?? "healthy",
      failureCount: newSourceData.failureCount ?? 0,
      errorMessage: null,
      etag: null,
      isActive: newSourceData.isActive ?? 1,
      lastFetchedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemorySources[mockId] = fallbackSource;
    return { success: true, source: fallbackSource };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function updateFeedStatus(
  id: string,
  status: "healthy" | "warning" | "error",
  errorMessage?: string
): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      await db
        .update(feedSources)
        .set({
          fetchStatus: status,
          errorMessage: errorMessage || null,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(feedSources.id, id));
      return true;
    }
  } catch (err) {
    console.warn("DB update failed:", err);
  }

  if (inMemorySources[id]) {
    inMemorySources[id].fetchStatus = status;
    inMemorySources[id].errorMessage = errorMessage || null;
    inMemorySources[id].lastFetchedAt = new Date();
    return true;
  }
  return false;
}

export async function deleteFeedSource(id: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      await db.delete(feedSources).where(eq(feedSources.id, id));
      return true;
    }
  } catch (err) {
    console.warn("DB delete failed:", err);
  }
  delete inMemorySources[id];
  return true;
}
