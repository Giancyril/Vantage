# Vantage — AI News Intelligence Platform

A production-grade, AI-powered personal news intelligence system designed for professionals and executives who demand high-signal information. Features fully autonomous multi-source news discovery via Tavily, AI-powered relevance scoring and "Why It Matters" briefings with OpenAI, near-duplicate story clustering, adaptive interest weight reinforcement learning, React Email publication-grade briefings via Resend, an interactive "Ask Vantage" AI assistant with article-grounded chat, AI-generated audio briefings with synchronized transcript playback, multi-perspective story analysis, RSS feed integration with live sync, Trigger.dev background task orchestration, and a distraction-free editorial reading interface.

## Features

### Core Intelligence Engine
- **Autonomous Multi-Source Discovery**: Fully automated news discovery pipeline that expands each interest topic into targeted search queries, runs them in parallel across Tavily News Search, and performs global URL-level deduplication to prevent repeat stories
- **Resilient Full-Text Extraction**: Article scraping via Firecrawl with clean markdown transformation, graceful degradation for paywalled content, and scrape-failure tracking to prevent repeated failed attempts
- **AI Relevance Scoring & Summarization**: Every discovered article is independently analyzed against your specific keyword interests using OpenAI. Generates a 0–1 relevance score, a concise 2-sentence summary, and a personalized "Why This Matters to You" briefing contextualizing the story against your tracked topics
- **Near-Duplicate Story Clustering**: Embedding-based semantic similarity engine that identifies stories covering the same real-world event across multiple outlets and canonicalizes the cluster to the single highest-scoring authoritative source
- **Cost-Optimized Global Article Cache**: Articles are analyzed once in the central catalog and their embeddings, summaries, and scores are reused across all users who share related interests — eliminating redundant API calls and dramatically reducing per-user analysis cost

### Adaptive Personalization System
- **Continuous Reinforcement Learning Loop**: Engagement-driven weight adaptation engine that automatically tunes per-topic relevance weights based on user behavior signals — no manual configuration required after initial setup
- **Five-Signal Feedback Model**: Granular engagement event tracking captures Opens (+0.05), full Reads (+0.05), Saves (+0.05), explicit "More Like This" requests (+0.15), and Dismissals (-0.10) to triangulate true interest with high precision
- **Nightly Dynamic Reweighting**: Background job aggregates all engagement events from the previous day and applies weighted updates to interest domains, ensuring the feed continuously evolves to match actual reading behavior rather than stated preferences
- **Transparent Interest Manager**: Fully visible, interactive interest dashboard with real-time weight sliders, keyword badge editors, custom domain URL tracking, and instant visual feedback on how each interest influences the feed composition
- **Preset Domain Library**: Curated collection of high-signal source domains organized by category (Technology, Finance, Science, Policy) for instant feed seeding without manual research

### Feed Composition & Delivery
- **Composite Ranking Algorithm**: Stories are assembled into daily briefings using a composite score that synthesizes AI relevance, topic interest weight, source authority, and recency — producing a ranked reading agenda calibrated to your exact profile
- **Topic Grouping & Clustering**: The feed is organized into story clusters so you read all perspectives on the same event together, rather than discovering fragmented single-source coverage scattered across the timeline
- **React Email Daily Briefing**: Publication-grade responsive HTML digest delivered to your inbox every morning via Resend. Features article cards with source badges, relevance indicators, summary previews, and direct read links — designed to feel like a premium newsletter, not a system notification
- **Scheduled 6:00 AM UTC Delivery**: Trigger.dev cron webhook fires the complete end-to-end pipeline nightly — discovery, extraction, analysis, clustering, ranking, and email delivery — so the briefing arrives before the workday begins
- **RSS Feed Integration**: RSS/Atom feed sync layer that ingests content from custom publication URLs, normalizes across feed formats, and merges discovered stories with Tavily results into a unified ranked stream

