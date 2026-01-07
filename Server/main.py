from mcp.server.fastmcp import FastMCP
from tools.search_series import search_series
from model.models_fred import SearchSeriesInput

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


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
