import { db } from "@/lib/db";
import { articles, type FeedSource, type NewArticle } from "@/db/schema";
import { fetchAndParseFeed } from "./rss";
import { getFeedSources, updateFeedStatus } from "./sources";
import { inArray } from "drizzle-orm";

export interface FeedSyncResult {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  fetchedCount: number;
  newArticlesCount: number;
  status: "healthy" | "warning" | "error";
  error?: string;
}

export interface BatchSyncSummary {
  sourcesProcessed: number;
  totalNewArticles: number;
  results: FeedSyncResult[];
  timestamp: string;
}

// In-memory cache for article URLs when running without active PostgreSQL
const inMemoryArticleUrls = new Set<string>();

export async function syncFeedSource(source: FeedSource): Promise<FeedSyncResult> {
  try {
    const parsed = await fetchAndParseFeed(source.url, { timeoutMs: 12000 });
    const items = parsed.items;

    if (!items || items.length === 0) {
      await updateFeedStatus(source.id, "warning", "Feed returned 0 items");
      return {
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        fetchedCount: 0,
        newArticlesCount: 0,
        status: "warning",
        error: "Feed contains no items",
      };
    }

    const itemUrls = items.map((it) => it.url).filter(Boolean);
    const existingUrlSet = new Set<string>();

    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      try {
        const existingInDb = await db
          .select({ url: articles.url })
          .from(articles)
          .where(inArray(articles.url, itemUrls));
        existingInDb.forEach((r: { url: string }) => existingUrlSet.add(r.url));
      } catch (err) {
        console.warn("DB lookup during feed sync failed, falling back to local set:", err);
      }
    }

    // Identify truly new items
    const newItems = items.filter(
      (item) => !existingUrlSet.has(item.url) && !inMemoryArticleUrls.has(item.url)
    );

    if (newItems.length > 0) {
      const articlesToInsert: NewArticle[] = newItems.map((item) => ({
        url: item.url,
        title: item.title,
        source: source.title,
        publishedAt: item.publishedAt || new Date(),
        scrapedText: item.content || item.summary || item.title,
        summary: item.summary || null,
        createdAt: new Date(),
      }));

      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
        try {
          await db.insert(articles).values(articlesToInsert).onConflictDoNothing();
        } catch (err) {
          console.warn("DB insert articles during sync failed:", err);
        }
      }

      newItems.forEach((it) => inMemoryArticleUrls.add(it.url));
    }

    await updateFeedStatus(source.id, "healthy");

    return {
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      fetchedCount: items.length,
      newArticlesCount: newItems.length,
      status: "healthy",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await updateFeedStatus(source.id, "error", errorMsg);
    return {
      sourceId: source.id,
      sourceTitle: source.title,
      sourceUrl: source.url,
      fetchedCount: 0,
      newArticlesCount: 0,
      status: "error",
      error: errorMsg,
    };
  }
}

export async function syncAllUserFeeds(userId: string): Promise<BatchSyncSummary> {
  const sources = await getFeedSources(userId);
  const activeSources = sources.filter((s) => s.isActive === 1);
  const results: FeedSyncResult[] = [];
  let totalNew = 0;

  for (const src of activeSources) {
    const res = await syncFeedSource(src);
    results.push(res);
    totalNew += res.newArticlesCount;
  }

  return {
    sourcesProcessed: activeSources.length,
    totalNewArticles: totalNew,
    results,
    timestamp: new Date().toISOString(),
  };
}
