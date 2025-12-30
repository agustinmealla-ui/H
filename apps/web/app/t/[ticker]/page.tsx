"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { AnalystChat } from "./components/AnalystChat";
import { formatLargeNumber, formatVolume } from "@/lib/formatters";
import type { Point, Summary, TailDays, Fundamentals, HistogramBin } from "@/lib/types";

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "5Y", "MAX"] as const;
const BENCHMARKS = ["SPY", "QQQ", "^GSPC"] as const;

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-72 bg-gray-200 rounded"></div>
    </div>
  );
}

export default function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: tickerParam } = use(params);
  const ticker = tickerParam.toUpperCase();

  const [data, setData] = useState<Point[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tailDays, setTailDays] = useState<TailDays | null>(null);
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [histogram, setHistogram] = useState<HistogramBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<typeof RANGES[number]>("1Y");
  const [benchmark, setBenchmark] = useState<typeof BENCHMARKS[number]>("SPY");

  const startDate = useMemo(() => {
    if (range === "MAX") return "2000-01-01";
    const now = new Date();
    const monthsMap: Record<string, number> = { "1W": 0.25, "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "5Y": 60 };
    now.setMonth(now.getMonth() - (monthsMap[range] || 12));
    return now.toISOString().split("T")[0];
  }, [range]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const url = `http://localhost:8000/api/ticker/${ticker}/overview?start=${startDate}&benchmark=${benchmark}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (alive) {
          setData(json.points ?? []);
          setSummary(json.summary ?? null);
          setTailDays(json.tail_days ?? null);
          setFundamentals(json.fundamentals ?? null);
          setHistogram(json.histogram ?? []);
        }
      } catch (e: unknown) {
        if (alive) setErr(e instanceof Error ? e.message : "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ticker, startDate, benchmark]);

  const last = data[data.length - 1];
  const first = data[0];

  const priceChange = useMemo(() => {
    if (!last || !first) return { amount: 0, percent: 0 };
    const amount = last.price - first.price;
    const percent = (amount / first.price) * 100;
    return { amount, percent };
  }, [last, first]);

  if (loading) return <LoadingSkeleton />;
  if (err) return <div className="p-6">Error: {err}</div>;
  if (!data.length) return <div className="p-6">Sin datos.</div>;

  return (
    <div className="relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold">{ticker}</h1>
            <span className="text-2xl font-semibold">${last?.price?.toFixed(2)}</span>
            <span className={`text-sm font-medium ${priceChange.percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange.percent >= 0 ? '+' : ''}{priceChange.amount.toFixed(2)} ({priceChange.percent.toFixed(2)}%)
            </span>
            {fundamentals?.market_cap && (
              <span className="text-sm text-gray-500">• {formatLargeNumber(fundamentals.market_cap)}</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value as typeof BENCHMARKS[number])}
              className="px-2 py-1 text-xs border rounded bg-white"
            >
              {BENCHMARKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2 py-1 text-xs rounded ${range === r ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-6">
        {/* Analytics */}
        <div className="lg:w-[60%] space-y-6">
          {fundamentals?.sector && (
            <p className="text-xs text-gray-500">
              {fundamentals.sector} {fundamentals.industry && `• ${fundamentals.industry}`}
            </p>
          )}

          {/* Fundamentals Strip */}
          {fundamentals && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                  <div className="font-semibold">{formatLargeNumber(fundamentals.market_cap)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">P/E Ratio</div>
                  <div className="font-semibold">{fundamentals.pe_ratio?.toFixed(2) ?? "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Div Yield</div>
                  <div className="font-semibold">
                    {fundamentals.dividend_yield ? `${(fundamentals.dividend_yield * 100).toFixed(2)}%` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">52W High</div>
                  <div className="font-semibold">{fundamentals.week_52_high ? `$${fundamentals.week_52_high.toFixed(2)}` : "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">52W Low</div>
                  <div className="font-semibold">{fundamentals.week_52_low ? `$${fundamentals.week_52_low.toFixed(2)}` : "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Avg Volume</div>
                  <div className="font-semibold">{formatVolume(fundamentals.avg_volume)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Ann Return", value: `${(summary.ann_return * 100).toFixed(2)}%` },
                { label: "Ann Vol", value: `${(summary.ann_vol * 100).toFixed(2)}%` },
                { label: "Sharpe", value: summary.sharpe?.toFixed(2) ?? "N/A" },
                { label: "Max DD", value: `${(summary.max_drawdown * 100).toFixed(2)}%` },
                { label: "Beta", value: summary.beta?.toFixed(2) ?? "N/A" },
                { label: "Corr", value: summary.corr.toFixed(2) },
              ].map(({ label, value }) => (
                <div key={label} className="border rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Price Chart */}
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Precio Normalizado (vs {benchmark})</h2>
            <div className="h-72 border rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={40} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="price_norm" stroke="#2563eb" dot={false} strokeWidth={2} name={ticker} />
                  <Line type="monotone" dataKey="bench_price_norm" stroke="#ea580c" dot={false} strokeWidth={2} name={benchmark} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Cumulative Return Chart */}
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Retorno acumulado (base 1.0)</h2>
            <div className="h-72 border rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={40} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cumret" stroke="#2563eb" dot={false} strokeWidth={2} name={ticker} />
                  <Line type="monotone" dataKey="bench_cumret" stroke="#ea580c" dot={false} strokeWidth={2} name={benchmark} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Volatility Chart */}
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Volatilidad rolling 20d (anualizada)</h2>
            <div className="h-72 border rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={40} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="vol_20d" stroke="#2563eb" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Distribution Chart */}
          <section className="space-y-2">
            <div className="flex items-baseline gap-4">
              <h2 className="text-lg font-medium">Distribución de Retornos Diarios</h2>
              {summary && (
                <div className="text-sm text-gray-600">
                  Skew: {summary.skewness.toFixed(2)} | Kurtosis: {summary.kurtosis.toFixed(2)}
                </div>
              )}
            </div>
            <div className="h-72 border rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Tail Days */}
          {tailDays && (
            <section className="space-y-4">
              <h2 className="text-lg font-medium">Mejores y Peores Días</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-green-700">Top 10 Mejores Días</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Fecha</th>
                          <th className="px-4 py-2 text-right">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tailDays.best.map((day, idx) => (
                          <tr key={day.date} className="border-t">
                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2">{day.date}</td>
                            <td className="px-4 py-2 text-right font-semibold text-green-600">
                              +{(day.ret * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-red-700">Top 10 Peores Días</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Fecha</th>
                          <th className="px-4 py-2 text-right">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tailDays.worst.map((day, idx) => (
                          <tr key={day.date} className="border-t">
                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-4 py-2">{day.date}</td>
                            <td className="px-4 py-2 text-right font-semibold text-red-600">
                              {(day.ret * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* AI Chat */}
        <div className="lg:w-[40%] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <AnalystChat ticker={ticker} />
        </div>
      </div>
    </div>
  );
}
