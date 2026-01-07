from model.models_fred import ObservationsInput, ObservationsOutput
from dotenv import load_dotenv
import os
import httpx
load_dotenv()

# FRED API endpoints
FRED_API_KEY = os.getenv("FRED_API_KEY")
FRED_BASE_URL = "https://api.stlouisfed.org/fred"
FRED_OBSERVATIONS_URL = f"{FRED_BASE_URL}/series/observations"


async def get_observations(observations_input: ObservationsInput) -> ObservationsOutput:
    """Get observations (data values) for an economic data series."""
    params = {
        "api_key": FRED_API_KEY,
        "series_id": observations_input.series_id.strip(),
        "file_type": observations_input.file_type,
        "limit": observations_input.limit,
        "offset": observations_input.offset,
        "sort_order": observations_input.sort_order,
        "units": observations_input.units,
        "aggregation_method": observations_input.aggregation_method,
        "output_type": observations_input.output_type,
    }

    optional_params = {
        "observation_start": observations_input.observation_start,
        "observation_end": observations_input.observation_end,
        "realtime_start": observations_input.realtime_start,
        "realtime_end": observations_input.realtime_end,
        "frequency": observations_input.frequency,
    }
    params.update({k: v for k, v in optional_params.items() if v is not None})

    async with httpx.AsyncClient() as client:
        response = await client.get(FRED_OBSERVATIONS_URL, params=params)
        response.raise_for_status()
        data = response.json()

        # Remove redundant realtime_start and realtime_end from each observation
        cleaned_observations = []
        for obs in data["observations"]:
            cleaned_obs = {k: v for k, v in obs.items() if k not in ["realtime_start", "realtime_end"]}
            cleaned_observations.append(cleaned_obs)

        return ObservationsOutput(
            realtime_start=data["realtime_start"],
            realtime_end=data["realtime_end"],
            units=data["units"],
            sort_order=data["sort_order"],
            count=data["count"],
            observations=cleaned_observations
        )
