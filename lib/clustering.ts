import { db, hasDatabase } from "@/lib/db";
import { articles, storyClusters, clusterArticles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { articleSimilarity, generateClusterKey } from "./similarity";

export interface ClusterCandidate {
  url: string;
  title: string;
  summary: string;
  source: string;
  relevanceScore?: number;
  topic?: string;
  publishedAt?: string;
}

export interface ClusteredGroup {
  id?: string;
  clusterKey: string;
  headline: string;
  summary: string;
  articles: ClusterCandidate[];
  relevanceScore: number;
  articleCount: number;
  topic?: string;
}

const SIMILARITY_THRESHOLD = 0.30; // Threshold for grouping related stories

/**
 * Groups an array of candidate articles into story clusters
 * using agglomerative single-linkage semantic clustering.
 */
export function clusterArticleList(candidates: ClusterCandidate[]): ClusteredGroup[] {
  if (candidates.length === 0) return [];

  const visited = new Set<string>();
  const groups: ClusteredGroup[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const current = candidates[i];
    if (visited.has(current.url)) continue;

    const groupMembers: ClusterCandidate[] = [current];
    visited.add(current.url);

    for (let j = i + 1; j < candidates.length; j++) {
      const target = candidates[j];
      if (visited.has(target.url)) continue;

      // Check max similarity against any existing member in the cluster
      const maxSim = Math.max(
        ...groupMembers.map((m) =>
          articleSimilarity(m.title, m.summary || "", target.title, target.summary || "")
        )
      );

      if (maxSim >= SIMILARITY_THRESHOLD) {
        groupMembers.push(target);
        visited.add(target.url);
      }
    }

    // Sort members by relevance score descending
    groupMembers.sort((a, b) => (b.relevanceScore || 0.8) - (a.relevanceScore || 0.8));

    // Best article represents the cluster headline and summary
    const representative = groupMembers[0];
    const clusterKey = generateClusterKey(representative.title);

    const avgScore =
      groupMembers.reduce((acc, m) => acc + (m.relevanceScore || 0.8), 0) /
      groupMembers.length;

    groups.push({
      clusterKey,
      headline: representative.title,
      summary: representative.summary || "",
      articles: groupMembers,
      relevanceScore: Math.round(avgScore * 100) / 100,
      articleCount: groupMembers.length,
      topic: representative.topic || "AI & Tech",
    });
  }

  // Multi-article stories appear first, then sorted by relevance
  return groups.sort((a, b) => {
    if (b.articles.length !== a.articles.length) {
      return b.articles.length - a.articles.length;
    }
    return b.relevanceScore - a.relevanceScore;
  });
}

// In-memory cluster store for demo/no-db mode
let inMemoryClusters: ClusteredGroup[] = [];

export function getInMemoryClusters(): ClusteredGroup[] {
  return inMemoryClusters;
}

export function setInMemoryClusters(clusters: ClusteredGroup[]): void {
  inMemoryClusters = clusters;
}

/**
 * Runs the clustering pipeline for all available articles and syncs
 * to the database or in-memory store.
 */
export async function runClusteringForUser(
  userId: string,
  extraCandidates?: ClusterCandidate[]
): Promise<ClusteredGroup[]> {
  const candidatePool: ClusterCandidate[] = [...(extraCandidates || [])];

  if (hasDatabase) {
    try {
      const dbArticles = await db
        .select({
          url: articles.url,
          title: articles.title,
          summary: articles.summary,
          source: articles.source,
          createdAt: articles.createdAt,
        })
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(100);

      for (const a of dbArticles) {
        if (!candidatePool.some((c) => c.url === a.url)) {
          candidatePool.push({
            url: a.url,
            title: a.title,
            summary: a.summary || "",
            source: a.source,
            relevanceScore: 0.85,
            publishedAt: a.createdAt?.toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn("Could not load articles from database for clustering:", err);
    }
  }

  const clusters = clusterArticleList(candidatePool);

  if (hasDatabase) {
    try {
      for (const cluster of clusters) {
        const existing = await db
          .select()
          .from(storyClusters)
          .where(
            and(
              eq(storyClusters.userId, userId),
              eq(storyClusters.clusterKey, cluster.clusterKey)
            )
          )
          .limit(1);

        let clusterId: string;

        if (existing.length > 0) {
          clusterId = existing[0].id;
          cluster.id = clusterId;
          await db
            .update(storyClusters)
            .set({
              articleCount: cluster.articles.length,
              relevanceScore: cluster.relevanceScore,
              updatedAt: new Date(),
            })
            .where(eq(storyClusters.id, clusterId));
        } else {
          const [inserted] = await db
            .insert(storyClusters)
            .values({
              userId,
              headline: cluster.headline,
              summary: cluster.summary,
              clusterKey: cluster.clusterKey,
              articleCount: cluster.articles.length,
              relevanceScore: cluster.relevanceScore,
              topic: cluster.topic || "AI & Tech",
              perspectives: [],
              contradictions: [],
              biasRatings: {},
            })
            .returning();
          clusterId = inserted.id;
          cluster.id = clusterId;
        }

        // Link articles
        for (let rank = 0; rank < cluster.articles.length; rank++) {
          const art = cluster.articles[rank];
          const existingJunction = await db
            .select()
            .from(clusterArticles)
            .where(
              and(
                eq(clusterArticles.clusterId, clusterId),
                eq(clusterArticles.articleUrl, art.url)
              )
            )
            .limit(1);

          if (existingJunction.length === 0) {
            try {
              await db.insert(clusterArticles).values({
                clusterId,
                articleUrl: art.url,
                source: art.source,
                rank,
              });
            } catch {
              // Ignore foreign key violations if article is only in memory
            }
          }
        }
      }
    } catch (err) {
      console.warn("Failed to persist clusters to database:", err);
    }
  }

  // Always update in-memory cache as well
  setInMemoryClusters(clusters);
  return clusters;
}

/**
 * Fetches existing clusters for a user.
 */
export async function getClustersForUser(userId: string): Promise<ClusteredGroup[]> {
  if (hasDatabase) {
    try {
      const records = await db
        .select()
        .from(storyClusters)
        .where(eq(storyClusters.userId, userId))
        .orderBy(desc(storyClusters.relevanceScore));

      if (records.length > 0) {
        const result: ClusteredGroup[] = [];
        for (const r of records) {
          const arts = await db
            .select({
              articleUrl: clusterArticles.articleUrl,
              source: clusterArticles.source,
              rank: clusterArticles.rank,
            })
            .from(clusterArticles)
            .where(eq(clusterArticles.clusterId, r.id))
            .orderBy(clusterArticles.rank);

          result.push({
            id: r.id,
            clusterKey: r.clusterKey,
            headline: r.headline,
            summary: r.summary,
            relevanceScore: r.relevanceScore,
            articleCount: r.articleCount,
            topic: r.topic || "AI & Tech",
            articles: arts.map((a: { articleUrl: string; source: string; rank: number }) => ({
              url: a.articleUrl,
              title: r.headline,
              summary: r.summary,
              source: a.source,
            })),
          });
        }
        return result;
      }
    } catch (err) {
      console.warn("Failed to load clusters from db, using in-memory:", err);
    }
  }

  return getInMemoryClusters();
}
