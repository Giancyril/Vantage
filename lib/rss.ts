export interface ParsedFeedItem {
  guid: string;
  url: string;
  title: string;
  author?: string;
  publishedAt?: Date;
  summary: string;
  content?: string;
}

export interface ParsedFeed {
  title: string;
  description?: string;
  siteUrl?: string;
  feedUrl: string;
  feedType: "rss" | "atom" | "substack";
  items: ParsedFeedItem[];
}

function stripCdataAndTags(str: string): string {
  if (!str) return "";
  let clean = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return clean.replace(/\s+/g, " ").trim();
}

function getTagValue(block: string, tag: string): string {
  // CDATA match: <tag><![CDATA[...]]></tag>
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Standard match: <tag>...</tag>
  const standardRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const standardMatch = block.match(standardRegex);
  if (standardMatch) {
    const raw = standardMatch[1].trim();
    // If it contains embedded CDATA:
    const innerCdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
    return innerCdata ? innerCdata[1].trim() : raw;
  }

  return "";
}

function parseFeedDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parsed = Date.parse(dateStr.trim());
  return isNaN(parsed) ? undefined : new Date(parsed);
}

export function parseFeedXml(xml: string, feedUrl: string): ParsedFeed {
  const isAtom = /<feed[^>]*xmlns=['"][^'"]*Atom/i.test(xml) || /<feed/i.test(xml) && /<entry/i.test(xml);
  const isSubstack = feedUrl.includes("substack.com") || /substack\.com/i.test(xml);

  if (isAtom) {
    const feedHeader = xml.split(/<entry[^>]*>/i)[0];
    const feedTitle = stripCdataAndTags(getTagValue(feedHeader, "title")) || "Atom Feed";
    const feedSubtitle = stripCdataAndTags(getTagValue(feedHeader, "subtitle"));
    
    let siteUrl = "";
    const siteUrlMatch = xml.match(/<link[^>]*rel=['"]alternate['"][^>]*href=['"]([^'"]+)['"]/i) ||
                         xml.match(/<link[^>]*href=['"]([^'"]+)['"][^>]*rel=['"]alternate['"]/i) ||
                         xml.match(/<link[^>]*href=['"]([^'"]+)['"]/i);
    if (siteUrlMatch) siteUrl = siteUrlMatch[1];

    const entries = xml.split(/<entry[^>]*>/i).slice(1);
    const items: ParsedFeedItem[] = [];

    for (const entry of entries) {
      const entryContent = entry.split(/<\/entry>/i)[0];
      const title = stripCdataAndTags(getTagValue(entryContent, "title"));
      if (!title) continue;

      let link = "";
      const linkMatch = entryContent.match(/<link[^>]*href=['"]([^'"]+)['"]/i);
      if (linkMatch) link = linkMatch[1];
      if (!link) link = stripCdataAndTags(getTagValue(entryContent, "id"));

      const rawDate = getTagValue(entryContent, "published") || getTagValue(entryContent, "updated");
      const summaryRaw = getTagValue(entryContent, "summary") || getTagValue(entryContent, "content");
      const summary = stripCdataAndTags(summaryRaw).slice(0, 320);
      const author = stripCdataAndTags(getTagValue(entryContent, "name")) || undefined;
      const guid = stripCdataAndTags(getTagValue(entryContent, "id")) || link;

      items.push({
        guid,
        url: link,
        title,
        author,
        publishedAt: parseFeedDate(rawDate),
        summary,
      });
    }

    return {
      title: feedTitle,
      description: feedSubtitle,
      siteUrl: siteUrl || feedUrl,
      feedUrl,
      feedType: isSubstack ? "substack" : "atom",
      items,
    };
  }

  // RSS 2.0 Parser
  const channelBlock = xml.split(/<channel[^>]*>/i)[1] || xml;
  const channelHeader = channelBlock.split(/<item[^>]*>/i)[0];
  const feedTitle = stripCdataAndTags(getTagValue(channelHeader, "title")) || "RSS Feed";
  const feedDescription = stripCdataAndTags(getTagValue(channelHeader, "description"));
  const siteUrl = stripCdataAndTags(getTagValue(channelHeader, "link"));

  const itemBlocks = channelBlock.split(/<item[^>]*>/i).slice(1);
  const items: ParsedFeedItem[] = [];

  for (const block of itemBlocks) {
    const itemContent = block.split(/<\/item>/i)[0];
    const title = stripCdataAndTags(getTagValue(itemContent, "title"));
    if (!title) continue;

    let link = stripCdataAndTags(getTagValue(itemContent, "link"));
    if (!link) {
      const guidMatch = getTagValue(itemContent, "guid");
      if (guidMatch && guidMatch.startsWith("http")) {
        link = guidMatch;
      }
    }

    const rawDate = getTagValue(itemContent, "pubDate") || getTagValue(itemContent, "dc:date");
    const author = stripCdataAndTags(getTagValue(itemContent, "dc:creator")) ||
                   stripCdataAndTags(getTagValue(itemContent, "author")) ||
                   undefined;
    const summaryRaw = getTagValue(itemContent, "description") ||
                       getTagValue(itemContent, "content:encoded");
    const summary = stripCdataAndTags(summaryRaw).slice(0, 320);
    const guid = stripCdataAndTags(getTagValue(itemContent, "guid")) || link || title;

    items.push({
      guid,
      url: link || feedUrl,
      title,
      author,
      publishedAt: parseFeedDate(rawDate),
      summary,
    });
  }

  return {
    title: feedTitle,
    description: feedDescription,
    siteUrl: siteUrl || feedUrl,
    feedUrl,
    feedType: isSubstack ? "substack" : "rss",
    items,
  };
}

export async function fetchAndParseFeed(
  feedUrl: string,
  options?: { timeoutMs?: number; etag?: string }
): Promise<ParsedFeed> {
  const timeout = options?.timeoutMs ?? 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Vantage-AI-News-Agent/1.0 (+https://github.com/Giancyril/Vantage)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    };
    if (options?.etag) {
      headers["If-None-Match"] = options.etag;
    }

    const response = await fetch(feedUrl, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: HTTP ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    return parseFeedXml(xml, feedUrl);
  } finally {
    clearTimeout(timer);
  }
}
