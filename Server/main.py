from mcp.server.fastmcp import FastMCP
from tools.search_series import search_series
from tools.observations import get_observations
from model.models_fred import SearchSeriesInput, ObservationsInput

# Initialize FastMCP server with Streamable HTTP
mcp = FastMCP("FRED", host="0.0.0.0", port=8000)


@mcp.tool()
async def fred_search_series(
    search_text: str,
    search_type: str = "full_text",
    limit: int = 10,
    offset: int = 0,
    order_by: str | None = None,
    sort_order: str | None = None,
    filter_variable: str | None = None,
    filter_value: str | None = None,
    tag_names: str | None = None,
    exclude_tag_names: str | None = None,
) -> dict:
    """Search for economic data series in FRED database.

    Args:
        search_text: The words to match against economic data series
        search_type: 'full_text' or 'series_id'
        limit: Maximum results to return (1-1000)
        offset: Result offset for pagination
        order_by: Order by attribute (search_rank, series_id, title, popularity, etc.)
        sort_order: 'asc' or 'desc'
        filter_variable: Filter by 'frequency', 'units', or 'seasonal_adjustment'
        filter_value: Value to filter by
        tag_names: Semicolon-delimited tag names to match
        exclude_tag_names: Semicolon-delimited tag names to exclude
    """
    result = await search_series(
        SearchSeriesInput(
            search_text=search_text,
            search_type=search_type,
            limit=limit,
            offset=offset,
            order_by=order_by,
            sort_order=sort_order,
            filter_variable=filter_variable,
            filter_value=filter_value,
            tag_names=tag_names,
            exclude_tag_names=exclude_tag_names,
        )
    )
    return result.model_dump()


@mcp.tool()
async def fred_get_observations(
    series_id: str,
    observation_start: str | None = None,
    observation_end: str | None = None,
    realtime_start: str | None = None,
    realtime_end: str | None = None,
    limit: int = 10000,
    offset: int = 0,
    sort_order: str = "asc",
    units: str = "lin",
    frequency: str | None = None,
    aggregation_method: str = "avg",
    output_type: int = 1,
) -> dict:
    """Get observations (data values) for an economic data series.

    Args:
        series_id: The ID for a FRED series (e.g., "GNPCA", "GDP", "UNRATE")
        observation_start: Start date for observations (YYYY-MM-DD)
        observation_end: End date for observations (YYYY-MM-DD)
        realtime_start: Start date for real-time period (YYYY-MM-DD)
        realtime_end: End date for real-time period (YYYY-MM-DD)
        limit: Maximum number of results (1-100000)
        offset: Starting offset for pagination
        sort_order: 'asc' or 'desc' (sorts by observation_date)
        units: Data transformation ('lin', 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log')
        frequency: Lower frequency to aggregate values to ('d', 'w', 'bw', 'm', 'q', 'sa', 'a', etc.)
        aggregation_method: Method for frequency aggregation ('avg', 'sum', 'eop')
        output_type: Output format (1-4)
    """
    result = await get_observations(
        ObservationsInput(
            series_id=series_id,
            observation_start=observation_start,
            observation_end=observation_end,
            realtime_start=realtime_start,
            realtime_end=realtime_end,
            limit=limit,
            offset=offset,
            sort_order=sort_order,
            units=units,
            frequency=frequency,
            aggregation_method=aggregation_method,
            output_type=output_type,
        )
    )
    return result.model_dump()


if __name__ == "__main__":
    mcp.run(transport="streamable-http")