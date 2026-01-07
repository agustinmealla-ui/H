import OpenAI from "openai";
import { mcpClient } from "@/lib/mcp/client";
import { MACRO_INDICATORS } from "@/lib/config/indicators";
import type { MacroContext } from "@/lib/types/macro-context";

const SYSTEM_PROMPT = `You are a macroeconomic analyst agent. Your role is to:

1. Analyze US macroeconomic indicators (GDP, inflation, unemployment, interest rates)
2. Provide objective, data-driven assessments of current economic conditions
3. Structure your output as JSON following the exact schema provided

CONSTRAINTS:
- Focus ONLY on US macro-level analysis
- NO sector-specific or company-specific analysis
- NO investment recommendations or advice
- Use ONLY the data provided from FRED tools
- Be precise with numbers and dates

When analyzing indicators:
- Calculate trends based on recent data points (rising if latest > previous, falling if latest < previous, stable if change < 0.5%)
- Assess economic cycle position based on multiple indicators
- Provide a brief, factual overall assessment

OUTPUT SCHEMA (MacroContext):
{
  "timestamp": "ISO date string",
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "indicators": {
    "gdp": { "seriesId": "string", "name": "string", "latestValue": number, "latestDate": "string", "previousValue": number, "previousDate": "string", "change": number, "changePercent": number, "trend": "rising|falling|stable", "historicalData": [{"date": "string", "value": number}] },
    "gdpGrowth": { ... same structure ... },
    "inflation": { ... same structure ... },
    "unemployment": { ... same structure ... },
    "fedFundsRate": { ... same structure ... }
  },
  "summary": {
    "economicCycle": "expansion|peak|contraction|trough",
    "inflationEnvironment": "deflationary|low|moderate|high|hyperinflation",
    "laborMarket": "weak|softening|stable|tightening|tight",
    "monetaryPolicy": "very_accommodative|accommodative|neutral|restrictive|very_restrictive",
    "overallAssessment": "1-2 sentence objective summary"
  },
  "dataQuality": {
    "completeness": 0-1,
    "staleness": number (days since last update),
    "issues": ["string"]
  }
}`;

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_fred_observations",
      description:
        "Get historical observations for a FRED economic series. Returns time-series data with dates and values.",
      parameters: {
        type: "object",
        properties: {
          series_id: {
            type: "string",
            description: "FRED series ID (e.g., GDP, UNRATE, CPIAUCSL, FEDFUNDS)",
          },
          limit: {
            type: "number",
            description: "Maximum number of observations to return (default 12)",
          },
        },
        required: ["series_id"],
      },
    },
  },
];

export class MacroContextAgent {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4") {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async run(): Promise<MacroContext> {
    const indicatorsList = Object.entries(MACRO_INDICATORS)
      .map(([key, val]) => `- ${val.name} (${key}): ${val.seriesId}`)
      .join("\n");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze the current US macroeconomic environment using these FRED series:

${indicatorsList}

For each indicator:
1. Call get_fred_observations with the series_id to fetch the last 12 data points
2. Calculate the trend and changes between the two most recent values
3. After gathering ALL data for ALL indicators, produce the final macro_context JSON

IMPORTANT:
- Fetch data for ALL 5 indicators before producing the final output
- Return ONLY the JSON object, no markdown or explanation
- Ensure all numerical values are actual numbers, not strings`,
      },
    ];

    let iterations = 0;
    const maxIterations = 15;

    while (iterations < maxIterations) {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: TOOLS,
        tool_choice: iterations < 5 ? "auto" : "auto",
      });

      const message = response.choices[0].message;
      messages.push(message);

      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await this.executeTool(toolCall.function.name, args);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        iterations++;
        continue;
      }

      if (message.content) {
        try {
          const jsonMatch = message.content.match(/```json\n?([\s\S]*?)\n?```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : message.content;
          const cleaned = jsonStr.trim();
          return JSON.parse(cleaned) as MacroContext;
        } catch (e) {
          if (iterations < maxIterations - 1) {
            messages.push({
              role: "user",
              content:
                "The JSON was invalid. Please return ONLY a valid JSON object matching the MacroContext schema, with no markdown formatting.",
            });
            iterations++;
            continue;
          }
          throw new Error(
            `Failed to parse MacroContext from agent response: ${e}`
          );
        }
      }

      iterations++;
    }

    throw new Error("Max iterations reached without producing result");
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (name) {
      case "get_fred_observations":
        return mcpClient.getObservations(args.series_id as string, {
          limit: (args.limit as number) ?? 12,
        });
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