### Editorial Reading Interface
- **Distraction-Free Single-Column Stream**: Inspired by Mailbrew and Artifact, the web feed presents articles in a clean single-column editorial layout with serif typography, generous whitespace, and zero algorithmic noise
- **Story Cluster Cards**: Related articles from multiple sources on the same story are grouped into cluster cards with an expandable source panel, allowing you to read the primary piece while remaining aware of the full coverage landscape
- **Source Cards & Domain Tracking**: Explicit source attribution on every card with domain favicon, publication name, and article age — making source diversity and recency immediately scannable
- **Feed Health Indicators**: Live badges that signal the freshness and reliability of each source, flagging feeds that have gone stale, failed to sync, or returned consistently low-relevance content
- **Inline "Why It Matters" Explainer**: Expandable per-article panel showing the AI-generated personalized relevance reasoning — you always know exactly why a story was surfaced for your specific keyword interests

### Ask Vantage — AI Chat Assistant
- **Article-Grounded Intelligence Chat**: Floating AI assistant powered by the Vantage reasoning engine that can answer questions grounded in the current article context, your full feed corpus, or general knowledge — with transparent mode switching between grounding levels
- **Contextual Article Chat**: Open the chat drawer from any article card to ask follow-up questions, request deeper analysis, or explore related implications — the assistant has full access to the article text, metadata, and cluster context
- **Session Persistence & History**: Full conversation session management backed by the database — sessions are persisted, named, and retrievable, allowing you to continue an analysis thread hours or days later
- **Citation-Backed Responses**: Every assistant response includes inline citation markers linked back to specific articles in your feed, so claims are always traceable to a primary source
- **Suggested Prompts**: Context-aware prompt suggestions generated from the current article topic to help you explore the story from multiple analytical angles without starting from a blank input
- **Streaming Response Feedback**: Real-time token streaming with typing indicators creates a native chat feel, rather than waiting for complete responses to appear

### AI Audio Briefings
- **AI-Generated Daily Audio Digest**: Full narrated audio versions of your daily briefing generated by OpenAI's text-to-speech engine — transforms your reading feed into a commute-ready podcast-style audio experience
- **Synchronized Transcript Playback**: Real-time scrolling transcript panel that highlights the sentence currently being narrated, allowing simultaneous reading and listening for maximum retention
- **Wave Visualizer**: Animated audio waveform visualization that responds to playback state, providing real-time visual feedback during listening
- **Playback Controls**: Full audio player with play/pause, seek, speed control, and per-briefing storage — each generated audio file is stored and accessible for replay throughout the day
- **Audio Storage Layer**: Briefing audio files are persisted in storage with metadata linking back to the source digest, ensuring the audio remains available even after the generation session ends

### Multi-Perspective Story Analysis
- **Perspective Drawer**: Side-by-side comparative analysis panel that surfaces how different outlets and ideological angles are covering the same underlying story
- **Cluster Source Explorer**: Expandable cluster cards that reveal all sources covering a story with individual relevance scores, allowing deliberate cross-source reading rather than single-outlet reliance
- **AI Synthesis Engine**: Produces a unified synthesis narrative across all sources in a cluster, identifying points of consensus, contradictions, and unique facts reported by individual outlets

### Security & Reliability
- **Built-In API Fallback Heuristics**: The pipeline includes local mock providers and heuristic fallback engines for all external dependencies — Tavily, Firecrawl, and OpenAI — allowing full local development, testing, and demonstration without live API credentials
- **Scrape Failure Tracking**: Articles that fail content extraction are marked with `scrape_failed: true` and excluded from future extraction attempts, preventing repeated wasted API calls against permanently blocked or broken URLs
- **Embedding-Based Deduplication**: URL-level and semantic-level deduplication runs at multiple pipeline stages to ensure no story appears twice regardless of URL variation, syndication, or near-identical content rewrites
- **Structured Output Validation**: All OpenAI API calls use structured output schemas validated with Zod, ensuring analysis results are type-safe and never cause downstream parsing failures
- **Background Task Isolation**: All heavy pipeline operations run in isolated Trigger.dev background tasks, keeping the web UI instantly responsive and decoupled from the asynchronous intelligence workload

---

## Tech Stack

### Backend & Infrastructure
- **Next.js 16** with App Router and Turbopack for fast local development
- **TypeScript** for end-to-end type safety across all pipeline stages
- **Drizzle ORM** with PostgreSQL (Supabase) for relational data persistence
- **Trigger.dev v3** for durable background task orchestration and cron scheduling
- **Zod** for schema validation and structured OpenAI output parsing

