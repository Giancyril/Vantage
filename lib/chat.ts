/**
 * Chat Engine - Session management, message history, context assembly
 * for the "Ask Vantage" AI assistant feature.
 */

import { db, hasDatabase } from "@/lib/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// --- Types -------------------------------------------------------------------

export type ChatRole = "user" | "assistant" | "system";

export interface ChatCitation {
  url: string;
  title: string;
  source: string;
}

export interface ChatMsg {
  id?: string;
  role: ChatRole;
  content: string;
  citations?: ChatCitation[];
  createdAt?: string;
}

export interface ChatContext {
  articleUrl?: string;
  articleTitle?: string;
  articleSummary?: string;
  articleSource?: string;
  clusterKey?: string;
  clusterHeadline?: string;
  topic?: string;
  mode: "general" | "article" | "cluster" | "digest";
}

export interface ChatSessionData {
  id: string;
  title: string;
  context: ChatContext;
  mode: string;
  messageCount: number;
  messages: ChatMsg[];
  createdAt: string;
}

// --- In-Memory Fallback ------------------------------------------------------

const inMemorySessions = new Map<string, ChatSessionData>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Session CRUD ------------------------------------------------------------

export async function createChatSession(
  userId: string,
  context: ChatContext,
  title?: string
): Promise<ChatSessionData> {
  const sessionTitle = title || deriveTitleFromContext(context);
  const id = generateId();

  const session: ChatSessionData = {
    id,
    title: sessionTitle,
    context,
    mode: context.mode,
    messageCount: 0,
    messages: [],
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    try {
      const [inserted] = await db
        .insert(chatSessions)
        .values({
          userId,
          title: sessionTitle,
          context: context as Record<string, unknown>,
          mode: context.mode,
          messageCount: 0,
        })
        .returning();
      session.id = inserted.id;
      session.createdAt = inserted.createdAt.toISOString();
    } catch (e) {
      console.warn("DB session create failed, using in-memory:", e);
    }
  }

  inMemorySessions.set(session.id, session);
  return session;
}

export async function getChatSession(
  sessionId: string,
  userId: string
): Promise<ChatSessionData | null> {
  const mem = inMemorySessions.get(sessionId);
  if (mem) return mem;

  if (!hasDatabase) return null;

  try {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    if (!session || session.userId !== userId) return null;

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    const sessionData: ChatSessionData = {
      id: session.id,
      title: session.title,
      context: (session.context as ChatContext) || { mode: "general" },
      mode: session.mode,
      messageCount: session.messageCount,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role as ChatRole,
        content: m.content,
        citations: (m.citations as ChatCitation[]) || [],
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: session.createdAt.toISOString(),
    };

    inMemorySessions.set(sessionId, sessionData);
    return sessionData;
  } catch (e) {
    console.warn("DB session fetch failed:", e);
    return null;
  }
}

export async function listChatSessions(userId: string): Promise<ChatSessionData[]> {
  const memSessions = Array.from(inMemorySessions.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  if (!hasDatabase) return memSessions;

  try {
    const rows = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(20);

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      context: (r.context as ChatContext) || { mode: "general" },
      mode: r.mode,
      messageCount: r.messageCount,
      messages: [],
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return memSessions;
  }
}

// --- Message Management ------------------------------------------------------

export async function addMessage(
  sessionId: string,
  role: ChatRole,
  content: string,
  citations: ChatCitation[] = []
): Promise<ChatMsg> {
  const msg: ChatMsg = {
    id: generateId(),
    role,
    content,
    citations,
    createdAt: new Date().toISOString(),
  };

  const session = inMemorySessions.get(sessionId);
  if (session) {
    session.messages.push(msg);
    session.messageCount = session.messages.length;
  }

  if (hasDatabase) {
    try {
      const [inserted] = await db
        .insert(chatMessages)
        .values({
          sessionId,
          role,
          content,
          citations: citations as unknown[],
          tokenCount: Math.ceil(content.length / 4),
        })
        .returning();
      msg.id = inserted.id;
      msg.createdAt = inserted.createdAt.toISOString();

      await db
        .update(chatSessions)
        .set({ messageCount: (session?.messageCount ?? 0), updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId));
    } catch (e) {
      console.warn("DB message insert failed:", e);
    }
  }

  return msg;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMsg[]> {
  const session = inMemorySessions.get(sessionId);
  if (session && session.messages.length > 0) return session.messages;

  if (!hasDatabase) return [];

  try {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return rows.map((m) => ({
      id: m.id,
      role: m.role as ChatRole,
      content: m.content,
      citations: (m.citations as ChatCitation[]) || [],
      createdAt: m.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

// --- Context & System Prompt -------------------------------------------------

export function buildSystemPrompt(context: ChatContext): string {
  const base = `You are Vantage, an elite AI intelligence analyst embedded in the Vantage news platform.
You have access to curated news intelligence, cross-source synthesis, and the user's interest profile.
You speak with precision, authority, and nuance - like a trusted senior analyst.
Always cite sources when making claims. Be concise, structured, and insightful.
Avoid generic filler. Every sentence should deliver signal, not noise.`;

  if (context.mode === "article" && context.articleTitle) {
    return `${base}

CURRENT ARTICLE CONTEXT:
Title: ${context.articleTitle}
Source: ${context.articleSource || "Unknown"}
Summary: ${context.articleSummary || "Not available"}
URL: ${context.articleUrl || ""}

The user is asking questions about this specific article. Ground your responses in this article and provide expert analysis, implications, and connections to broader trends.`;
  }

  if (context.mode === "cluster" && context.clusterHeadline) {
    return `${base}

CURRENT STORY CLUSTER CONTEXT:
Story: ${context.clusterHeadline}
Topic Area: ${context.topic || "AI & Tech"}

The user is analyzing a multi-source story cluster. Help them understand nuances, conflicting narratives, and strategic implications across different reporting angles.`;
  }

  if (context.topic) {
    return `${base}

USER INTEREST AREA: ${context.topic}

Tailor your analysis and recommendations to this specific interest area.`;
  }

  return base;
}

export function buildConversationHistory(
  messages: ChatMsg[]
): Array<{ role: string; content: string }> {
  return messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function deriveTitleFromContext(context: ChatContext): string {
  if (context.articleTitle) {
    return context.articleTitle.slice(0, 60) + (context.articleTitle.length > 60 ? "..." : "");
  }
  if (context.clusterHeadline) {
    return `Cluster: ${context.clusterHeadline.slice(0, 50)}`;
  }
  if (context.topic) {
    return `Ask Vantage - ${context.topic}`;
  }
  return "Ask Vantage";
}

export function getSuggestedPrompts(context: ChatContext): string[] {
  if (context.mode === "article" && context.articleTitle) {
    return [
      "What are the key strategic implications of this story?",
      "What did other sources say about this?",
      "What should I watch for as a follow-up?",
      "Explain the technical details in plain language",
      "How does this connect to broader market trends?",
    ];
  }

  if (context.mode === "cluster" && context.clusterHeadline) {
    return [
      "Which outlet has the most credible take on this?",
      "What are the key contradictions between sources?",
      "What are the second-order effects of this development?",
      "Who are the key players and what are their incentives?",
      "How might this story evolve over the next 30 days?",
    ];
  }

  return [
    "What are the most important AI developments this week?",
    "Summarize my interest areas and latest signals",
    "What emerging risks should I be tracking?",
    "What consensus is forming across my feed sources?",
    "Give me a 60-second executive briefing",
  ];
}
