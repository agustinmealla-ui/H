"""Application Configuration"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Settings loaded from environment variables"""

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.7

    # SEC EDGAR
    EDGAR_USER_AGENT: str = "StockAnalysis/1.0 (contact@example.com)"

    # Cache
    CACHE_DIR: Path = Path(__file__).parent / "data"

    # API
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
