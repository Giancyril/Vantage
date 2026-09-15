import { NextResponse } from "next/server";
import { recordEngagement, getSavedArticles } from "@/lib/feedback";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || DEFAULT_USER_ID;
  const type = searchParams.get("type");

  if (type === "saved") {
    const urls = await getSavedArticles(userId);
    return NextResponse.json({ savedUrls: urls });
  }

  return NextResponse.json({ status: "active" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || DEFAULT_USER_ID;

    if (!body.articleUrl || !body.eventType) {
      return NextResponse.json({ error: "Missing articleUrl or eventType" }, { status: 400 });
    }

    const event = await recordEngagement({
      userId,
      articleUrl: body.articleUrl,
      eventType: body.eventType,
      topic: body.topic,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Failed to record engagement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
