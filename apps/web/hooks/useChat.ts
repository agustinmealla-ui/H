"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, StreamChunk } from "@/lib/types";

interface UseChatOptions {
  ticker: string;
  apiBaseUrl?: string;
}

export function useChat({ ticker, apiBaseUrl = "http://localhost:8000" }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      setIsStreaming(true);

      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(`${apiBaseUrl}/api/ticker/${ticker}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, include_context: true }),
          signal: abortController.signal,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim() === "") continue;

              try {
                const chunk: StreamChunk = JSON.parse(data);

                if (chunk.type === "text" && chunk.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + chunk.content }
                        : msg
                    )
                  );
                } else if (chunk.type === "done") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
                    )
                  );
                } else if (chunk.type === "error") {
                  throw new Error(chunk.content || "Unknown error");
                }
              } catch (parseError) {
                console.error("Error parsing SSE chunk:", parseError);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        } else {
          setError(err.message || "Failed to send message");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: "Sorry, I encountered an error. Please try again.",
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [ticker, apiBaseUrl, isStreaming]
  );

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isStreaming,
    error,
    cancelStreaming,
    clearMessages,
  };
}
