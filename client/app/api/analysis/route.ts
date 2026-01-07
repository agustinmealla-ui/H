import { NextRequest, NextResponse } from "next/server";
import { ChiefAgent } from "@/lib/agents/chief/chief.agent";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4";

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { ticker, scope = "macro" } = body;

    const validScopes = ["macro", "sector", "company", "full"];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${validScopes.join(", ")}` },
        { status: 400 }
      );
    }

    const chief = new ChiefAgent(OPENAI_API_KEY, OPENAI_MODEL);
    const result = await chief.analyze({ ticker, scope });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "1.0.0",
    agents: ["macro"],
    config: {
      model: OPENAI_MODEL,
      hasApiKey: !!OPENAI_API_KEY,
    },
  });
}
