from model.models_fred import SearchSeriesInput, SearchSeriesOutput
from dotenv import load_dotenv
import os
import httpx
load_dotenv()

# FRED API endpoints
FRED_API_KEY = os.getenv("FRED_API_KEY")
FRED_BASE_URL = "https://api.stlouisfed.org/fred"
FRED_SEARCH_URL = f"{FRED_BASE_URL}/series/search"


async def search_series(search_input: SearchSeriesInput) -> SearchSeriesOutput:
    """Search for FRED series."""
    params = {
        "api_key": FRED_API_KEY,
        "search_text": search_input.search_text.strip(),
        "file_type": search_input.file_type,
        "search_type": search_input.search_type,
        "limit": search_input.limit,
        "offset": search_input.offset,
    }

    optional_params = {
        "realtime_start": search_input.realtime_start,
        "realtime_end": search_input.realtime_end,
        "order_by": search_input.order_by,
        "sort_order": search_input.sort_order,
        "filter_variable": search_input.filter_variable,
        "filter_value": search_input.filter_value,
        "tag_names": search_input.tag_names,
        "exclude_tag_names": search_input.exclude_tag_names,
    }
    params.update({k: v for k, v in optional_params.items() if v is not None})

    async with httpx.AsyncClient() as client:
        response = await client.get(FRED_SEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()

        return SearchSeriesOutput(
            realtime_start=data["realtime_start"],
            realtime_end=data["realtime_end"],
            order_by=data["order_by"],
            sort_order=data["sort_order"],
            count=data["count"],
            offset=data["offset"],
            limit=data["limit"],
            seriess=data["seriess"]
        )