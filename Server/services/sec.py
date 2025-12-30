"""SEC Filings Service - Simplified"""
import httpx
from datetime import datetime
from typing import Optional

from config import settings
from schemas import FilingMetadata


class SECService:
    """SEC EDGAR client for filing metadata."""

    BASE_URL = "https://data.sec.gov"

    def __init__(self):
        self.headers = {
            "User-Agent": settings.EDGAR_USER_AGENT,
            "Accept": "application/json",
        }
        self._cik_cache: dict[str, str] = {}

    def get_cik(self, ticker: str) -> Optional[str]:
        """Get CIK for ticker."""
        ticker = ticker.upper()
        if ticker in self._cik_cache:
            return self._cik_cache[ticker]

        try:
            url = f"{self.BASE_URL}/files/company_tickers.json"
            with httpx.Client(headers=self.headers, timeout=30) as client:
                resp = client.get(url)
                resp.raise_for_status()
                for entry in resp.json().values():
                    if entry.get("ticker", "").upper() == ticker:
                        cik = str(entry["cik_str"]).zfill(10)
                        self._cik_cache[ticker] = cik
                        return cik
        except Exception:
            pass
        return None

    def get_filings_metadata(
        self,
        ticker: str,
        filing_types: list[str] = ["10-K", "10-Q"],
        count: int = 5,
    ) -> list[FilingMetadata]:
        """Get recent filings metadata."""
        cik = self.get_cik(ticker)
        if not cik:
            return []

        try:
            url = f"{self.BASE_URL}/submissions/CIK{cik}.json"
            with httpx.Client(headers=self.headers, timeout=30) as client:
                resp = client.get(url)
                resp.raise_for_status()
                data = resp.json()

            recent = data.get("filings", {}).get("recent", {})
            forms = recent.get("form", [])
            dates = recent.get("filingDate", [])
            accessions = recent.get("accessionNumber", [])

            results = []
            for form_type in filing_types:
                for i, form in enumerate(forms):
                    if form == form_type and len(results) < count * len(filing_types):
                        year = int(dates[i].split("-")[0])
                        month = int(dates[i].split("-")[1])
                        quarter = (month - 1) // 3 + 1 if form_type == "10-Q" else None

                        results.append(FilingMetadata(
                            filing_type=form_type,
                            fiscal_year=year,
                            fiscal_quarter=quarter,
                            filing_date=dates[i],
                            accession_number=accessions[i],
                        ))
            return results
        except Exception:
            return []

    def get_context_for_chat(self, ticker: str) -> str:
        """Get simple context string for AI chat."""
        from services.market import market_service

        info = market_service.get_company_info(ticker)
        filings = self.get_filings_metadata(ticker)

        parts = []
        if info.get("description"):
            parts.append(f"<company_description>\n{info['description']}\n</company_description>")

        if filings:
            filing_list = ", ".join(f"{f.filing_type} {f.fiscal_year}" for f in filings[:3])
            parts.append(f"<available_filings>{filing_list}</available_filings>")

        return "\n\n".join(parts) if parts else "No detailed information available."


sec_service = SECService()
