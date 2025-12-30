# Stock Analysis Platform

AI-powered stock analysis platform with equity research agent and financial analytics.

## Quick Start

### Backend (FastAPI)

```bash
cd Server/api
pip install -e .
uvicorn app:app --reload
```

API runs at `http://localhost:8000`

### Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

App runs at `http://localhost:3000`

## Features

- **Ticker Analytics**: Price charts, returns, volatility, metrics (Sharpe, Beta, etc.)
- **AI Equity Analyst**: Chat with AI about any stock using SEC filings
- **SEC Filings**: Automatic parsing of 10-K/10-Q filings from EDGAR
- **Real-time Data**: Market data via yfinance with intelligent caching

## Usage

Navigate to `/t/AAPL` (or any ticker) to see:
- Normalized price vs benchmark (SPY, QQQ)
- Cumulative returns comparison
- Rolling 20-day volatility
- Return distribution histogram
- Best/worst trading days
- AI chat for fundamental analysis

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=sk-...
EDGAR_USER_AGENT=YourApp/1.0 (your@email.com)
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ticker/{ticker}/overview` | GET | Complete analytics data |
| `/api/ticker/{ticker}/chat/stream` | POST | AI chat (SSE) |
| `/api/ticker/{ticker}/chat/welcome` | GET | Welcome message |
| `/api/ticker/{ticker}/context` | GET | Available filings info |

## Tech Stack

- **Backend**: FastAPI, Python 3.11+, Pydantic, OpenAI, yfinance
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind, Recharts
- **Data**: SEC EDGAR API, Yahoo Finance

## Project Structure

```
├── Server/api/          # Backend
│   ├── main.py          # FastAPI endpoints
│   ├── models/          # Pydantic schemas
│   ├── services/        # Business logic
│   ├── providers/       # External data sources
│   └── agents/          # AI agent
│
├── apps/web/            # Frontend
│   ├── app/t/[ticker]/  # Ticker page
│   ├── hooks/           # React hooks
│   └── lib/             # Utils, types, API client
│
└── docs/                # Documentation
```

## License

MIT
