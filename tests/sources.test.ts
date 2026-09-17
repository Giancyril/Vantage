/**
 * Unit tests for RSS/Atom/Substack Parser, Feed Discovery, and Source Syncing
 */
import { parseFeedXml } from "../lib/rss";
import { normalizeFeedUrl } from "../lib/feedDiscovery";
import { CURATED_FEED_PRESETS } from "../lib/sources";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Tech Dispatch Daily</title>
    <link>https://techdispatch.example.com</link>
    <description>Frontier technology updates</description>
    <item>
      <title><![CDATA[Agentic Frameworks Outperform Single Prompts by 3x]]></title>
      <link>https://techdispatch.example.com/posts/agentic-frameworks</link>
      <pubDate>Mon, 15 Sep 2026 14:00:00 GMT</pubDate>
      <description><![CDATA[Empirical research evaluates long-horizon autonomous tool-calling chains.]]></description>
      <guid>https://techdispatch.example.com/posts/agentic-frameworks</guid>
    </item>
    <item>
      <title>Next-Gen Silicon Architectures for Quantized Weights</title>
      <link>https://techdispatch.example.com/posts/next-gen-silicon</link>
      <pubDate>Sun, 14 Sep 2026 09:30:00 GMT</pubDate>
      <description>Hardware-aware model optimization delivers 40% memory bandwidth savings.</description>
      <guid>guid-item-002</guid>
    </item>
  </channel>
</rss>`;

const SAMPLE_ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Simon Willison's Weblog</title>
  <subtitle>LLMs, Python, and open web experiments</subtitle>
  <link href="https://simonwillison.net/" rel="alternate"/>
  <entry>
    <title>Prompt Injection Defense via Sandboxed Verification</title>
    <link href="https://simonwillison.net/2026/Sep/15/sandboxed-verification/"/>
    <id>tag:simonwillison.net,2026-09-15:sandboxed-verification</id>
    <updated>2026-09-15T12:00:00Z</updated>
    <summary>Exploring isolated subprocess capabilities for untrusted inputs.</summary>
  </entry>
</feed>`;

async function runSourcesTests(): Promise<void> {
  console.log("--> Testing RSS 2.0 Parser with CDATA...");
  const parsedRss = parseFeedXml(SAMPLE_RSS, "https://techdispatch.example.com/feed.xml");
  if (parsedRss.title !== "Tech Dispatch Daily") {
    throw new Error(`Expected feed title 'Tech Dispatch Daily', got '${parsedRss.title}'`);
  }
  if (parsedRss.items.length !== 2) {
    throw new Error(`Expected 2 parsed items, got ${parsedRss.items.length}`);
  }
  if (!parsedRss.items[0].title.includes("Agentic Frameworks")) {
    throw new Error(`First item title mismatch: ${parsedRss.items[0].title}`);
  }
  if (parsedRss.items[0].url !== "https://techdispatch.example.com/posts/agentic-frameworks") {
    throw new Error(`First item URL mismatch: ${parsedRss.items[0].url}`);
  }
  if (!parsedRss.items[0].publishedAt) {
    throw new Error("Expected valid parsed publishedAt Date");
  }

  console.log("--> Testing Atom Parser...");
  const parsedAtom = parseFeedXml(SAMPLE_ATOM, "https://simonwillison.net/atom/everything/");
  if (parsedAtom.title !== "Simon Willison's Weblog") {
    throw new Error(`Expected Atom title 'Simon Willison's Weblog', got '${parsedAtom.title}'`);
  }
  if (parsedAtom.items.length !== 1) {
    throw new Error(`Expected 1 Atom item, got ${parsedAtom.items.length}`);
  }
  if (parsedAtom.items[0].url !== "https://simonwillison.net/2026/Sep/15/sandboxed-verification/") {
    throw new Error(`Atom link mismatch: ${parsedAtom.items[0].url}`);
  }

  console.log("--> Testing URL Normalizer...");
  const norm1 = normalizeFeedUrl("theverge.com/rss/index.xml");
  if (norm1 !== "https://theverge.com/rss/index.xml") {
    throw new Error(`Normalizer failed to prepend https: ${norm1}`);
  }

  console.log("--> Testing Curated Feed Presets...");
  if (CURATED_FEED_PRESETS.length < 5) {
    throw new Error(`Expected at least 5 curated feed presets, got ${CURATED_FEED_PRESETS.length}`);
  }

  console.log("[PASS] All sources tests passed successfully.");
}

runSourcesTests().catch((err: unknown) => {
  console.error("[FAIL] Sources test failed:", err);
  process.exit(1);
});
