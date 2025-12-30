"""Chat Routes"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import pandas as pd

from schemas import ChatRequest, StreamChunk, ContextInfo
from services.market import market_service
from services.sec import sec_service
from agent.analyst import (
    analyst_agent,
    get_welcome_message,
    get_suggested_questions,
)


router = APIRouter(prefix="/api/ticker", tags=["chat"])


@router.post("/{ticker}/chat/stream")
async def chat_stream(ticker: str, request: ChatRequest):
    """Stream chat response via SSE."""
    ticker = ticker.upper().strip()

    async def generate():
        try:
            async for chunk in analyst_agent.stream_response(
                ticker=ticker,
                question=request.message,
                history=request.conversation_history,
            ):
                yield f"data: {chunk.model_dump_json()}\n\n"
        except Exception as e:
            error = StreamChunk(type="error", content=str(e))
            yield f"data: {error.model_dump_json()}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{ticker}/context")
def get_context(ticker: str):
    """Get available context info."""
    ticker = ticker.upper().strip()
    info = market_service.get_company_info(ticker)
    filings = sec_service.get_filings_metadata(ticker)

    return ContextInfo(
        ticker=ticker,
        available_filings=filings,
        company_info_available=bool(info.get("description")),
        last_updated=pd.Timestamp.now(),
    )


@router.get("/{ticker}/chat/welcome")
def get_welcome(ticker: str):
    """Get welcome message."""
    ticker = ticker.upper().strip()
    info = market_service.get_company_info(ticker)
    name = info.get("name", ticker)

    return {
        "ticker": ticker,
        "company_name": name,
        "welcome_message": get_welcome_message(ticker, name),
        "suggested_questions": get_suggested_questions(ticker),
    }
