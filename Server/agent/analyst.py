"""Equity Analyst Agent - Simplified"""
from typing import AsyncGenerator
import openai
from openai import AsyncOpenAI

from config import settings
from schemas import ChatMessage, StreamChunk
from services import sec_service, market_service


SYSTEM_PROMPT = """You are a professional equity research analyst for {ticker} ({company_name}).

PRINCIPLES:
1. Evidence-based: Ground claims in provided SEC filings and market data
2. Balanced: Present both opportunities and risks
3. Source attribution: Cite sources (e.g., "According to Item 1A of the 10-K 2024...")
4. Honest: State clearly when information is unavailable

CONTEXT AVAILABLE:
{context_description}

RESPONSE STRUCTURE:
1. Direct answer to the question
2. Supporting evidence from filings
3. Relevant metrics when available
4. Risk considerations
5. Investment implications"""


USER_PROMPT = """<context>
{company_context}
</context>

<market_data>
Ticker: {ticker}
Price: {price}
Market Cap: {market_cap}
P/E Ratio: {pe_ratio}
52W Range: {range_52w}
Sector: {sector}
</market_data>

<question>
{question}
</question>

Analyze using the context above. Cite sources when referencing filing data."""


class AnalystAgent:
    """Streaming equity analyst powered by OpenAI."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE

    async def stream_response(
        self,
        ticker: str,
        question: str,
        history: list[ChatMessage] | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        """Stream analyst response."""
        try:
            # Gather context
            info = market_service.get_company_info(ticker)
            context = sec_service.get_context_for_chat(ticker)

            # Build messages
            messages = self._build_messages(
                ticker=ticker,
                question=question,
                info=info,
                context=context,
                history=history or [],
            )

            # Stream from OpenAI
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield StreamChunk(type="text", content=chunk.choices[0].delta.content)

            yield StreamChunk(type="done")

        except openai.APIError as e:
            yield StreamChunk(type="error", content=f"API error: {e}")
        except Exception as e:
            yield StreamChunk(type="error", content=f"Error: {e}")

    def _build_messages(
        self,
        ticker: str,
        question: str,
        info: dict,
        context: str,
        history: list[ChatMessage],
    ) -> list[dict]:
        """Build messages for OpenAI."""
        company_name = info.get("name", ticker)

        # System prompt
        messages = [{
            "role": "system",
            "content": SYSTEM_PROMPT.format(
                ticker=ticker,
                company_name=company_name,
                context_description="Company description and recent SEC filings (10-K, 10-Q)",
            ),
        }]

        # History
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})

        # Format market data
        price = f"${info.get('price', 0):.2f}" if info.get("price") else "N/A"
        market_cap = f"${info.get('market_cap', 0):,.0f}" if info.get("market_cap") else "N/A"
        pe = f"{info.get('pe_ratio', 0):.2f}" if info.get("pe_ratio") else "N/A"
        low = info.get("week_52_low", 0)
        high = info.get("week_52_high", 0)
        range_52w = f"${low:.2f} - ${high:.2f}" if low and high else "N/A"

        # User message
        messages.append({
            "role": "user",
            "content": USER_PROMPT.format(
                ticker=ticker,
                question=question,
                company_context=context,
                price=price,
                market_cap=market_cap,
                pe_ratio=pe,
                range_52w=range_52w,
                sector=info.get("sector", "N/A"),
            ),
        })

        return messages


# Singleton
analyst_agent = AnalystAgent()


async def stream_analyst_response(
    ticker: str,
    question: str,
    history: list[ChatMessage] | None = None,
) -> AsyncGenerator[StreamChunk, None]:
    """Convenience function for streaming responses."""
    async for chunk in analyst_agent.stream_response(ticker, question, history):
        yield chunk


def get_welcome_message(ticker: str, company_name: str) -> str:
    """Welcome message for chat UI."""
    return f"""I'm your AI equity analyst for {ticker} ({company_name}).

I can help you analyze:
- Business model and revenue streams
- Key risks and opportunities
- Financial performance
- Competitive positioning

What would you like to know?"""


def get_suggested_questions(ticker: str) -> list[str]:
    """Suggested questions for chat UI."""
    return [
        f"What is {ticker}'s main business model?",
        f"What are the key risks facing {ticker}?",
        f"How has {ticker} performed recently?",
        f"Who are {ticker}'s main competitors?",
    ]
