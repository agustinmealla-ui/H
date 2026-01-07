interface MCPResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ToolCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

interface FREDObservation {
  date: string;
  value: string;
}

interface FREDObservationsResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: FREDObservation[];
}

interface FREDSeries {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  notes: string;
}

interface FREDSearchResponse {
  realtime_start: string;
  realtime_end: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  seriess: FREDSeries[];
}

export class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = "http://localhost:8000") {
    this.baseUrl = baseUrl;
  }

  private async parseResponse<T>(response: Response): Promise<MCPResponse<T>> {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      // Parse SSE response
      const text = await response.text();
      const lines = text.split("\n");
      let jsonData: MCPResponse<T> | null = null;

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              jsonData = JSON.parse(data);
            } catch {
              // Continue parsing, might be partial data
            }
          }
        }
      }

      if (!jsonData) {
        throw new Error("No valid JSON found in SSE response");
      }
      return jsonData;
    }

    // Regular JSON response
    return response.json();
  }

  async initialize(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mcp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "nextjs-macro-agent", version: "1.0.0" },
        },
      }),
    });

    this.sessionId = response.headers.get("mcp-session-id");

    // Parse the response to check for errors
    await this.parseResponse(response);
  }

  async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<T> {
    if (!this.sessionId) {
      await this.initialize();
    }

    const response = await fetch(`${this.baseUrl}/mcp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(this.sessionId && { "mcp-session-id": this.sessionId }),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args },
      }),
    });

    const data = await this.parseResponse<ToolCallResult>(response);

    if (data.error) {
      throw new Error(data.error.message);
    }

    const textContent = data.result?.content.find((c) => c.type === "text");
    return textContent ? JSON.parse(textContent.text) : null;
  }

  async searchSeries(
    searchText: string,
    options?: {
      limit?: number;
      searchType?: "full_text" | "series_id";
    }
  ): Promise<FREDSearchResponse> {
    return this.callTool<FREDSearchResponse>("fred_search_series", {
      search_text: searchText,
      limit: options?.limit ?? 10,
      search_type: options?.searchType ?? "full_text",
    });
  }

  async getObservations(
    seriesId: string,
    options?: {
      observationStart?: string;
      observationEnd?: string;
      limit?: number;
      units?: string;
    }
  ): Promise<FREDObservationsResponse> {
    return this.callTool<FREDObservationsResponse>("fred_get_observations", {
      series_id: seriesId,
      observation_start: options?.observationStart,
      observation_end: options?.observationEnd,
      limit: options?.limit ?? 100,
      units: options?.units ?? "lin",
    });
  }
}

export const mcpClient = new MCPClient(
  process.env.MCP_SERVER_URL || "http://localhost:8000"
);
