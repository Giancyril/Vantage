import { pgTable, uuid, text, real, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

// -- Users --------------------------------------------------------------------
export const users = pgTable("users", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull().unique(),
  name:       text("name"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
});

// -- Interests ----------------------------------------------------------------
export const interests = pgTable("interests", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topic:      text("topic").notNull(),
  keywords:   text("keywords").array().notNull().default([]),
  sourceUrls: text("source_urls").array().notNull().default([]),
  weight:     real("weight").notNull().default(1.0),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("interests_user_idx").on(t.userId)]);

// -- Articles (global cache -- analyzed once, shared across users) -------------
export const articles = pgTable("articles", {
  url:           text("url").primaryKey(),
  title:         text("title").notNull(),
  source:        text("source").notNull(),
  publishedAt:   timestamp("published_at"),
  scrapedText:   text("scraped_text"),
  embedding:     real("embedding").array(),
  summary:       text("summary"),
  analyzedAt:    timestamp("analyzed_at"),
  scrapeFailed:  text("scrape_failed"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

// -- Digests ------------------------------------------------------------------
export const digests = pgTable("digests", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status:    text("status").notNull().default("pending"), // pending | sent | failed
  sentAt:    timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("digests_user_idx").on(t.userId)]);

// -- Digest Items -------------------------------------------------------------
export const digestItems = pgTable("digest_items", {
  id:             uuid("id").primaryKey().defaultRandom(),
  digestId:       uuid("digest_id").notNull().references(() => digests.id, { onDelete: "cascade" }),
  articleUrl:     text("article_url").notNull().references(() => articles.url),
  interestId:     uuid("interest_id").references(() => interests.id),
  relevanceScore: real("relevance_score").notNull().default(0),
  summary:        text("summary").notNull(),
  whyItMatters:   text("why_it_matters").notNull(),
  rank:           integer("rank").notNull().default(0),
}, (t) => [index("digest_items_digest_idx").on(t.digestId)]);

// -- Engagement Events ---------------------------------------------------------
export const engagementEvents = pgTable("engagement_events", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleUrl: text("article_url").notNull().references(() => articles.url),
  eventType:  text("event_type").notNull(), // open | click | save | dismiss | more_like_this | less_like_this
  metadata:   jsonb("metadata").default({}),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("engagement_user_idx").on(t.userId), index("engagement_article_idx").on(t.articleUrl)]);

// -- Feed Sources (RSS, Atom, Substack sources monitored for ingestion) -------
export const feedSources = pgTable("feed_sources", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url:           text("url").notNull(),
  title:         text("title").notNull(),
  siteUrl:       text("site_url"),
  feedType:      text("feed_type").notNull().default("rss"), // rss | atom | substack
  lastFetchedAt: timestamp("last_fetched_at"),
  fetchStatus:   text("fetch_status").notNull().default("healthy"), // healthy | warning | error
  failureCount:  integer("failure_count").notNull().default(0),
  errorMessage:  text("error_message"),
  etag:          text("etag"),
  isActive:      integer("is_active").notNull().default(1),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("feed_sources_user_idx").on(t.userId), index("feed_sources_url_idx").on(t.url)]);

// -- Story Clusters (groups of articles covering the same event) -------------
export const storyClusters = pgTable("story_clusters", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:            uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  headline:          text("headline").notNull(),
  summary:           text("summary").notNull(),
  perspectives:      jsonb("perspectives").default([]),        // [{source, angle, sentiment}]
  consensus:         text("consensus"),                        // shared consensus across sources
  contradictions:    jsonb("contradictions").default([]),      // [{claim, sources}]
  biasRatings:       jsonb("bias_ratings").default({}),        // {source: "left"|"center"|"right"}
  topic:             text("topic"),
  articleCount:      integer("article_count").notNull().default(0),
  relevanceScore:    real("relevance_score").notNull().default(0),
  clusterKey:        text("cluster_key").notNull(),            // hash of canonical title keywords
  synthesizedAt:     timestamp("synthesized_at"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
  updatedAt:         timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("clusters_user_idx").on(t.userId),
  index("clusters_key_idx").on(t.clusterKey),
]);

