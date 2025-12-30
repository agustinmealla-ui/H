# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                 apps/web (Next.js)                      ││
│  │                                                          ││
│  │   app/t/[ticker]/page.tsx ──► fetch() ──► Backend       ││
│  │   lib/types.ts, lib/formatters.ts, lib/api.ts          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP/SSE
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Server/ (FastAPI)                      ││
│  │                                                          ││
│  │   app.py ─────────────────────────────────────────────► ││
│  │       │                                                  ││
│  │       ├── routes/ticker.py   (analytics endpoints)      ││
│  │       └── routes/chat.py     (AI chat endpoints)        ││
│  │                │                                         ││
│  │                ▼                                         ││
│  │   ┌─────────────────────────────────────────────────┐   ││
│  │   │  services/                                       │   ││
│  │   │    market.py  (yfinance + cache)                │   ││
│  │   │    metrics.py (pure calculations)               │   ││
│  │   │    sec.py     (SEC EDGAR metadata)              │   ││
│  │   └─────────────────────────────────────────────────┘   ││
│  │                │                                         ││
│  │                ▼                                         ││
│  │   agent/analyst.py (OpenAI streaming)                   ││
│  │                                                          ││
│  │   config.py, schemas.py (shared)                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│   Yahoo Finance ──► Prices, fundamentals                    │
│   SEC EDGAR ──► Filing metadata                             │
│   OpenAI ──► Chat completions                               │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
Server/
├── app.py              # FastAPI entry point
├── config.py           # Settings (env vars)
├── schemas.py          # Pydantic models
├── routes/
│   ├── ticker.py       # GET /api/ticker/{ticker}/overview
│   └── chat.py         # POST /api/ticker/{ticker}/chat/stream
├── services/
│   ├── market.py       # YFinance with disk cache
│   ├── metrics.py      # Financial calculations
│   └── sec.py          # SEC EDGAR client
├── agent/
│   └── analyst.py      # AI equity analyst
└── data/               # Disk cache storage
```

## Design Principles

1. **Flat structure** - No deep nesting, max 2 levels
2. **Single file per concern** - One service, one file
3. **Pure calculations** - metrics.py has no I/O
4. **Cache at service layer** - diskcache in market.py
5. **Streaming by default** - SSE for chat responses

## Data Flow

### Analytics Request

```
GET /api/ticker/AAPL/overview

1. routes/ticker.py receives request
2. services/market.py fetches prices (cached 5min)
3. services/metrics.py calculates returns, volatility, etc.
4. Response: { fundamentals, summary, points, histogram, tail_days }
```

### Chat Request

```
POST /api/ticker/AAPL/chat/stream

1. routes/chat.py receives message
2. services/sec.py gets company context
3. agent/analyst.py streams OpenAI response
4. SSE chunks: { type: "text"|"done"|"error", content }
```

## Caching

| Data | TTL | Location |
|------|-----|----------|
| Company info | 1 hour | data/market/ |
| Price history | 5 min | data/market/ |

## File Count

| Component | Files | ~LOC |
|-----------|-------|------|
| Server/ | 10 | 600 |
| apps/web/ | 8 | 400 |
| **Total** | **18** | **~1,000** |
