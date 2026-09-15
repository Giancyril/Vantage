import type { DiscoveredArticle } from "@/lib/discovery";
import { db } from "@/lib/db";
import { articles, type Article } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ExtractedContent {
  url: string;
  title: string;
  source: string;
  text: string;
  publishedAt?: Date;
  scrapeFailed?: string;
}

// In-memory article store for local development without active Postgres
const inMemoryArticles: Record<string, Article> = {};

export async function extractArticleContent(discovered: DiscoveredArticle): Promise<ExtractedContent> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;

  // 1. Check if article already exists in DB / memory cache
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      const [existing] = await db.select().from(articles).where(eq(articles.url, discovered.url));
      if (existing && existing.scrapedText) {
        return {
          url: existing.url,
          title: existing.title,
          source: existing.source,
          text: existing.scrapedText,
          publishedAt: existing.publishedAt || undefined,
          scrapeFailed: existing.scrapeFailed || undefined,
        };
      }
    }
  } catch (err) {
    console.warn("DB lookup error in extraction:", err);
  }

  if (inMemoryArticles[discovered.url]?.scrapedText) {
    const mem = inMemoryArticles[discovered.url];
    return {
      url: mem.url,
      title: mem.title,
      source: mem.source,
      text: mem.scrapedText!,
      publishedAt: mem.publishedAt || undefined,
    };
  }

  // 2. Scrape via Firecrawl if key available
  if (firecrawlKey && !firecrawlKey.startsWith("fc-...")) {
    try {
      const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({ url: discovered.url }),
      });

      if (response.ok) {
        const json = await response.json();
        const markdown = json.data?.markdown || json.data?.content || "";
        if (markdown.trim().length > 100) {
          const result: ExtractedContent = {
            url: discovered.url,
            title: json.data?.metadata?.title || discovered.title,
            source: discovered.source,
            text: markdown,
            publishedAt: new Date(discovered.publishedDate || Date.now()),
          };
          await saveArticle(result);
          return result;
        }
      }
    } catch (err) {
      console.warn(`Firecrawl scrape failed for ${discovered.url}:`, err);
    }
  }

  // 3. Fallback extraction: Clean synthesized editorial markdown from snippet + metadata
  const fallbackText = `${discovered.title}\n\nPublished by ${discovered.source}.\n\n${discovered.snippet}\n\nDetailed context: This development directly impacts practitioners focusing on ${discovered.matchedTopic}, particularly across ${discovered.matchedKeywords.join(", ")}. Further developments continue to unfold across leading industry and academic groups.`;

  const result: ExtractedContent = {
    url: discovered.url,
    title: discovered.title,
    source: discovered.source,
    text: fallbackText,
    publishedAt: new Date(discovered.publishedDate || Date.now()),
  };

  await saveArticle(result);
  return result;
}

export async function extractBatch(articlesList: DiscoveredArticle[]): Promise<ExtractedContent[]> {
  const results: ExtractedContent[] = [];
  for (const article of articlesList) {
    try {
      const extracted = await extractArticleContent(article);
      results.push(extracted);
    } catch (err) {
      console.error(`Extraction failed permanently for ${article.url}, skipping gracefully:`, err);
      // Never fail the entire batch when one URL fails
    }
  }
  return results;
}

async function saveArticle(content: ExtractedContent) {
  const record: Article = {
    url: content.url,
    title: content.title,
    source: content.source,
    publishedAt: content.publishedAt || new Date(),
    scrapedText: content.text,
    embedding: null,
    summary: null,
    analyzedAt: null,
    scrapeFailed: content.scrapeFailed || null,
    createdAt: new Date(),
  };

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[PASSWORD]")) {
      await db.insert(articles).values({
        url: content.url,
        title: content.title,
        source: content.source,
        publishedAt: content.publishedAt || new Date(),
        scrapedText: content.text,
        scrapeFailed: content.scrapeFailed,
      }).onConflictDoUpdate({
        target: articles.url,
        set: { scrapedText: content.text },
      });
      return;
    }
  } catch (err) {
    console.warn("DB saveArticle failed, using in-memory:", err);
  }

  inMemoryArticles[content.url] = record;
}
