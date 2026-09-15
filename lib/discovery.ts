import type { Interest } from "@/db/schema";

export interface DiscoveredArticle {
  url: string;
  title: string;
  source: string;
  snippet: string;
  publishedDate?: string;
  matchedTopic: string;
  matchedKeywords: string[];
}

// Fallback curated headlines when TAVILY_API_KEY is not configured or in development mode
const MOCK_NEWS_DISCOVERY: Record<string, DiscoveredArticle[]> = {
  "AI Agents & Autonomous Systems": [
    {
      url: "https://example.com/ai/deepmind-agentic-benchmarks-2026",
      title: "Frontier Lab Benchmarks Show Autonomous Agent Chains Outperform Monolithic Prompts by 4.2x",
      source: "Ars Technica",
      snippet: "New empirical evaluations on long-horizon reasoning tasks demonstrate that multi-agent delegation frameworks achieve state-of-the-art task completion with 60% lower latency.",
      publishedDate: new Date().toISOString(),
      matchedTopic: "AI Agents & Autonomous Systems",
      matchedKeywords: ["AI agents", "autonomous systems", "tool calling"]
    },
    {
      url: "https://example.com/ai/anthropic-tool-use-governance",
      title: "Anthropic Releases New Protocol for Structured Safe Tool Verification in Enterprise Agents",
      source: "TechCrunch",
      snippet: "The protocol enforces sandboxed runtime capability isolation and cryptographically signed audit logs for every API call triggered by agentic autonomous loops.",
      publishedDate: new Date().toISOString(),
      matchedTopic: "AI Agents & Autonomous Systems",
      matchedKeywords: ["autonomous systems", "tool calling"]
    }
  ],
  "Machine Learning Infrastructure & Silicon": [
    {
      url: "https://example.com/hardware/next-gen-optical-interconnects",
      title: "Co-Packaged Optics Breakthrough Cuts Data Center AI Cluster Power Consumption by 35%",
      source: "SemiAnalysis",
      snippet: "Switching from copper traces to direct silicon photonic waveguides between GPU accelerators solves the primary thermal bottleneck in clusters scaling beyond 100,000 chips.",
      publishedDate: new Date().toISOString(),
      matchedTopic: "Machine Learning Infrastructure & Silicon",
      matchedKeywords: ["inference optimization", "semiconductor packaging"]
    }
  ],
  "Clean Energy & Grid Modernization": [
    {
      url: "https://example.com/energy/sodium-ion-megawatt-storage",
      title: "First Utility-Scale Sodium-Ion Storage Plant Connects to European Transmission Grid",
      source: "Canary Media",
      snippet: "Operating without lithium or cobalt, the 100MWh facility proves commercial viability for four-hour duration stationary grid balancing at a 40% lower capital expense.",
      publishedDate: new Date().toISOString(),
      matchedTopic: "Clean Energy & Grid Modernization",
      matchedKeywords: ["grid storage", "sodium-ion batteries"]
    }
  ],
  "Venture Capital & Tech Ecosystems": [
    {
      url: "https://example.com/markets/ai-agent-infra-seed-multiples",
      title: "Q3 Venture Report: Agent Infrastructure and Context Engines Command Peak Series A Multiples",
      source: "The Information",
      snippet: "Investors reallocated over $4.2B toward companies building deterministic guardrails, durable state machines, and evaluation harnesses for LLM applications.",
      publishedDate: new Date().toISOString(),
      matchedTopic: "Venture Capital & Tech Ecosystems",
      matchedKeywords: ["venture capital", "seed rounds", "tech valuation"]
    }
  ]
};

export async function discoverArticlesForInterests(
  interestsList: Interest[],
  knownUrls: Set<string> = new Set()
): Promise<DiscoveredArticle[]> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const discovered: DiscoveredArticle[] = [];
  const seenUrls = new Set<string>(knownUrls);

  for (const interest of interestsList) {
    if (tavilyApiKey && !tavilyApiKey.startsWith("tvly-...")) {
      try {
        const query = `${interest.topic} ${interest.keywords.slice(0, 3).join(" ")} latest news`;
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query,
            search_depth: "news",
            include_answer: false,
            max_results: 5,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          for (const item of data.results || []) {
            if (!seenUrls.has(item.url)) {
              seenUrls.add(item.url);
              discovered.push({
                url: item.url,
                title: item.title || "Untitled Story",
                source: extractDomain(item.url),
                snippet: item.content || "",
                publishedDate: item.published_date || new Date().toISOString(),
                matchedTopic: interest.topic,
                matchedKeywords: interest.keywords,
              });
            }
          }
          continue;
        }
      } catch (err) {
        console.warn(`Tavily search failed for topic "${interest.topic}", falling back to mock:`, err);
      }
    }

    // Fallback if no Tavily API key or API call failed
    const topicMocks = MOCK_NEWS_DISCOVERY[interest.topic] || generateDynamicMock(interest);
    for (const mock of topicMocks) {
      if (!seenUrls.has(mock.url)) {
        seenUrls.add(mock.url);
        discovered.push(mock);
      }
    }
  }

  return discovered;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Web Source";
  }
}

function generateDynamicMock(interest: Interest): DiscoveredArticle[] {
  const kw = interest.keywords[0] || interest.topic;
  return [
    {
      url: `https://example.com/${encodeURIComponent(interest.topic.toLowerCase().replace(/\s+/g, "-"))}/breakthrough-${Date.now()}`,
      title: `Recent Breakthroughs in ${interest.topic}: Key Implications for ${kw}`,
      source: "Tech Review Daily",
      snippet: `In-depth analysis of emerging paradigms in ${interest.topic}, focusing on real-world adoption, performance benchmarks, and industry transformation.`,
      publishedDate: new Date().toISOString(),
      matchedTopic: interest.topic,
      matchedKeywords: interest.keywords,
    }
  ];
}
