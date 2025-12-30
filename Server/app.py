"""FastAPI Application - Entry Point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import ticker_router, chat_router

app = FastAPI(title="Stock Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ticker_router)
app.include_router(chat_router)


@app.get("/health")
def health():
    return {"status": "ok"}