### AI & Intelligence
- **OpenAI API** (`gpt-4o-mini`) for article analysis, relevance scoring, "Why It Matters" generation, AI chat responses, and audio synthesis
- **OpenAI Embeddings** for semantic similarity computation and near-duplicate detection
- **Tavily News Search API** for domain-targeted, high-signal news discovery
- **Firecrawl Scrape API** for full-text article extraction with clean markdown output

### Feed & Delivery
- **Resend** for transactional email delivery of daily briefings
- **React Email** (`@react-email/components`) for publication-grade responsive HTML email templates
- **RSS/Atom Parser** (`lib/rss.ts`) for custom feed source integration and normalization

### Frontend
- **React 19** with Next.js App Router and server components
- **Tailwind CSS v4** with custom editorial design tokens for the reading interface
- **Lucide React** for consistent iconography across the UI

---

## Project Structure

```
ai-news-agent/
├── app/                        # Next.js App Router pages and API routes
│   ├── (onboarding)/           # Onboarding flow for new users
│   ├── api/
│   │   ├── interests/          # GET/POST/PATCH/DELETE interest management
│   │   ├── pipeline/
│   │   │   ├── discover/       # POST — Run multi-source news discovery
│   │   │   └── run/            # POST — Execute full end-to-end pipeline
│   │   ├── feedback/           # POST — Record engagement events + reweight
│   │   ├── chat/
│   │   │   ├── route.ts        # POST — AI assistant message handling
│   │   │   └── sessions/       # GET/DELETE — Chat session management
│   │   ├── audio/
│   │   │   ├── briefings/      # GET — Retrieve stored audio briefings
│   │   │   └── generate/       # POST — Generate TTS audio for digest
│   │   ├── clusters/           # GET — Story clusters; [id] for individual
│   │   ├── sources/
│   │   │   ├── route.ts        # GET/POST — RSS source management
│   │   │   └── sync/           # POST — Trigger RSS feed synchronization
│   │   └── trigger/            # POST — Cron webhook receiver for Trigger.dev
│   ├── layout.tsx              # Root application layout
│   └── page.tsx                # Main editorial feed page
│
├── components/
│   ├── ArticleCard.tsx         # Primary article display with feedback controls
│   ├── StoryClusterCard.tsx    # Multi-source cluster with expandable sources
│   ├── ClusterBadge.tsx        # Visual cluster size and type indicator
│   ├── WhyItMatters.tsx        # Expandable AI relevance reasoning panel
│   ├── PerspectiveDrawer.tsx   # Multi-perspective comparative analysis drawer
│   ├── AskVantageButton.tsx    # Floating + inline AI chat launcher
│   ├── ChatDrawer.tsx          # Full slide-over AI assistant UI
│   ├── ChatMessage.tsx         # Message bubble with citations and copy tool
│   ├── ChatProvider.tsx        # Global chat session state context
│   ├── AudioBriefingModal.tsx  # Audio player modal with transcript sync
│   ├── AudioPlayerControls.tsx # Playback controls (play/pause/seek/speed)
│   ├── AudioProvider.tsx       # Global audio playback state context
│   ├── SynchronizedTranscript.tsx # Real-time highlighted transcript panel
│   ├── WaveVisualizer.tsx      # Animated waveform visualization
│   ├── AddFeedModal.tsx        # RSS source addition and preview modal
│   ├── FeedHealthBadge.tsx     # Source freshness and reliability indicator
│   ├── InterestPill.tsx        # Clickable interest tag with weight display
│   ├── Navbar.tsx              # Top navigation with feed controls
│   └── SourceCard.tsx          # Individual source domain display card
│
├── lib/                        # Core intelligence and utility modules
│   ├── analysis.ts             # OpenAI article scoring and summarization
│   ├── audio-briefing.ts       # TTS generation and briefing synthesis
│   ├── audio-storage.ts        # Audio file persistence and retrieval
│   ├── chat.ts                 # Chat session management and message storage
│   ├── clustering.ts           # Embedding-based story deduplication
│   ├── db.ts                   # Drizzle ORM client and query utilities
│   ├── delivery.ts             # Resend email dispatch
│   ├── digest.ts               # Briefing assembly and ranking
│   ├── discovery.ts            # Tavily multi-query news search
│   ├── extraction.ts           # Firecrawl full-text article scraping
│   ├── feedback.ts             # Engagement event processing and reweighting
│   ├── feedDiscovery.ts        # RSS-to-article feed discovery
│   ├── feedSync.ts             # RSS source synchronization scheduler
│   ├── interests.ts            # Interest CRUD and weight management
│   ├── rss.ts                  # RSS/Atom feed parsing and normalization
│   ├── similarity.ts           # Cosine similarity for embedding comparison
│   ├── sources.ts              # Source domain management
│   ├── synthesis.ts            # Multi-source narrative synthesis engine
│   └── vantage-assistant.ts    # AI reasoning engine for grounded chat
│
├── jobs/                       # Trigger.dev background task definitions
│   ├── daily-digest.ts         # Full end-to-end nightly pipeline job
│   └── reweight-interests.ts   # Nightly adaptive weight update job
│
├── db/
│   └── schema.ts               # Drizzle ORM schema definitions
│
├── emails/
│   └── DigestEmail.tsx         # React Email publication-grade template
│
├── tests/
│   ├── interests.test.ts       # Interest manager unit tests
│   ├── pipeline.test.ts        # End-to-end pipeline integration tests
│   ├── clustering.test.ts      # Story cluster deduplication tests
│   ├── chat.test.ts            # Chat session and assistant tests
│   └── audio.test.ts           # Audio briefing generation tests
│
└── package.json
```

