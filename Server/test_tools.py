import asyncio
from tools.search_series import search_series
from tools.observations import get_observations
from model.models_fred import SearchSeriesInput, ObservationsInput


async def test_search():
    """Test searching for series"""
    print("\n🔍 Testing fred_search_series...")

    result = await search_series(
        SearchSeriesInput(
            search_text="unemployment rate",
            limit=5
        )
    )

    print(f"Found {result.count} series")
    for series in result.seriess[:3]:  # Show first 3
        print(f"  - {series.get('id')}: {series.get('title')}")


async def test_observations():
    """Test getting observations"""
    print("\n📊 Testing fred_get_observations...")

    result = await get_observations(
        ObservationsInput(
            series_id="FEDFUNDS",
            limit=10
        )
    )

    print(f"Got {result.count} observations")
    print(f"Units: {result.units}")
    print(f"Sort order: {result.sort_order}")
    print("\nFirst 5 observations:")
    for obs in result.observations[:5]:
        print(f"  {obs.get('date')}: {obs.get('value')}")


async def main():
    print("=" * 50)
    print("Testing FRED MCP Tools")
    print("=" * 50)

    await test_search()
    await test_observations()

    print("\n✅ Tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
