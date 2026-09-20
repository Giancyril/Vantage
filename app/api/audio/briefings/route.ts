import { NextResponse } from "next/server";
import {
  getAudioBriefing,
  getLatestAudioBriefing,
  listAudioBriefings,
  deleteAudioBriefing,
} from "@/lib/audio-storage";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const briefingId = searchParams.get("id");
    const isLatest = searchParams.get("latest") === "true";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // 1. Fetch by specific ID
    if (briefingId) {
      const briefing = await getAudioBriefing(briefingId, userId);
      if (!briefing) {
        return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
      }
      return NextResponse.json({ briefing });
    }

    // 2. Fetch latest available
    if (isLatest) {
      const latest = await getLatestAudioBriefing(userId);
      return NextResponse.json({ briefing: latest });
    }

    // 3. List recent briefings
    const briefings = await listAudioBriefings(userId, limit);
    return NextResponse.json({ briefings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch audio briefings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const briefingId = searchParams.get("id");

    if (!briefingId) {
      return NextResponse.json({ error: "Briefing ID is required" }, { status: 400 });
    }

    const success = await deleteAudioBriefing(briefingId, userId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete briefing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
