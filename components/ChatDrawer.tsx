"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  Newspaper,
  Layers,
  Compass,
  MessageSquare,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";
import type { ChatContext, ChatMsg, ChatSessionData } from "@/lib/chat";
import { ChatMessage } from "@/components/ChatMessage";

export interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
  initialMessage?: string;
  sessionId?: string;
  onSessionChange?: (newSessionId: string) => void;
}

export function ChatDrawer({
  isOpen,
  onClose,
  context = { mode: "general" },
  initialMessage,
  sessionId: propSessionId,
  onSessionChange,
}: ChatDrawerProps) {
  const [sessionId, setSessionId] = useState<string | undefined>(propSessionId);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [showSessionsList, setShowSessionsList] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialSentRef = useRef(false);

  const handleSend = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText !== undefined ? messageText : input;
      if (!textToSend.trim() || loading) return;

      const userMessageContent = textToSend.trim();
      setInput("");
      setError(null);

      // Optimistically add user message
      const tempUserMsg: ChatMsg = {
        role: "user",
        content: userMessageContent,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessageContent,
            sessionId,
            context,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send message");
        }

        const data = await res.json();
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
          onSessionChange?.(data.sessionId);
        }

        setMessages((prev) => [...prev, data.message]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error sending message";
        setError(msg);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, loading, sessionId, context, onSessionChange]
  );

  // Load session or initialize when opened or when propSessionId changes
  useEffect(() => {
    if (!isOpen) {
      initialSentRef.current = false;
      return;
    }

    let ignore = false;

    // Load available recent sessions
    const fetchRecentSessions = async () => {
      try {
        const res = await fetch("/api/chat/sessions");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.sessions) {
            setSessions(data.sessions);
          }
        }
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    };

    fetchRecentSessions();

    const targetSessionId = propSessionId ?? sessionId;
    if (targetSessionId) {
      const loadSession = async () => {
        try {
          const res = await fetch(`/api/chat/sessions?sessionId=${targetSessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (!ignore && data.session) {
              setMessages(data.session.messages || []);
              setSessionId(targetSessionId);
            }
          }
        } catch (e) {
          console.error("Failed to load session messages:", e);
        }
      };
      loadSession();
    }

    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      ignore = true;
    };
  }, [isOpen, propSessionId, sessionId]);

  // Trigger initial message once if provided
  useEffect(() => {
    if (isOpen && initialMessage && !initialSentRef.current) {
      initialSentRef.current = true;
      const timer = setTimeout(() => {
        handleSend(initialMessage);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMessage, handleSend]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewSession = () => {
    setSessionId(undefined);
    setMessages([]);
    setError(null);
    setShowSessionsList(false);
    onSessionChange?.("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteSession = async (sId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions?sessionId=${sId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sId));
      if (sessionId === sId) {
        handleNewSession();
      }
    } catch (err) {
      console.error("Delete session error:", err);
    }
  };

  if (!isOpen) return null;

  // Context-aware suggested prompts
  const suggestedPrompts = [
    ...(context.mode === "article" && context.articleTitle
      ? [
          "What are the strategic implications of this?",
          "Explain the technical details in plain language",
          "What should I watch for as a follow-up?",
          "How does this compare to other industry moves?",
        ]
      : context.mode === "cluster"
      ? [
          "Which outlet has the most authoritative take?",
          "What are the key conflicting viewpoints?",
          "What are the second-order market effects?",
        ]
      : [
          "What are the most critical AI developments today?",
          "Give me an executive briefing on my top interests",
          "What emerging trends should I be paying attention to?",
        ]),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181715]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-[#FAF8F5] border-l border-[#E8E4DC] shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#E8E4DC] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#181715] flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-lg font-bold text-[#181715] tracking-tight truncate">
                    Ask Vantage
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#181715] text-white uppercase tracking-wider">
                    {context.mode === "article" ? (
                      <>
                        <Newspaper className="w-3 h-3 text-amber-400" />
                        Article
                      </>
                    ) : context.mode === "cluster" ? (
                      <>
                        <Layers className="w-3 h-3 text-amber-400" />
                        Cluster
                      </>
                    ) : (
                      <>
                        <Compass className="w-3 h-3 text-amber-400" />
                        Global
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#7A746B] truncate max-w-xs sm:max-w-sm">
                  {context.articleTitle || context.clusterHeadline || "Intelligence Assistant grounded in your news stream"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSessionsList(!showSessionsList)}
                className={`p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors ${
                  showSessionsList ? "bg-[#F3F0EA] text-[#181715]" : ""
                }`}
                title="History Sessions"
              >
                <Clock className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNewSession}
                className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors"
                title="New Session"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#7A746B] hover:text-[#181715] hover:bg-[#F3F0EA] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions Dropdown Panel */}
          {showSessionsList && (
            <div className="bg-[#F3F0EA] border-b border-[#E8E4DC] p-3 max-h-48 overflow-y-auto animate-in slide-in-from-top duration-150">
              <div className="text-xs font-semibold text-[#7A746B] uppercase tracking-wider mb-2 px-1">
                Recent Conversations
              </div>
              {sessions.length === 0 ? (
                <div className="text-xs text-[#7A746B] px-1 italic">No previous sessions found.</div>
              ) : (
                <div className="space-y-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSessionId(s.id);
                        setShowSessionsList(false);
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        sessionId === s.id
                          ? "bg-white text-[#181715] font-medium shadow-xs"
                          : "text-[#524E48] hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#7A746B]" />
                        <span className="truncate">{s.title || "Conversation"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="p-1 text-[#7A746B] hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Context Banner */}
          {context.articleTitle && (
            <div className="bg-amber-50/70 border-b border-amber-200/50 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
              <span className="truncate">
                Grounded in: <strong>{context.articleTitle}</strong>
              </span>
              {context.articleSource && (
                <span className="text-amber-700/80 font-medium shrink-0 ml-2">
                  {context.articleSource}
                </span>
              )}
            </div>
          )}

          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-white border border-[#E8E4DC] flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-editorial text-lg font-bold text-[#181715]">
                    Ask Vantage Anything
                  </h4>
                  <p className="text-xs text-[#7A746B] max-w-sm mt-1">
                    {context.mode === "article"
                      ? "Analyze this article, explore counter-arguments, or extract strategic takeaways."
                      : "Query our synthesis engine, compare industry developments, or review executive briefings."}
                  </p>
                </div>

                {/* Suggested Starters */}
                <div className="w-full max-w-md pt-2">
                  <div className="text-[11px] font-semibold text-[#7A746B] uppercase tracking-wider mb-2">
                    Suggested Inquiries
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="p-2.5 rounded-xl bg-white border border-[#E8E4DC] hover:border-amber-400 hover:bg-amber-50/40 text-xs text-[#2E2C29] transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <span>{prompt}</span>
                        <Send className="w-3 h-3 text-[#7A746B] group-hover:text-amber-600 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
                  <ChatMessage
                    key={m.id || idx}
                    role={m.role}
                    content={m.content}
                    citations={m.citations}
                    createdAt={m.createdAt}
                  />
                ))}

                {loading && (
                  <ChatMessage
                    role="assistant"
                    content="Analyzing intelligence context and synthesizing insights..."
                    isStreaming={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-4 mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-4 bg-white border-t border-[#E8E4DC] shrink-0">
            <div className="relative flex items-end gap-2 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl p-2 focus-within:border-[#181715] focus-within:ring-1 focus-within:ring-[#181715] transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  context.mode === "article"
                    ? "Ask about this article... (Press Enter to send)"
                    : "Ask Vantage intelligence... (Press Enter to send)"
                }
                rows={1}
                className="w-full resize-none bg-transparent border-0 text-sm text-[#181715] placeholder-[#7A746B] focus:outline-hidden max-h-32 px-1 py-1"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-[#181715] text-amber-400 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 shadow-xs cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#7A746B]">
              <span>Powered by Vantage Intelligence Engine</span>
              <span>Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
