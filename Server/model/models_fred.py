from pydantic import BaseModel
from typing import Literal


class SearchSeriesInput(BaseModel):
    search_text: str
    file_type: Literal["xml", "json"] = "json"
    search_type: Literal["full_text", "series_id"] = "full_text"
    realtime_start: str | None = None
    realtime_end: str | None = None
    limit: int = 1000
    offset: int = 0
    order_by: Literal[
        "search_rank", "series_id", "title", "units", "frequency",
        "seasonal_adjustment", "realtime_start", "realtime_end",
        "last_updated", "observation_start", "observation_end",
        "popularity", "group_popularity"
    ] | None = None
    sort_order: Literal["asc", "desc"] | None = None
    filter_variable: Literal["frequency", "units", "seasonal_adjustment"] | None = None
    filter_value: str | None = None
    tag_names: str | None = None
    exclude_tag_names: str | None = None


class SearchSeriesOutput(BaseModel):
    realtime_start: str
    realtime_end: str
    order_by: str
    sort_order: str
    count: int
    offset: int
    limit: int
    seriess: list[dict]
    
    