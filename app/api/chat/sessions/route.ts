import { NextResponse } from "next/server";
import {
  listChatSessions,
  getChatSession,
  createChatSession,
  deleteChatSession,
  type ChatContext,
} from "@/lib/chat";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const session = await getChatSession(sessionId, userId);
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = await listChatSessions(userId);
    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve sessions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || DEFAULT_USER_ID;
    const context: ChatContext = body.context || { mode: "general" };
    const title: string | undefined = body.title;

    const session = await createChatSession(userId, context, title);
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const success = await deleteChatSession(sessionId, userId);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
