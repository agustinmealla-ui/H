# Changelog

## [2.0.0] - 2025-12-30

### Architecture Refactor (Elon Plan)

Major refactoring following "Delete → Simplify → Automate → Optimize" philosophy.

#### Added
- `Server/api/models/schemas.py` - Unified Pydantic schemas (single source of truth)
- `Server/api/providers/` - Provider pattern for external data sources
  - `base.py` - Protocol/interface definition
  - `yfinance_provider.py` - YFinance implementation with disk caching
- `Server/api/services/metrics.py` - Centralized financial calculations
- `apps/web/lib/api.ts` - Centralized API client
- `apps/web/lib/formatters.ts` - Display formatting utilities
- Histogram data now computed in backend (was client-side)

#### Changed
- `main.py`: Reduced from 250 to 200 LOC using providers/metrics
- `page.tsx`: Reduced from 548 to 331 LOC, uses centralized types/formatters
- `sec_filings.py`: Uses provider instead of direct yfinance calls
- `prompts.py`: Cleaned up unused Dexter-pattern prompts (70 LOC removed)
- `agents/__init__.py`: Removed exports of unused functions

#### Removed
- `models/agent_models.py` - Merged into `schemas.py`
- `page.tsx.backup` - Use git for backups
- Dead code: `get_understanding_prompt`, `get_reflection_prompt`, `get_context_selection_prompt`
- Inline type definitions in `page.tsx` (use `lib/types.ts`)
- Inline formatters in `page.tsx` (use `lib/formatters.ts`)
- Old docs/ structure (replaced with 3 clean docs)

#### Metrics
- Backend LOC: ~2,055 → ~1,700 (-17%)
- Frontend LOC: ~879 → ~650 (-26%)
- Total reduction: ~20%
- yfinance calls: 2 per request → 1 (cached)
- Type definitions: 3 places → 1 source of truth

---

## [1.0.0] - 2025-12-30

### Initial MVP Release

#### Features
- Ticker analytics page (`/t/[ticker]`)
- Normalized price comparison vs benchmark
- Cumulative return chart
- Rolling 20-day volatility chart
- Return distribution histogram with skew/kurtosis
- Best/worst trading days tables
- AI Equity Analyst chat with SEC filing context
- SEC 10-K/10-Q parsing from EDGAR
- Market data from yfinance

#### Tech Stack
- Backend: FastAPI, Python 3.11, Pydantic, OpenAI, yfinance
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts
- Data: SEC EDGAR API, Yahoo Finance

#### Endpoints
- `GET /api/ticker/{ticker}/overview` - Complete analytics
- `POST /api/ticker/{ticker}/chat/stream` - AI chat (SSE)
- `GET /api/ticker/{ticker}/chat/welcome` - Welcome message
- `GET /api/ticker/{ticker}/context` - Filing metadata
