import { MacroContextAgent } from "../subagents/macro/macro.agent";
import type { MacroContext, AnalysisRequest, AnalysisResult } from "@/lib/types/macro-context";

export class ChiefAgent {
  private macroAgent: MacroContextAgent;

  constructor(openaiApiKey: string, model: string = "gpt-4") {
    this.macroAgent = new MacroContextAgent(openaiApiKey, model);
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const result: AnalysisResult = {
      requestId,
      timestamp: new Date().toISOString(),
      errors: [],
    };

    const tasks: Promise<void>[] = [];

    // Macro context is always required for any scope
    if (["macro", "sector", "company", "full"].includes(request.scope)) {
      tasks.push(
        this.macroAgent
          .run()
          .then((ctx) => {
            result.macroContext = ctx;
          })
          .catch((err) => {
            result.errors.push({
              agent: "macro",
              error: err instanceof Error ? err.message : String(err),
            });
          })
      );
    }

    // Future: Add sector agent
    // if (["sector", "company", "full"].includes(request.scope)) {
    //   tasks.push(this.sectorAgent.run(request.ticker).then(...));
    // }

    // Future: Add company agent
    // if (["company", "full"].includes(request.scope)) {
    //   tasks.push(this.companyAgent.run(request.ticker).then(...));
    // }

    await Promise.all(tasks);

    return result;
  }
}

// Re-export types for convenience
export type { MacroContext, AnalysisRequest, AnalysisResult };
