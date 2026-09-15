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
