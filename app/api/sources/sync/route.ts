import { NextResponse } from "next/server";
import { syncAllUserFeeds, syncFeedSource } from "@/lib/feedSync";
import { getFeedSources } from "@/lib/sources";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || DEFAULT_USER_ID;
    const sourceId = body.sourceId;

    if (sourceId) {
      const sources = await getFeedSources(userId);
      const target = sources.find((s) => s.id === sourceId);
      if (!target) {
        return NextResponse.json({ error: "Feed source not found" }, { status: 404 });
      }

      const result = await syncFeedSource(target);
      return NextResponse.json({ success: true, result });
    }

    const summary = await syncAllUserFeeds(userId);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Failed to execute feed sync:", error);
    return NextResponse.json({ error: "Internal server error during feed sync" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || DEFAULT_USER_ID;

  const sources = await getFeedSources(userId);
  const total = sources.length;
  const healthy = sources.filter((s) => s.fetchStatus === "healthy").length;
  const warnings = sources.filter((s) => s.fetchStatus === "warning").length;
  const errors = sources.filter((s) => s.fetchStatus === "error").length;

  return NextResponse.json({
    userId,
    stats: {
      totalSources: total,
      healthy,
      warnings,
      errors,
      lastSyncTimestamps: sources
        .map((s) => ({ id: s.id, title: s.title, lastFetchedAt: s.lastFetchedAt }))
        .filter((s) => s.lastFetchedAt !== null),
    },
  });
}
