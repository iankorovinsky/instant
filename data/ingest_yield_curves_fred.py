import argparse
import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Iterable, List
from urllib.parse import urlencode
from urllib.request import urlopen

from supabase_helper import create_supabase_client, load_env

FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"
DEFAULT_LOOKBACK_DAYS = 30
YIELD_CURVE_ID_NAMESPACE = uuid.NAMESPACE_DNS

# FRED series map for Treasury par yields (percent values).
FRED_SERIES_BY_TENOR: Dict[str, str] = {
  "1M": "DGS1MO",
  "3M": "DGS3MO",
  "6M": "DGS6MO",
  "1Y": "DGS1",
  "2Y": "DGS2",
  "3Y": "DGS3",
  "5Y": "DGS5",
  "7Y": "DGS7",
  "10Y": "DGS10",
  "20Y": "DGS20",
  "30Y": "DGS30",
}

TENOR_ENUM_BY_LABEL: Dict[str, str] = {
    "1M": "M1",
    "3M": "M3",
    "6M": "M6",
    "1Y": "Y1",
    "2Y": "Y2",
    "3Y": "Y3",
    "5Y": "Y5",
    "7Y": "Y7",
    "10Y": "Y10",
    "20Y": "Y20",
    "30Y": "Y30",
}


def fetch_observations(
    series_id: str,
    api_key: str,
    start: str,
    end: str,
) -> List[Dict[str, str]]:
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "observation_start": start,
        "observation_end": end,
    }
    url = f"{FRED_BASE_URL}?{urlencode(params)}"
    with urlopen(url) as response:
        payload = json.load(response)
    return payload.get("observations", [])


def chunked(items: List[Dict[str, object]], size: int) -> Iterable[List[Dict[str, object]]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def build_records(
    tenor: str,
    tenor_enum: str,
    observations: List[Dict[str, str]],
    ingested_at: str,
) -> List[Dict[str, object]]:
    records: List[Dict[str, object]] = []
    for obs in observations:
        value = obs.get("value")
        if value in (None, ".", ""):
            continue

        obs_date = obs.get("date")
        if not obs_date:
            continue

        as_of = datetime.strptime(obs_date, "%Y-%m-%d").isoformat()
        record_id = str(uuid.uuid5(YIELD_CURVE_ID_NAMESPACE, f"{obs_date}:{tenor}"))
        records.append(
            {
                "id": record_id,
                "asOfDate": as_of,
                "tenor": tenor_enum,
                "parYield": float(value),
                "ingestedAt": ingested_at,
            }
        )
    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest FRED yield curves into Supabase.")
    parser.add_argument(
        "--start",
        help="Start date (YYYY-MM-DD). Defaults to --end or today.",
    )
    parser.add_argument(
        "--end",
        help="End date (YYYY-MM-DD). Defaults to today.",
    )
    parser.add_argument(
        "--tenors",
        help="Comma-separated tenors (e.g. 1M,3M,2Y). Defaults to all.",
        default="",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Rows per upsert batch.",
    )
    return parser.parse_args()


def main() -> None:
    load_env()

    args = parse_args()
    end = args.end or date.today().isoformat()
    if args.start:
        start = args.start
    else:
        end_date = datetime.strptime(end, "%Y-%m-%d").date()
        start = (end_date - timedelta(days=DEFAULT_LOOKBACK_DAYS)).isoformat()

    api_key = (
        os.getenv("FRED_API_KEY")
        or os.getenv("FRED_API_TOKEN")
        or os.getenv("FRED_APIKEY")
    )
    if not api_key:
        raise ValueError("Missing FRED_API_KEY in environment or .env.")

    selected_tenors: List[str]
    if args.tenors.strip():
        selected_tenors = [t.strip().upper() for t in args.tenors.split(",") if t.strip()]
        unknown = [t for t in selected_tenors if t not in FRED_SERIES_BY_TENOR]
        if unknown:
            raise ValueError(f"Unknown tenors: {', '.join(unknown)}")
    else:
        selected_tenors = list(FRED_SERIES_BY_TENOR.keys())

    supabase = create_supabase_client()
    ingested_at = datetime.now(timezone.utc).isoformat()

    total_records = 0
    for tenor in selected_tenors:
        series_id = FRED_SERIES_BY_TENOR[tenor]
        tenor_enum = TENOR_ENUM_BY_LABEL[tenor]
        observations = fetch_observations(series_id, api_key, start, end)
        records = build_records(tenor, tenor_enum, observations, ingested_at)
        total_records += len(records)

        for batch in chunked(records, args.batch_size):
            supabase.table("yield_curves").upsert(
                batch, on_conflict="asOfDate,tenor"
            ).execute()

        print(f"{tenor}: upserted {len(records)} rows from {series_id}")

    print(f"Done. Total rows upserted: {total_records}")


if __name__ == "__main__":
    main()
