export interface MacroIndicatorData {
  seriesId: string;
  name: string;
  latestValue: number;
  latestDate: string;
  previousValue: number;
  previousDate: string;
  change: number;
  changePercent: number;
  trend: "rising" | "falling" | "stable";
  historicalData: Array<{
    date: string;
    value: number;
  }>;
}

export interface MacroContext {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  indicators: {
    gdp: MacroIndicatorData;
    gdpGrowth: MacroIndicatorData;
    inflation: MacroIndicatorData;
    unemployment: MacroIndicatorData;
    fedFundsRate: MacroIndicatorData;
  };
  summary: {
    economicCycle: "expansion" | "peak" | "contraction" | "trough";
    inflationEnvironment: "deflationary" | "low" | "moderate" | "high" | "hyperinflation";
    laborMarket: "weak" | "softening" | "stable" | "tightening" | "tight";
    monetaryPolicy: "very_accommodative" | "accommodative" | "neutral" | "restrictive" | "very_restrictive";
    overallAssessment: string;
  };
  dataQuality: {
    completeness: number;
    staleness: number;
    issues: string[];
  };
}

export interface AnalysisRequest {
  ticker?: string;
  scope: "macro" | "sector" | "company" | "full";
}

export interface AnalysisResult {
  requestId: string;
  timestamp: string;
  macroContext?: MacroContext;
  errors: Array<{
    agent: string;
    error: string;
  }>;
}
