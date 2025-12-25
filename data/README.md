# Market Data & Securities

This directory contains fetched US Treasury security master data for Instant.

### US Treasury Instruments (Notes)

Master data for UST notes that can be traded.

**Fields:**
- `askModifiedDuration` - Modified duration
- `name` - Security name
- `ticker` - Ticker symbol
- `cusip` - Unique identifier
- `coupon` - Annual coupon rate (0 for bills)
- `issueDate` - ISO date format
- `maturity` - Maturity date (ISO format)
- `standardPoorRating` - S&P rating
- `moodyRating` - Moody's rating
- `fitchRating` - Fitch rating
- `dbrsRating` - DBRS rating
- `couponFrequency` - Payments per year (typically 2 for notes/bonds, 0 for bills)
- `askYieldToMaturity` - Ask yield to maturity
- `askPrice` - Ask price
- `series` - Series identifier
- `bloombergCompositeRating` - Bloomberg composite rating
- `maturityType` - Maturity type (e.g., NORMAL)
- `announce` - Announcement date
- `issuedAmount` - Total issued amount
- `outstandingAmount` - Outstanding amount
- `bidModifiedDuration` - Bid modified duration
- `currency` - Currency code (e.g., USD)

**Example Format:**
```json
{
  "askModifiedDuration": 0.062,
  "name": "United States Treasury Note/Bond",
  "ticker": "T",
  "cusip": "9128285X4",
  "coupon": 2.875,
  "issueDate": "2019-02-15",
  "maturity": "2026-02-15",
  "standardPoorRating": "#N/A N/A",
  "moodyRating": "Aa1",
  "fitchRating": "AA+u",
  "dbrsRating": "AAAu",
  "couponFrequency": 2,
  "askYieldToMaturity": 3.42,
  "askPrice": 99.875,
  "series": "#N/A Field Not Applicable",
  "bloombergCompositeRating": "NR",
  "maturityType": "NORMAL",
  "announce": "#N/A Field Not Applicable",
  "issuedAmount": 38500000000,
  "outstandingAmount": 38450000000,
  "bidModifiedDuration": 0.0618,
  "currency": "USD"
}
```

### Data Sources

This instrument data was fetched from a financial data provider (not mocked).

### Ingestion

**Setup:**
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables (create `.env` file or export):
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   Or use the Next.js env var names:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```
   
   **Note**: For upsert operations, you may need the service role key instead of the anon key.

**Run:**
```bash
python ingest_security_data.py
```

The script will:
- Load data from `ust-notes-data.csv`
- Transform CSV columns to database schema
- Upsert records by CUSIP (unique key)
- Handle null values and "#N/A" placeholders
- Determine instrument type (bill/note/bond) based on maturity