---

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/interests` | Retrieve active user interests or curated domain presets |
| `POST` | `/api/interests` | Create a new interest domain or batch seed from presets |
| `PATCH` | `/api/interests` | Update interest weight, keywords, or tracked URLs |
| `DELETE` | `/api/interests` | Remove an interest domain from the feed |
| `POST` | `/api/pipeline/discover` | Run multi-domain news discovery for specified interests |
| `POST` | `/api/pipeline/run` | Execute the complete distillation pipeline end-to-end |
| `POST` | `/api/feedback` | Record an engagement event and trigger adaptive reweighting |
| `POST` | `/api/chat` | Send a message to the Vantage AI assistant with optional article or session context |
| `GET` | `/api/chat/sessions` | List recent chat sessions for the user |
| `DELETE` | `/api/chat/sessions` | Delete a specific chat session and its messages |
| `GET` | `/api/audio/briefings` | Retrieve stored audio briefings with metadata |
| `POST` | `/api/audio/generate` | Generate a TTS audio briefing for a given digest |
| `GET` | `/api/clusters` | Retrieve all story clusters with grouped sources |
| `GET` | `/api/clusters/[id]` | Retrieve a specific cluster with full article context |
| `GET` | `/api/sources` | List all tracked RSS source domains |
| `POST` | `/api/sources` | Add a new RSS source URL for monitoring |
| `POST` | `/api/sources/sync` | Trigger immediate RSS feed synchronization |
| `POST` | `/api/trigger` | Webhook endpoint for Trigger.dev scheduled cron executions |

---

## Database Schema

```
users (id, email, name, created_at, updated_at)
  │
  ├─< interests (id, user_id, topic, keywords[], source_urls[], weight, created_at, updated_at)
  │
  ├─< digests (id, user_id, status, sent_at, created_at)
  │      │
  │      └─< digest_items (id, digest_id, article_url, relevance_score, summary,
  │                         why_it_matters, rank, cluster_id)
  │
  ├─< engagement_events (id, user_id, article_url, event_type, metadata, created_at)
  │
  └─< chat_sessions (id, user_id, title, context_type, context_id, created_at)
         │
         └─< chat_messages (id, session_id, role, content, citations[], created_at)

articles (url [PK], title, source, published_at, scraped_text, embedding[],
          summary, why_it_matters, relevance_score, analyzed_at, scrape_failed)

story_clusters (id, canonical_url, source_urls[], embedding[], cluster_score, created_at)

audio_briefings (id, user_id, digest_id, audio_url, transcript, duration_ms, created_at)

rss_sources (id, user_id, feed_url, domain, last_synced_at, health_score, created_at)
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm
- A PostgreSQL database (Supabase free tier recommended)

### Installation
```bash
# Clone the repository
git clone https://github.com/Giancyril/Vantage.git
cd Vantage

# Install dependencies
npm install --legacy-peer-deps
```

### Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Supabase Auth / Client
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# AI Analysis & Chat
OPENAI_API_KEY=sk-proj-...

# News Discovery
TAVILY_API_KEY=tvly-...

