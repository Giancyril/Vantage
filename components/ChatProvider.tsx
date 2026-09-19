"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ChatContext } from "@/lib/chat";
import { ChatDrawer } from "@/components/ChatDrawer";

interface ChatContextValue {
  isOpen: boolean;
  openChat: (context?: ChatContext, initialMessage?: string, sessionId?: string) => void;
  closeChat: () => void;
}

const ChatStateContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<ChatContext>({ mode: "general" });
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const openChat = useCallback(
    (newContext?: ChatContext, newInitialMsg?: string, newSessionId?: string) => {
      if (newContext) {
        setContext(newContext);
      }
      setInitialMessage(newInitialMsg);
      setSessionId(newSessionId);
      setIsOpen(true);
    },
    []
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatStateContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      <ChatDrawer
        isOpen={isOpen}
        onClose={closeChat}
        context={context}
        initialMessage={initialMessage}
        sessionId={sessionId}
        onSessionChange={setSessionId}
      />
    </ChatStateContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatStateContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
}
