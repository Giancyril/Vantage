export interface DiscoveredFeedInfo {
  found: boolean;
  feedUrl: string;
  originalUrl: string;
  title?: string;
  feedType: "rss" | "atom" | "substack";
  error?: string;
}

export function normalizeFeedUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

function resolveRelativeUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

export async function discoverFeed(rawUrl: string, timeoutMs: number = 8000): Promise<DiscoveredFeedInfo> {
  const url = normalizeFeedUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. If it's a Substack publication URL (e.g. publication.substack.com)
    if (/^[a-zA-Z0-9-]+\.substack\.com\/?$/i.test(url.replace(/^https?:\/\//i, ""))) {
      const feedUrl = url.replace(/\/?$/, "") + "/feed";
      return {
        found: true,
        feedUrl,
        originalUrl: url,
        feedType: "substack",
      };
    }

    // 2. Fetch the target URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Vantage-AI-News-Agent/1.0 (+https://github.com/Giancyril/Vantage)",
        Accept: "text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        found: false,
        feedUrl: url,
        originalUrl: url,
        feedType: "rss",
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    // 3. Direct XML Feed Check
    const isDirectRss = contentType.includes("xml") || /<rss/i.test(body);
    const isDirectAtom = /<feed[^>]*xmlns=['"][^'"]*Atom/i.test(body) || (/<feed/i.test(body) && /<entry/i.test(body));

    if (isDirectRss || isDirectAtom) {
      const titleMatch = body.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      return {
        found: true,
        feedUrl: url,
        originalUrl: url,
        title: titleMatch ? titleMatch[1].trim() : undefined,
        feedType: isDirectAtom ? "atom" : "rss",
      };
    }

    // 4. HTML Page: Look for <link rel="alternate" type="application/rss+xml" ...>
    const rssLinkMatch = body.match(/<link[^>]+type=['"](application\/rss\+xml|application\/atom\+xml)['"][^>]*>/gi);
    if (rssLinkMatch && rssLinkMatch.length > 0) {
      for (const linkTag of rssLinkMatch) {
        const hrefMatch = linkTag.match(/href=['"]([^'"]+)['"]/i);
        if (hrefMatch) {
          const resolved = resolveRelativeUrl(url, hrefMatch[1]);
          const titleMatch = linkTag.match(/title=['"]([^'"]+)['"]/i);
          const isAtom = /atom\+xml/i.test(linkTag);
          return {
            found: true,
            feedUrl: resolved,
            originalUrl: url,
            title: titleMatch ? titleMatch[1] : undefined,
            feedType: isAtom ? "atom" : "rss",
          };
        }
      }
    }

    // 5. Common fallback patterns
    const commonPaths = ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml"];
    for (const path of commonPaths) {
      try {
        const candidateUrl = resolveRelativeUrl(url, path);
        const probeRes = await fetch(candidateUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": "Vantage-AI-News-Agent/1.0 (+https://github.com/Giancyril/Vantage)",
          },
          signal: controller.signal,
        });
        if (probeRes.ok) {
          const probeType = probeRes.headers.get("content-type") || "";
          if (probeType.includes("xml") || probeType.includes("rss") || probeType.includes("atom")) {
            return {
              found: true,
              feedUrl: candidateUrl,
              originalUrl: url,
              feedType: path.includes("atom") ? "atom" : "rss",
            };
          }
        }
      } catch {
        // proceed to next fallback
      }
    }

    return {
      found: false,
      feedUrl: url,
      originalUrl: url,
      feedType: "rss",
      error: "No RSS or Atom feed could be discovered for this URL.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      found: false,
      feedUrl: url,
      originalUrl: url,
      feedType: "rss",
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}