# Full-Text Extraction
FIRECRAWL_API_KEY=fc-...

# Background Task Orchestration
TRIGGER_SECRET_KEY=tr_dev_...

# Email Delivery
RESEND_API_KEY=re_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: The application includes built-in heuristic fallbacks and local mock providers for all external APIs. You can run, test, and develop offline without live API credentials — the pipeline will use cached or synthetic data automatically.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running the Test Suite
```bash
# Run all tests
npm test

# Run individual test suites
npx tsx tests/interests.test.ts   # Interest manager unit tests
npx tsx tests/pipeline.test.ts    # End-to-end pipeline integration
npx tsx tests/clustering.test.ts  # Story deduplication tests
npx tsx tests/chat.test.ts        # Chat session and AI assistant tests
npx tsx tests/audio.test.ts       # Audio briefing generation tests

# Production build verification
npm run build
```

---

## Features in Detail

### Adaptive Feedback Loop

The reinforcement learning loop is the core mechanism that makes Vantage self-improving over time. Every user interaction with the feed is treated as a signal:

- **Open** (`+0.05`): Reading the headline and preview indicates passive interest
- **Read** (`+0.05`): Clicking through to the full article signals active engagement
- **Save** (`+0.05`): Bookmarking signals high-value content worth revisiting
- **More Like This** (`+0.15`): Explicit preference signal — the strongest positive reinforcer in the model
- **Dismiss** (`−0.10`): Negative signal that suppresses similar content in future cycles

Weights are clipped to a `[0.1, 1.0]` range to prevent any single topic from monopolizing the feed or being entirely suppressed. The nightly `reweight-interests` Trigger.dev job aggregates the day's events, computes net weight deltas per topic, and applies them before the next morning's discovery run — so tomorrow's briefing is already calibrated to today's reading behavior.

### Near-Duplicate Story Clustering

When major news breaks, dozens of outlets publish variations of the same story within hours. Without deduplication, a briefing would surface 15 articles about the same event from 15 sources. The clustering engine prevents this through two layers:

1. **URL-Level Deduplication**: Exact URL matching across all pipeline stages prevents the same article from entering the pool twice, regardless of how many discovery queries surface it
2. **Semantic Clustering**: OpenAI text embeddings are computed for every article's title and first two paragraphs. Articles with cosine similarity above the cluster threshold (default: 0.82) are grouped into a `StoryCluster`. The highest-scoring article in each cluster becomes the canonical representative; others are retained as secondary sources visible in the cluster card's source panel

The result: a briefing with 10 story slots covers 10 genuinely distinct topics, not 10 variations of 2 events.

### AI Article Analysis

Every article that passes URL deduplication and content extraction is analyzed by `gpt-4o-mini` using structured output schemas. The analysis produces:

- **Relevance Score** (0.0–1.0): How closely the article matches the user's keyword interests. Articles below 0.4 are filtered before briefing assembly
- **Summary**: A 2-sentence distillation of the article's core claim and most significant fact
- **Why It Matters**: A personalized 1-2 sentence explanation connecting the article to the user's specific tracked topics — not a generic summary, but a targeted relevance statement
- **Embedding**: 1536-dimension OpenAI embedding stored for downstream clustering and semantic search

Analysis results are stored in the global `articles` table and reused for all users — a user whose interests overlap with an already-analyzed article pays no additional API cost.

### RSS Feed Integration

In addition to Tavily-powered discovery, Vantage supports direct RSS and Atom feed subscription:

- **Multi-Format Normalization**: The `lib/rss.ts` parser handles RSS 2.0, Atom 1.0, and common variants across publication platforms
- **Feed Health Scoring**: Each source is assigned a health score based on publication frequency, successful fetch rate, and average article relevance — displayed as a `FeedHealthBadge` in the UI
- **Incremental Sync**: The sync layer tracks the last publication timestamp per source and only processes new articles on each sync cycle, preventing redundant processing of already-indexed content
- **Unified Article Pool**: RSS-sourced articles enter the same analysis and clustering pipeline as Tavily-discovered articles, producing a unified ranked output regardless of discovery origin

### Vantage AI Assistant

The `lib/vantage-assistant.ts` reasoning engine powers the "Ask Vantage" chat experience with three grounding modes:

