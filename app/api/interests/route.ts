import { NextResponse } from "next/server";
import { getUserInterests, addInterest, updateInterestWeight, removeInterest, seedStarterTopics, CURATED_TOPICS } from "@/lib/interests";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || DEFAULT_USER_ID;
  const listCurated = searchParams.get("curated");

  if (listCurated === "true") {
    return NextResponse.json({ curatedTopics: CURATED_TOPICS });
  }

  const items = await getUserInterests(userId);
  return NextResponse.json({ userId, interests: items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || DEFAULT_USER_ID;

    // Batch seed starter topics
    if (body.topicIds && Array.isArray(body.topicIds)) {
      const seeded = await seedStarterTopics(userId, body.topicIds);
      return NextResponse.json({ success: true, seeded });
    }

    if (!body.topic || !Array.isArray(body.keywords)) {
      return NextResponse.json({ error: "Missing topic or keywords array" }, { status: 400 });
    }

    const created = await addInterest(userId, {
      topic: body.topic,
      keywords: body.keywords,
      sourceUrls: body.sourceUrls,
      weight: body.weight ?? 1.0,
    });

    return NextResponse.json({ success: true, interest: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create interest:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id || typeof body.weight !== "number") {
      return NextResponse.json({ error: "Missing id or numeric weight" }, { status: 400 });
    }

    const success = await updateInterestWeight(body.id, body.weight);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to update interest:", error);
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

    const success = await removeInterest(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Failed to delete interest:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
