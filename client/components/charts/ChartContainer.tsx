"use client";

import { useState } from "react";
import { LineChart } from "./LineChart";
import { AreaChart } from "./AreaChart";
import { BarChart } from "./BarChart";

type ChartType = "line" | "area" | "bar";

interface DataPoint {
  date: string;
  value: number;
}

interface ChartContainerProps {
  data: DataPoint[];
  title: string;
  color?: string;
  yAxisLabel?: string;
  formatValue?: (value: number) => string;
  defaultType?: ChartType;
  allowTypeChange?: boolean;
}

export function ChartContainer({
  data,
  title,
  color = "#3b82f6",
  yAxisLabel,
  formatValue,
  defaultType = "line",
  allowTypeChange = true,
}: ChartContainerProps) {
  const [chartType, setChartType] = useState<ChartType>(defaultType);

  const chartProps = {
    data,
    title,
    color,
    yAxisLabel,
    formatValue,
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow">
      {allowTypeChange && (
        <div className="flex justify-end mb-2 space-x-1">
          <button
            onClick={() => setChartType("line")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "line"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("area")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "area"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-2 py-1 text-xs rounded ${
              chartType === "bar"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Bar
          </button>
        </div>
      )}

      {chartType === "line" && <LineChart {...chartProps} />}
      {chartType === "area" && (
        <AreaChart {...chartProps} gradientId={`gradient-${title.replace(/\s/g, "-")}`} />
      )}
      {chartType === "bar" && <BarChart {...chartProps} />}

      <div className="flex justify-end mt-2">
        <button
          onClick={() => {
            const csvContent = [
              "Date,Value",
              ...data.map((d) => `${d.date},${d.value}`),
            ].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${title.replace(/\s/g, "_")}_data.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