- **Article Mode**: When opened from a specific article card, the assistant has full access to the article's scraped text, metadata, and cluster context. Answers are grounded in that article's content with inline citations
- **Feed Mode**: When opened from the main feed, the assistant can reference any article in the current briefing corpus, synthesizing information across multiple sources to answer broad questions
- **Global Mode**: For questions outside the current briefing, the assistant falls back to its general knowledge while clearly indicating when a response is not grounded in a specific article

When OpenAI is configured, responses are generated via the Chat Completions API with the article context injected into the system prompt. When operating offline, the engine falls back to a heuristic keyword-matching analyzer that extracts relevant passages from the article text and constructs structured responses locally — ensuring the chat interface remains functional without API credentials.

### Audio Briefings

The audio briefing system transforms the daily text digest into a narrated listening experience:

1. **Script Generation**: The `lib/audio-briefing.ts` engine synthesizes the digest items into a coherent narration script with transitions between stories
2. **TTS Synthesis**: OpenAI's TTS API (`tts-1`) narrates the script using a natural-sounding voice optimized for news delivery
3. **Storage**: The generated MP3 is persisted in `lib/audio-storage.ts` and linked to the digest record for replay
4. **Synchronized Playback**: The `SynchronizedTranscript` component receives the full transcript split into sentence tokens. During playback, the component uses the audio element's `timeupdate` event to calculate the current playback position and highlight the corresponding transcript sentence in real time
5. **Wave Visualization**: The `WaveVisualizer` component renders an animated SVG waveform that transitions between an active animated state during playback and a static resting state when paused

---

## Development Roadmap

### Phase 1 — Intelligence Foundation ✅
- Core multi-source news discovery pipeline with Tavily
- Full-text article extraction via Firecrawl with graceful degradation
- OpenAI-powered relevance scoring, summarization, and "Why It Matters" generation
- Global article cache with cost deduplication
- Basic interest management with keyword and domain tracking

### Phase 2 — Personalization & Delivery ✅
- Five-signal adaptive feedback reinforcement learning loop
- Nightly dynamic weight reweighting via Trigger.dev background jobs
- Composite ranking algorithm with topic grouping
- React Email publication-grade briefing templates
- Resend-powered 6:00 AM UTC scheduled daily delivery

### Phase 3 — Feed Composition & Editorial Interface ✅
- Distraction-free single-column editorial reading stream
- Near-duplicate story clustering with embedding similarity engine
- Story cluster cards with expandable multi-source panels
- Source health badges and domain feed tracking
- Transparent interest manager with weight slider controls

### Phase 4 — AI Chat Intelligence ✅
- **Vantage AI Assistant Reasoning Engine**: Context-aware AI chat with three grounding modes (Article, Feed, Global) backed by the full article corpus
- **Article-Grounded Chat Drawer**: Full slide-over chat UI with streaming response feedback, session history, and suggested prompts
- **Citation-Backed Responses**: Inline citation markers linked to specific articles in the feed
- **Chat Session Management**: Persistent conversation sessions with database storage, retrieval, and deletion
- **POST /api/chat Endpoint**: Context-aware chat API with optional article and session context injection

### Phase 5 — Audio Intelligence & Synchronized Playback ✅
- **AI-Generated Audio Briefings**: Full narrated audio versions of daily digests using OpenAI TTS with natural news-delivery voice synthesis
- **Synchronized Transcript Panel**: Real-time sentence-level highlighting that tracks the exact audio playback position
- **Wave Visualizer**: Animated SVG waveform visualization responding to playback state transitions
- **Audio Storage Layer**: Persistent MP3 storage linked to digest records for full-day replay availability
- **Audio Player Controls**: Complete playback controls with speed adjustment, seeking, and per-briefing management

### Phase 6 — Multi-Source Perspective & RSS Integration ✅
- **Perspective Drawer**: Side-by-side multi-source comparative analysis for any story cluster
- **AI Synthesis Narrative**: Cross-source synthesis identifying consensus, contradictions, and unique reporting
- **RSS/Atom Feed Integration**: Custom publication URL subscription with multi-format normalization
- **Feed Health Scoring**: Per-source reliability indicators based on fetch success rate and content relevance
- **Incremental Sync**: Timestamp-based incremental feed processing preventing redundant article reanalysis

---

## License

MIT License. Designed and engineered for high-signal executive intelligence.
