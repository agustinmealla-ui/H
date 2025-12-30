"""Pydantic Schemas - API Contracts"""
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime


# ==================== Chat ====================

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime | None = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: str | None = None
    conversation_history: list["ChatMessage"] | None = None
    include_context: bool = True


class StreamChunk(BaseModel):
    type: Literal["text", "citation", "done", "error"]
    content: str | None = None
    source: str | None = None
    section: str | None = None


class Citation(BaseModel):
    source: str
    section: str
    content: str | None = None


# ==================== Ticker ====================

class Fundamentals(BaseModel):
    market_cap: float | None = None
    pe_ratio: float | None = None
    dividend_yield: float | None = None
    week_52_high: float | None = None
    week_52_low: float | None = None
    avg_volume: float | None = None
    sector: str | None = None
    industry: str | None = None


class Metrics(BaseModel):
    ann_return: float
    ann_vol: float
    sharpe: float | None = None
    max_drawdown: float
    beta: float | None = None
    corr: float
    skewness: float
    kurtosis: float


class TailDay(BaseModel):
    date: str
    ret: float


class HistogramBin(BaseModel):
    range: str
    count: int


# ==================== SEC ====================

class FilingMetadata(BaseModel):
    filing_type: Literal["10-K", "10-Q", "8-K"]
    fiscal_year: int
    fiscal_quarter: int | None = None
    filing_date: str
    accession_number: str | None = None


class ContextInfo(BaseModel):
    ticker: str
    available_filings: list[FilingMetadata]
    company_info_available: bool
    last_updated: datetime
