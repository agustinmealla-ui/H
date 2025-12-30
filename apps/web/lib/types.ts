/**
 * TypeScript Types
 * Mirror of backend schemas - should match Server/api/models/schemas.py
 */

// ==================== Chat Types ====================

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface StreamChunk {
  type: "text" | "citation" | "done" | "error";
  content?: string;
  source?: string;
  section?: string;
}

export interface WelcomeData {
  welcome_message: string;
  suggested_questions: string[];
  ticker: string;
  company_name: string;
}

// ==================== Ticker Types ====================

export interface Point {
  date: string;
  price: number;
  ret: number;
  cumret: number;
  vol_20d: number;
  bench_price: number;
  bench_cumret: number;
  price_norm: number;
  bench_price_norm: number;
}

export interface Summary {
  ann_return: number;
  ann_vol: number;
  sharpe: number | null;
  max_drawdown: number;
  beta: number | null;
  corr: number;
  skewness: number;
  kurtosis: number;
}

export interface TailDay {
  date: string;
  ret: number;
}

export interface TailDays {
  best: TailDay[];
  worst: TailDay[];
}

export interface Fundamentals {
  market_cap: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  avg_volume: number | null;
  sector: string | null;
  industry: string | null;
}

export interface HistogramBin {
  range: string;
  count: number;
}

export interface TickerOverviewResponse {
  ticker: string;
  benchmark: string;
  start: string;
  end: string;
  fundamentals: Fundamentals;
  summary: Summary;
  tail_days: TailDays;
  points: Point[];
}