// -- Cluster Articles (junction: which articles belong to a cluster) ----------
export const clusterArticles = pgTable("cluster_articles", {
  id:         uuid("id").primaryKey().defaultRandom(),
  clusterId:  uuid("cluster_id").notNull().references(() => storyClusters.id, { onDelete: "cascade" }),
  articleUrl: text("article_url").notNull().references(() => articles.url),
  source:     text("source").notNull(),
  rank:       integer("rank").notNull().default(0),
  addedAt:    timestamp("added_at").defaultNow().notNull(),
}, (t) => [index("cluster_articles_cluster_idx").on(t.clusterId)]);


// -- Chat Sessions (Ask Vantage conversation sessions) -----------------------
export const chatSessions = pgTable("chat_sessions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title:        text("title").notNull().default("Ask Vantage"),
  context:      jsonb("context").default({}),   // { articleUrl?, clusterKey?, topic? }
  mode:         text("mode").notNull().default("general"), // general | article | cluster | digest
  messageCount: integer("message_count").notNull().default(0),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("chat_sessions_user_idx").on(t.userId)]);

// -- Chat Messages -----------------------------------------------------------
export const chatMessages = pgTable("chat_messages", {
  id:         uuid("id").primaryKey().defaultRandom(),
  sessionId:  uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role:       text("role").notNull(),  // user | assistant | system
  content:    text("content").notNull(),
  citations:  jsonb("citations").default([]),   // [{url, title, source}]
  tokenCount: integer("token_count").default(0),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("chat_messages_session_idx").on(t.sessionId)]);

// -- Type exports -------------------------------------------------------------
export type User            = typeof users.$inferSelect;
export type NewUser         = typeof users.$inferInsert;
export type Interest        = typeof interests.$inferSelect;
export type NewInterest     = typeof interests.$inferInsert;
export type Article         = typeof articles.$inferSelect;
export type NewArticle      = typeof articles.$inferInsert;
export type Digest          = typeof digests.$inferSelect;
export type NewDigest       = typeof digests.$inferInsert;
export type DigestItem      = typeof digestItems.$inferSelect;
export type NewDigestItem   = typeof digestItems.$inferInsert;
export type EngagementEvent = typeof engagementEvents.$inferSelect;
export type FeedSource    = typeof feedSources.$inferSelect;
export type NewFeedSource = typeof feedSources.$inferInsert;
export type StoryCluster    = typeof storyClusters.$inferSelect;
export type NewStoryCluster = typeof storyClusters.$inferInsert;
export type ClusterArticle    = typeof clusterArticles.$inferSelect;
export type NewClusterArticle = typeof clusterArticles.$inferInsert;

export type ChatSession    = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage    = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;


// -- Analytics Snapshots (daily persisted analytics metrics) -----------------
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  userId:               uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date:                 text("date").notNull(),  // YYYY-MM-DD — one row per user per day
  topicWeights:         jsonb("topic_weights").default({}).notNull(),       // { topic: weight }
  engagementSummary:    jsonb("engagement_summary").default({}).notNull(),  // { open, save, click, dismiss, more_like_this }
  emergentKeywords:     jsonb("emergent_keywords").default([]).notNull(),   // [{ keyword, delta, score }]
  velocityScore:        real("velocity_score").default(0).notNull(),        // 7-day rolling avg articles/day
  knowledgeDepthByTopic: jsonb("knowledge_depth_by_topic").default({}).notNull(), // { topic: depth_score }
  topArticlesByScore:   jsonb("top_articles_by_score").default([]).notNull(), // [{ url, title, score }]
  createdAt:            timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("analytics_user_idx").on(t.userId),
  index("analytics_date_idx").on(t.date),
]);

export type AnalyticsSnapshot    = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;

// -- Audio Briefings (AI Executive Podcast) -----------------------------------
export const audioBriefings = pgTable("audio_briefings", {
  id:              uuid("id").primaryKey().defaultRandom(),
  userId:          uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  digestId:        uuid("digest_id"),
  title:           text("title").notNull(),
  durationSeconds: integer("duration_seconds").default(180).notNull(),
  audioUrl:        text("audio_url"),
  script:          text("script").notNull(),
  voice:           text("voice").default("alloy").notNull(),
  segments:        jsonb("segments").default([]).notNull(),
  status:          text("status").default("ready").notNull(),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
}, (t) => [index("audio_briefings_user_idx").on(t.userId)]);

export type AudioBriefing    = typeof audioBriefings.$inferSelect;
export type NewAudioBriefing = typeof audioBriefings.$inferInsert;
