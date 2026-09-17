import { NextResponse } from "next/server";
import { getFeedSources, addFeedSource, deleteFeedSource, CURATED_FEED_PRESETS } from "@/lib/sources";
import { discoverFeed } from "@/lib/feedDiscovery";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || DEFAULT_USER_ID;
  const listPresets = searchParams.get("presets");
  const testUrl = searchParams.get("discover");

  if (listPresets === "true") {
    return NextResponse.json({ presets: CURATED_FEED_PRESETS });
  }

  if (testUrl) {
    const discovery = await discoverFeed(testUrl);
    return NextResponse.json({ discovery });
  }

  const sources = await getFeedSources(userId);
  return NextResponse.json({ userId, sources });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || DEFAULT_USER_ID;

    if (!body.url) {
      return NextResponse.json({ error: "Missing feed URL" }, { status: 400 });
    }

    const result = await addFeedSource(userId, body.url, body.title);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to add feed" }, { status: 422 });
    }

    return NextResponse.json({ success: true, source: result.source }, { status: 201 });
  } catch (error) {
    console.error("Failed to create feed source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id query parameter" }, { status: 400 });
    }

    const success = await deleteFeedSource(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to delete feed source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
