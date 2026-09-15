# Distill — Personalized AI News Intelligence Agent

A production-grade, autonomous AI news intelligence platform that reads hundreds of articles daily, extracts full text, models personal interest profiles, and delivers synthesized executive briefings via email and an editorial web reader — continuously learning from what you read, save, and dismiss.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DISCOVERY ENGINE                                │
│   Tavily Multi-Domain Search  ──▶  URL Normalization  ──▶  Global Dedup     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTRACTION PIPELINE                              │
│   Firecrawl Scraper  ──▶  Clean Markdown Extraction  ──▶  Failure Resilience │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANALYSIS ENGINE                                │
│   OpenAI GPT-4o-mini  ──▶  Relevance Scoring (0-1)  ──▶  "Why It Matters"  │
│   Near-Duplicate Cosine Clustering  ──▶  Global Analysis Cache (Cost Opt)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ASSEMBLY & RANKING                              │
│   Composite Score = Relevance × Interest Weight  ──▶  Topic Grouping        │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       ▼                               ▼
       ┌───────────────────────────────┐  ┌───────────────────────────────────┐
       │       DELIVERY PIPELINE       │  │           EDITORIAL UI            │
       │  React Email + Resend API     │  │  Next.js 16 (Turbopack)           │
       │  6:00 AM UTC Daily Briefing   │  │  Single-Column Reading Stream     │
       └───────────────┬───────────────┘  └───────────────────┬───────────────┘
                       │                                      │
                       └───────────────────┬──────────────────┘
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADAPTIVE FEEDBACK LOOP                             │
│   Engagement Events (Open/Click/Save/Dismiss)  ──▶  Nightly Dynamic Reweight│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Core Capabilities
- **Multi-Source Discovery Engine**: Automated news discovery across targeted domains using Tavily Search with domain-specific query expansion and global deduplication.
- **Resilient Content Extraction**: Full-text article scraping with Firecrawl, clean markdown transformation, and graceful degradation for paywalled or broken pages.
- **Autonomous Analysis & "Why It Matters"**: Every article is evaluated against your specific keywords. Generates a concise 2-sentence summary, a 0–1 relevance score, and an individualized "Why This Matters to You" briefing.
- **Near-Duplicate Story Clustering**: Identifies stories covering the same real-world event across multiple outlets, keeping only the highest-scoring authoritative piece.
- **Cost-Optimized Global Caching**: Stories are analyzed once in the central catalog and reused across all users sharing related interests.
- **Adaptive Weight Adaptation**: Continuous reinforcement learning loop that automatically tunes topic weights based on opens, reads, saves (+0.05), explicit "more like this" (+0.15), and dismissals (-0.10).
- **Distraction-Free Editorial Web Feed**: Single-column reading experience inspired by Mailbrew and Artifact, featuring serif typography, source badges, and one-click feedback.
- **React Email Delivery**: Responsive, publication-grade HTML briefings delivered straight to your inbox via Resend.
- **Transparent Interest Manager**: Visible, interactive interest dashboard with weight sliders, keyword badges, and custom domain tracking.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Database & ORM**: PostgreSQL (Supabase) with Drizzle ORM
- **AI & Analysis**: OpenAI API (`gpt-4o-mini`, structured outputs, embeddings)
- **Search & Discovery**: Tavily News Search API
- **Web Extraction**: Firecrawl Scrape API
- **Email Engine**: React Email + Resend
- **Styling**: Vanilla Tailwind CSS with custom editorial design tokens
- **Orchestration**: Trigger.dev v3 background task pipelines & webhook scheduling

---

## Database Schema

```
users (id, email, name, created_at, updated_at)
  │
  ├──< interests (id, user_id, topic, keywords[], source_urls[], weight, timestamps)
  │
  ├──< digests (id, user_id, status, sent_at, created_at)
  │      │
  │      └──< digest_items (id, digest_id, article_url, relevance_score, summary, why_it_matters, rank)
  │
  └──< engagement_events (id, user_id, article_url, event_type, metadata, created_at)

articles (url [PK], title, source, published_at, scraped_text, embedding, summary, analyzed_at, scrape_failed)
```

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Giancyril/Distill.git
cd Distill

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Supabase Auth / Client
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# AI Analysis
OPENAI_API_KEY=sk-proj-...

# Discovery & Extraction
TAVILY_API_KEY=tvly-...
FIRECRAWL_API_KEY=fc-...

# Background Scheduling & Delivery
TRIGGER_SECRET_KEY=tr_dev_...
RESEND_API_KEY=re_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: The application includes built-in heuristic fallbacks and local mock providers so you can run, test, and develop offline without live API credentials.

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Automated Test Suite
```bash
# Run unit & pipeline verification tests
npx tsx tests/interests.test.ts
npx tsx tests/pipeline.test.ts

# Production build verification
npm run build
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/interests` | Get user active interests or curated domain presets |
| `POST` | `/api/interests` | Create a new domain or batch seed presets |
| `PATCH` | `/api/interests` | Update interest weight or keywords |
| `DELETE` | `/api/interests` | Remove interest domain |
| `POST` | `/api/pipeline/discover` | Run multi-domain news discovery |
| `POST` | `/api/pipeline/run` | Execute complete end-to-end distillation pipeline |
| `POST` | `/api/feedback` | Record engagement signals and trigger adaptive reweighting |
| `POST` | `/api/trigger` | Webhook endpoint for scheduled cron executions |

---

## License

MIT License. Designed and engineered for high-signal executive intelligence.
