"""Ticker Analytics Routes"""
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from services.market import market_service
from services.metrics import (
    calculate_returns,
    calculate_cumulative_returns,
    calculate_volatility_rolling,
    calculate_all,
    calculate_histogram,
    get_tail_days,
    normalize_prices,
)

router = APIRouter(prefix="/api/ticker", tags=["ticker"])


@router.get("/{ticker}/overview")
def get_overview(
    ticker: str,
    start: str = Query("2020-01-01"),
    end: str = Query("2025-12-30"),
    benchmark: str = Query("SPY"),
    vol_window: int = Query(20, ge=5, le=120),
):
    """Get complete ticker analytics."""
    ticker = ticker.upper().strip()
    benchmark = benchmark.upper().strip()

    # Fetch data (cached)
    info = market_service.get_company_info(ticker)
    px = market_service.get_prices(ticker, start, end)
    bx = market_service.get_prices(benchmark, start, end)

    if px.empty:
        raise HTTPException(404, f"No data for {ticker}")
    if bx.empty:
        raise HTTPException(404, f"No data for {benchmark}")

    # Align series
    df = pd.concat([px, bx], axis=1, join="inner")
    df.columns = ["price", "bench_price"]
    if df.empty:
        raise HTTPException(404, "No overlapping dates")

    # Calculate
    df["ret"] = calculate_returns(df["price"])
    df["bench_ret"] = calculate_returns(df["bench_price"])
    df["cumret"] = calculate_cumulative_returns(df["ret"])
    df["bench_cumret"] = calculate_cumulative_returns(df["bench_ret"])
    df["vol_20d"] = calculate_volatility_rolling(df["ret"], window=vol_window)
    df["price_norm"] = normalize_prices(df["price"])
    df["bench_price_norm"] = normalize_prices(df["bench_price"])
    df = df.dropna()

    metrics = calculate_all(df["ret"], df["bench_ret"])
    tail_days = get_tail_days(df["ret"], n=10)
    histogram = calculate_histogram(df["ret"], bins=30)

    points = [
        {
            "date": idx.strftime("%Y-%m-%d"),
            "price": float(row["price"]),
            "ret": float(row["ret"]),
            "cumret": float(row["cumret"]),
            "vol_20d": float(row["vol_20d"]),
            "bench_price": float(row["bench_price"]),
            "bench_cumret": float(row["bench_cumret"]),
            "price_norm": float(row["price_norm"]),
            "bench_price_norm": float(row["bench_price_norm"]),
        }
        for idx, row in df.iterrows()
    ]

    return {
        "ticker": ticker,
        "benchmark": benchmark,
        "start": start,
        "end": end,
        "fundamentals": {
            "market_cap": info.get("market_cap"),
            "pe_ratio": info.get("pe_ratio"),
            "dividend_yield": info.get("dividend_yield"),
            "week_52_high": info.get("week_52_high"),
            "week_52_low": info.get("week_52_low"),
            "avg_volume": info.get("avg_volume"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        },
        "summary": {
            "ann_return": metrics.ann_return,
            "ann_vol": metrics.ann_vol,
            "sharpe": metrics.sharpe,
            "max_drawdown": metrics.max_drawdown,
            "beta": metrics.beta,
            "corr": metrics.corr,
            "skewness": metrics.skewness,
            "kurtosis": metrics.kurtosis,
        },
        "tail_days": tail_days,
        "histogram": histogram,
        "points": points,
    }
