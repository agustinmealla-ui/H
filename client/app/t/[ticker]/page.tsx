"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChartContainer, ComparativeChart } from "@/components/charts";
import type { MacroContext, AnalysisResult } from "@/lib/types/macro-context";

export default function TickerPage() {
  const params = useParams();
  const ticker = params.ticker as string;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, scope: "macro" }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {ticker.toUpperCase()} - Macro Context
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            US Macroeconomic environment analysis
          </p>
        </header>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700
                     disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100
                     dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Run Macro Analysis"
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/30 dark:text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            <div className="text-sm text-zinc-500 dark:text-zinc-500">
              Request: {result.requestId} |{" "}
              {new Date(result.timestamp).toLocaleString()}
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Warnings
                </h3>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-yellow-700 dark:text-yellow-300">
                    [{e.agent}] {e.error}
                  </p>
                ))}
              </div>
            )}

            {result.macroContext && (
              <MacroContextDisplay context={result.macroContext} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MacroContextDisplay({ context }: { context: MacroContext }) {
  const { summary, indicators, dataQuality } = context;

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
          Economic Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <SummaryItem label="Economic Cycle" value={summary.economicCycle} />
          <SummaryItem label="Inflation" value={summary.inflationEnvironment} />
          <SummaryItem label="Labor Market" value={summary.laborMarket} />
          <SummaryItem label="Monetary Policy" value={summary.monetaryPolicy} />
        </div>
        <p className="text-zinc-700 dark:text-zinc-300 mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded">
          {summary.overallAssessment}
        </p>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <IndicatorCard
          title="GDP"
          data={indicators.gdp}
          prefix="$"
          suffix="B"
        />
        <IndicatorCard
          title="GDP Growth"
          data={indicators.gdpGrowth}
          suffix="%"
        />
        <IndicatorCard title="Inflation (CPI)" data={indicators.inflation} />
        <IndicatorCard
          title="Unemployment"
          data={indicators.unemployment}
          suffix="%"
        />
        <IndicatorCard
          title="Fed Funds Rate"
          data={indicators.fedFundsRate}
          suffix="%"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Historical Data
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            data={indicators.gdp.historicalData}
            title="GDP (Billions USD)"
            color="#3b82f6"
            formatValue={(v) => `$${v.toLocaleString()}B`}
          />
          <ChartContainer
            data={indicators.gdpGrowth.historicalData}
            title="GDP Growth Rate (%)"
            color="#10b981"
            formatValue={(v) => `${v.toFixed(2)}%`}
            defaultType="bar"
          />
          <ChartContainer
            data={indicators.inflation.historicalData}
            title="Consumer Price Index"
            color="#f59e0b"
          />
          <ChartContainer
            data={indicators.unemployment.historicalData}
            title="Unemployment Rate (%)"
            color="#ef4444"
            formatValue={(v) => `${v.toFixed(1)}%`}
          />
          <ChartContainer
            data={indicators.fedFundsRate.historicalData}
            title="Federal Funds Rate (%)"
            color="#8b5cf6"
            formatValue={(v) => `${v.toFixed(2)}%`}
          />
        </div>

        {/* Comparative Chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow">
          <ComparativeChart
            title="Unemployment vs Fed Funds Rate"
            series={[
              {
                name: "Unemployment",
                data: indicators.unemployment.historicalData,
                color: "#ef4444",
                yAxisId: "left",
              },
              {
                name: "Fed Funds",
                data: indicators.fedFundsRate.historicalData,
                color: "#8b5cf6",
                yAxisId: "right",
              },
            ]}
            leftAxisLabel="Unemployment %"
            rightAxisLabel="Fed Funds %"
          />
        </div>
      </div>

      {/* Data Quality */}
      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm">
        <h3 className="font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Data Quality
        </h3>
        <div className="flex gap-6 text-zinc-600 dark:text-zinc-400">
          <span>Completeness: {(dataQuality.completeness * 100).toFixed(0)}%</span>
          <span>Staleness: {dataQuality.staleness} days</span>
        </div>
        {dataQuality.issues.length > 0 && (
          <ul className="mt-2 text-yellow-600 dark:text-yellow-400">
            {dataQuality.issues.map((issue, i) => (
              <li key={i}>- {issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  const colorMap: Record<string, string> = {
    expansion: "text-green-600 dark:text-green-400",
    peak: "text-yellow-600 dark:text-yellow-400",
    contraction: "text-red-600 dark:text-red-400",
    trough: "text-orange-600 dark:text-orange-400",
    low: "text-green-600 dark:text-green-400",
    moderate: "text-yellow-600 dark:text-yellow-400",
    high: "text-red-600 dark:text-red-400",
    tight: "text-red-600 dark:text-red-400",
    stable: "text-green-600 dark:text-green-400",
    restrictive: "text-red-600 dark:text-red-400",
    accommodative: "text-green-600 dark:text-green-400",
    neutral: "text-zinc-600 dark:text-zinc-400",
  };

  return (
    <div>
      <span className="text-xs text-zinc-500 uppercase tracking-wide">
        {label}
      </span>
      <p
        className={`font-semibold capitalize ${colorMap[value] || "text-zinc-900 dark:text-zinc-50"}`}
      >
        {value.replace(/_/g, " ")}
      </p>
    </div>
  );
}

function IndicatorCard({
  title,
  data,
  prefix = "",
  suffix = "",
}: {
  title: string;
  data: {
    latestValue: number;
    latestDate: string;
    changePercent: number;
    trend: string;
  };
  prefix?: string;
  suffix?: string;
}) {
  const trendConfig = {
    rising: { color: "text-green-600 dark:text-green-400", icon: "↑" },
    falling: { color: "text-red-600 dark:text-red-400", icon: "↓" },
    stable: { color: "text-zinc-600 dark:text-zinc-400", icon: "→" },
  };

  const trend = trendConfig[data.trend as keyof typeof trendConfig] || trendConfig.stable;

  return (
    <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg shadow">
      <h3 className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
        {title}
      </h3>
      <p className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-50">
        {prefix}
        {data.latestValue.toLocaleString()}
        {suffix}
      </p>
      <p className={`text-sm mt-1 ${trend.color}`}>
        {trend.icon} {data.changePercent >= 0 ? "+" : ""}
        {data.changePercent.toFixed(2)}%
      </p>
      <p className="text-xs text-zinc-500 mt-1">as of {data.latestDate}</p>
    </div>
  );
}
