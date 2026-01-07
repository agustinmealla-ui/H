"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Series {
  name: string;
  data: Array<{ date: string; value: number }>;
  color: string;
  yAxisId?: "left" | "right";
}

interface ComparativeChartProps {
  series: Series[];
  title: string;
  leftAxisLabel?: string;
  rightAxisLabel?: string;
}

export function ComparativeChart({
  series,
  title,
  leftAxisLabel,
  rightAxisLabel,
}: ComparativeChartProps) {
  // Merge all series data by date
  const allDates = new Set<string>();
  series.forEach((s) => s.data.forEach((d) => allDates.add(d.date)));

  const sortedDates = Array.from(allDates).sort();
  const mergedData = sortedDates.map((date) => {
    const point: Record<string, string | number> = {
      date,
      displayDate: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    };
    series.forEach((s) => {
      const found = s.data.find((d) => d.date === date);
      point[s.name] = found?.value ?? 0;
    });
    return point;
  });

  const hasRightAxis = series.some((s) => s.yAxisId === "right");

  return (
    <div className="w-full h-[350px]">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: hasRightAxis ? 60 : 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={
              leftAxisLabel
                ? {
                    value: leftAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }
                : undefined
            }
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={
                rightAxisLabel
                  ? {
                      value: rightAxisLabel,
                      angle: 90,
                      position: "insideRight",
                      style: { fontSize: 12 },
                    }
                  : undefined
              }
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fafafa" }}
          />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={2}
              yAxisId={s.yAxisId || "left"}
              dot={{ fill: s.color, strokeWidth: 2, r: 2 }}
              activeDot={{ r: 4, stroke: s.color, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
