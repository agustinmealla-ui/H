/**
 * Centralized API Client
 * Single source of truth for all API calls
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface TickerOverviewParams {
  start?: string;
  end?: string;
  benchmark?: string;
  vol_window?: number;
}

export const api = {
  /**
   * Get ticker overview with all analytics data
   */
  getTickerOverview: (ticker: string, params?: TickerOverviewParams) => {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    if (params?.benchmark) searchParams.set('benchmark', params.benchmark);
    if (params?.vol_window) searchParams.set('vol_window', params.vol_window.toString());

    const query = searchParams.toString();
    return fetchJson<any>(`/api/ticker/${ticker}/overview${query ? `?${query}` : ''}`);
  },

  /**
   * Get welcome message and suggested questions
   */
  getWelcome: (ticker: string) =>
    fetchJson<{
      welcome_message: string;
      suggested_questions: string[];
      ticker: string;
      company_name: string;
    }>(`/api/ticker/${ticker}/chat/welcome`),

  /**
   * Get context info for ticker
   */
  getContext: (ticker: string) =>
    fetchJson<any>(`/api/ticker/${ticker}/context`),

  /**
   * Stream chat response (returns fetch Response for SSE handling)
   */
  streamChat: async (
    ticker: string,
    message: string,
    signal?: AbortSignal
  ): Promise<Response> => {
    const res = await fetch(`${API_BASE}/api/ticker/${ticker}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, include_context: true }),
      signal,
    });

    if (!res.ok) {
      throw new ApiError(res.status, `Chat error: ${res.status}`);
    }

    return res;
  },
};

export { ApiError };
export default api;
