/**
 * Unit tests for Ask Vantage Chat Engine and Assistant
 */
import {
  createChatSession,
  getChatSession,
  listChatSessions,
  addMessage,
  getSessionMessages,
  deleteChatSession,
  buildSystemPrompt,
  buildConversationHistory,
  getSuggestedPrompts,
  type ChatContext,
  type ChatMsg,
} from "../lib/chat";
import { generateVantageResponse } from "../lib/vantage-assistant";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${actual} !== ${expected}. ${message || ""}`);
  }
}

export async function runChatTests() {
  console.log("--> Testing createChatSession and getChatSession...");
  const testUserId = "test-user-" + Date.now();
  const context: ChatContext = {
    mode: "article",
    articleUrl: "https://example.com/ai-breakthrough",
    articleTitle: "Anthropic Releases New Frontier Model",
    articleSummary: "Anthropic has launched a new reasoning-oriented model with improved benchmark scores.",
    articleSource: "TechCrunch",
    topic: "AI Agents",
  };

  const session = await createChatSession(testUserId, context);
  assert(!!session.id, "Session must have an ID");
  assertEqual(session.mode, "article", "Session mode should be 'article'");
  assert(session.title.includes("Anthropic Releases"), "Session title should derive from article title");
  assertEqual(session.messageCount, 0, "Initial message count must be 0");

  const userSessions = await listChatSessions(testUserId);
  assert(userSessions.length > 0, "Should list user sessions");

  const fetchedSession = await getChatSession(session.id, testUserId);
  assert(!!fetchedSession, "Should retrieve existing session");
  assertEqual(fetchedSession?.id, session.id, "Fetched session ID must match");

  console.log("--> Testing addMessage and getSessionMessages...");
  const userMsg = await addMessage(session.id, "user", "What are the key implications of this model?");
  assertEqual(userMsg.role, "user", "Message role must be 'user'");
  assert(userMsg.content.includes("implications"), "Content should match input");

  const assistantMsg = await addMessage(
    session.id,
    "assistant",
    "Here are the strategic implications...",
    [{ url: context.articleUrl!, title: context.articleTitle!, source: context.articleSource! }]
  );
  assertEqual(assistantMsg.role, "assistant", "Message role must be 'assistant'");
  assertEqual(assistantMsg.citations?.length, 1, "Should have 1 citation");

  const messages = await getSessionMessages(session.id);
  assertEqual(messages.length, 2, "Session should have 2 messages");

  console.log("--> Testing buildSystemPrompt...");
  const articlePrompt = buildSystemPrompt(context);
  assert(articlePrompt.includes("CURRENT ARTICLE CONTEXT:"), "Article prompt must include article context header");
  assert(articlePrompt.includes("Anthropic Releases New Frontier Model"), "Prompt must include article title");

  const clusterPrompt = buildSystemPrompt({
    mode: "cluster",
    clusterHeadline: "OpenAI and Google Announce Multi-Agent Frameworks",
  });
  assert(clusterPrompt.includes("CURRENT STORY CLUSTER CONTEXT:"), "Cluster prompt must include cluster context header");

  const generalPrompt = buildSystemPrompt({ mode: "general" });
  assert(generalPrompt.includes("You are Vantage"), "General prompt must include base persona");

  console.log("--> Testing buildConversationHistory...");
  const testMsgs: ChatMsg[] = [
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello" },
  ];
  const history = buildConversationHistory(testMsgs);
  assertEqual(history.length, 2, "History length must match");
  assertEqual(history[0].role, "user", "Role must be preserved");

  console.log("--> Testing getSuggestedPrompts...");
  const articlePrompts = getSuggestedPrompts(context);
  assert(articlePrompts.length >= 3, "Should have at least 3 suggested prompts for article");
  assert(articlePrompts.some((p) => p.toLowerCase().includes("implication")), "Should contain strategic inquiry");

  console.log("--> Testing generateVantageResponse (Analytical Fallback)...");
  const response = await generateVantageResponse(
    "What are the strategic implications of this?",
    context,
    messages
  );
  assert(!!response.answer, "Response must contain answer text");
  assert(response.answer.includes("Strategic Implications"), "Answer should contain strategic section");
  assertEqual(response.citations.length, 1, "Citations should include article");
  assertEqual(response.citations[0].url, context.articleUrl, "Citation URL must match articleUrl");

  console.log("--> Testing deleteChatSession...");
  const deleted = await deleteChatSession(session.id, testUserId);
  assertEqual(deleted, true, "deleteChatSession should return true");

  console.log("✓ All Chat Engine and Assistant tests passed successfully!");
}

runChatTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
