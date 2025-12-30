"""Financial Metrics - Pure calculations"""
import numpy as np
import pandas as pd
from scipy import stats
from dataclasses import dataclass


@dataclass
class MetricsResult:
    ann_return: float
    ann_vol: float
    sharpe: float | None
    max_drawdown: float
    beta: float | None
    corr: float
    skewness: float
    kurtosis: float


def calculate_returns(prices: pd.Series) -> pd.Series:
    """Daily returns from prices."""
    return prices.pct_change().dropna()


def calculate_cumulative_returns(returns: pd.Series) -> pd.Series:
    """Cumulative returns (starts at 1.0)."""
    return (1 + returns).cumprod()


def calculate_volatility_rolling(returns: pd.Series, window: int = 20) -> pd.Series:
    """Rolling annualized volatility."""
    return returns.rolling(window).std() * np.sqrt(252)


def calculate_max_drawdown(cumret: pd.Series) -> float:
    """Maximum drawdown."""
    rolling_max = cumret.cummax()
    drawdown = (cumret / rolling_max) - 1
    return float(drawdown.min())


def calculate_beta(returns: pd.Series, bench: pd.Series) -> float | None:
    """Beta vs benchmark."""
    if len(returns) < 2:
        return None
    aligned = pd.concat([returns, bench], axis=1).dropna()
    if len(aligned) < 2:
        return None
    cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0, 1]
    var = np.var(aligned.iloc[:, 1])
    return float(cov / var) if var > 0 else None


def _safe_float(val: float, default: float = 0.0) -> float:
    """Convert to float, replacing NaN/Inf with default."""
    if np.isnan(val) or np.isinf(val):
        return default
    return float(val)


def calculate_all(returns: pd.Series, bench: pd.Series) -> MetricsResult:
    """Calculate all metrics."""
    if len(returns) < 2:
        return MetricsResult(0, 0, None, 0, None, 0, 0, 0)

    ann_ret = _safe_float((1 + returns.mean()) ** 252 - 1)
    ann_vol = _safe_float(returns.std() * np.sqrt(252))
    cumret = calculate_cumulative_returns(returns)
    aligned = pd.concat([returns, bench], axis=1).dropna()

    # Safe correlation
    corr = 0.0
    if len(aligned) > 1:
        corr_val = np.corrcoef(aligned.iloc[:, 0], aligned.iloc[:, 1])[0, 1]
        corr = _safe_float(corr_val)

    # Safe skew/kurtosis (need at least 8 samples)
    clean_returns = returns.dropna()
    skew = _safe_float(stats.skew(clean_returns)) if len(clean_returns) >= 8 else 0.0
    kurt = _safe_float(stats.kurtosis(clean_returns)) if len(clean_returns) >= 8 else 0.0

    return MetricsResult(
        ann_return=ann_ret,
        ann_vol=ann_vol,
        sharpe=ann_ret / ann_vol if ann_vol > 0 else None,
        max_drawdown=_safe_float(calculate_max_drawdown(cumret)),
        beta=calculate_beta(returns, bench),
        corr=corr,
        skewness=skew,
        kurtosis=kurt,
    )


def calculate_histogram(returns: pd.Series, bins: int = 30) -> list[dict]:
    """Histogram bins."""
    returns = returns.dropna()
    if len(returns) == 0:
        return []
    counts, edges = np.histogram(returns, bins=bins)
    return [{"range": f"{edges[i]*100:.1f}", "count": int(counts[i])} for i in range(len(counts))]


def get_tail_days(returns: pd.Series, n: int = 10) -> dict:
    """Best/worst N days."""
    if len(returns) == 0:
        return {"best": [], "worst": []}

    df = pd.DataFrame({"ret": returns}).sort_values("ret", ascending=False)

    def fmt(idx, row):
        date = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
        return {"date": date, "ret": float(row["ret"])}

    return {
        "best": [fmt(i, r) for i, r in df.head(n).iterrows()],
        "worst": [fmt(i, r) for i, r in df.tail(n).iloc[::-1].iterrows()],
    }


def normalize_prices(prices: pd.Series) -> pd.Series:
    """Normalize to start at 1.0."""
    if len(prices) == 0:
        return prices
    return prices / prices.iloc[0]
