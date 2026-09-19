import { NextResponse } from "next/server";
import {
  createChatSession,
  getChatSession,
  addMessage,
  getSessionMessages,
  type ChatContext,
} from "@/lib/chat";
import { generateVantageResponse } from "@/lib/vantage-assistant";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context, userId = DEFAULT_USER_ID } = body;
    let { sessionId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "A message string is required." },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim();
    const chatContext: ChatContext = context || { mode: "general" };

    // 1. Resolve or create session
    let session = null;
    if (sessionId) {
      session = await getChatSession(sessionId, userId);
    }

    if (!session) {
      session = await createChatSession(userId, chatContext);
      sessionId = session.id;
    }

    // 2. Persist user message
    await addMessage(session.id, "user", cleanMessage);

    // 3. Retrieve conversation history
    const history = await getSessionMessages(session.id);

    // 4. Generate AI response grounded in context
    const assistantResult = await generateVantageResponse(
      cleanMessage,
      session.context || chatContext,
      history.slice(0, -1) // pass prior messages excluding current one
    );

    // 5. Persist assistant message
    const assistantMsg = await addMessage(
      session.id,
      "assistant",
      assistantResult.answer,
      assistantResult.citations
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionTitle: session.title,
      message: assistantMsg,
      citations: assistantResult.citations,
      modelUsed: assistantResult.modelUsed,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal chat error";
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
