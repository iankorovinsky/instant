# Data

Helpers and scripts for ingesting market data into Supabase.

## Setup
```bash
pip install -r requirements.txt
```

Ensure `.env` includes:
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
FRED_API_KEY=...
```

## Run
```bash
python ingest_security_data.py
python ingest_yield_curves_fred.py
```

Seed the app database:
```bash
./seed-app.sh
```

Notes:
- `ingest_security_data.py` loads `ust-notes-data.csv` into `instruments`.
- `ingest_yield_curves_fred.py` pulls FRED par yields and upserts `yield_curves`
  by `(asOfDate, tenor)`; defaults to the last 30 days if no dates are provided.
