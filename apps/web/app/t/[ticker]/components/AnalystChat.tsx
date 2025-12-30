"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";

interface AnalystChatProps {
  ticker: string;
}

export function AnalystChat({ ticker }: AnalystChatProps) {
  const { messages, sendMessage, isStreaming, error } = useChat({ ticker });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold">AI Equity Analyst</h2>
        <p className="text-xs text-gray-500">
          Ask about {ticker}'s business, risks, or recent events
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeScreen ticker={ticker} onQuestionClick={sendMessage} />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder={`Ask about ${ticker}...`}
        />
      </div>
    </div>
  );
}
