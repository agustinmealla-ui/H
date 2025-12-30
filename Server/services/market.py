"""Market Data Service - YFinance with caching"""
import yfinance as yf
import pandas as pd
from diskcache import Cache
from pathlib import Path
from typing import Any

from config import settings


class MarketService:
    """Market data via yfinance with disk cache."""

    def __init__(self):
        cache_path = settings.CACHE_DIR / "market"
        cache_path.mkdir(parents=True, exist_ok=True)
        self.cache = Cache(str(cache_path))
        self.ttl = {"info": 3600, "prices": 300}  # 1hr, 5min

    def get_company_info(self, ticker: str) -> dict[str, Any]:
        """Get company info (cached 1hr)."""
        ticker = ticker.upper()
        key = f"info:{ticker}"

        cached = self.cache.get(key)
        if cached:
            return cached

        try:
            info = yf.Ticker(ticker).info
            result = {
                "name": info.get("longName") or info.get("shortName", ticker),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
                "dividend_yield": info.get("dividendYield"),
                "week_52_high": info.get("fiftyTwoWeekHigh"),
                "week_52_low": info.get("fiftyTwoWeekLow"),
                "avg_volume": info.get("averageVolume"),
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "description": info.get("longBusinessSummary", ""),
            }
            self.cache.set(key, result, expire=self.ttl["info"])
            return result
        except Exception as e:
            return {"name": ticker, "error": str(e)}

    def get_prices(self, ticker: str, start: str, end: str) -> pd.Series:
        """Get adjusted close prices (cached 5min)."""
        ticker = ticker.upper()
        key = f"prices:{ticker}:{start}:{end}"

        cached = self.cache.get(key)
        if cached is not None:
            return cached

        try:
            df = yf.download(ticker, start=start, end=end, progress=False)
            if df is None or df.empty:
                return pd.Series(dtype=float)

            col = "Adj Close" if "Adj Close" in df.columns else "Close"
            series = df[col].dropna()
            series.name = ticker
            self.cache.set(key, series, expire=self.ttl["prices"])
            return series
        except Exception:
            return pd.Series(dtype=float)


market_service = MarketService()
