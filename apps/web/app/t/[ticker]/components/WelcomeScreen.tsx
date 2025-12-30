"use client";

import { useEffect, useState } from "react";
import type { WelcomeData } from "@/lib/types";

interface WelcomeScreenProps {
  ticker: string;
  onQuestionClick: (question: string) => void;
}

export function WelcomeScreen({ ticker, onQuestionClick }: WelcomeScreenProps) {
  const [welcome, setWelcome] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/ticker/${ticker}/chat/welcome`
        );
        if (!res.ok) throw new Error("Failed to load welcome message");
        const data = await res.json();
        if (alive) setWelcome(data);
      } catch (err) {
        console.error("Failed to load welcome:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {welcome?.company_name || ticker}
        </h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {welcome?.welcome_message ||
            `Ask me anything about ${ticker}!`}
        </p>
      </div>

      {welcome?.suggested_questions && welcome.suggested_questions.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-xs text-gray-500 mb-3">Suggested questions:</p>
          <div className="space-y-2">
            {welcome.suggested_questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => onQuestionClick(q)}
                className="w-full text-left px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
