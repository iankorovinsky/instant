import pandas as pd
import os
from pathlib import Path
from datetime import datetime
from decimal import Decimal
from supabase import create_client, Client
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from multiprocessing import Pool, cpu_count
from functools import partial

# Load .env from project root (parent directory)
# Script is in data/, so parent.parent gets us to project root
env_path = Path(__file__).parent.parent / '.env'
if not env_path.exists():
    raise FileNotFoundError(f".env file not found at {env_path}. Please create it in the project root.")
load_dotenv(env_path, override=True)  # override=True ensures .env values take precedence
print(f"Loading environment from: {env_path}")

def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to ISO format string, handling #N/A values."""
    if pd.isna(date_str) or str(date_str).startswith('#N/A'):
        return None
    try:
        dt = datetime.strptime(str(date_str).strip(), '%Y-%m-%d')
        return dt.isoformat()
    except:
        return None

def parse_decimal(value: Any) -> Optional[float]:
    """Parse value to float, handling #N/A and null values."""
    if pd.isna(value) or str(value).startswith('#N/A'):
        return None
    try:
        return float(value)
    except:
        return None

def parse_string(value: Any) -> Optional[str]:
    """Parse value to string, handling #N/A values."""
    if pd.isna(value) or str(value).startswith('#N/A'):
        return None
    str_val = str(value).strip()
    return None if str_val == '' else str_val

def parse_int(value: Any) -> Optional[int]:
    """Parse value to int, handling #N/A values."""
    if pd.isna(value) or str(value).startswith('#N/A'):
        return None
    try:
        return int(float(value))
    except:
        return None

def parse_bigint(value: Any) -> Optional[int]:
    """Parse value to int (for BigInt fields), handling #N/A values."""
    if pd.isna(value) or str(value).startswith('#N/A'):
        return None
    try:
        return int(float(value))
    except:
        return None

def create_supabase_client() -> Client:
    """Create and return Supabase client with service role key (bypasses RLS)."""
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    # Use service role key to bypass RLS for data ingestion
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not url:
        raise ValueError(
            "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL"
        )
    if not key:
        raise ValueError(
            "Missing SUPABASE_SERVICE_ROLE_KEY. "
            "For data ingestion with RLS enabled, you need the service role key (bypasses RLS). "
            "Get it from Supabase Dashboard > Settings > API > service_role key"
        )
    
    return create_client(url, key)
    
def transform_row(row: pd.Series) -> Dict[str, Any]:
    """Transform CSV row to database record format matching Prisma schema (camelCase)."""
        
    # Use camelCase field names to match Prisma schema (no @map directives)
    record = {
        'cusip': parse_string(row.get('CUSIP')),
        'name': parse_string(row.get('Name')),
        'ticker': parse_string(row.get('Ticker')) if parse_string(row.get('Ticker')) != "T" else None,
        'type': 'note',
        'coupon': parse_decimal(row.get('Coupon')),
        'issueDate': parse_date(row.get('Issue Date')),
        'maturityDate': parse_date(row.get('Maturity')),
        'couponFrequency': parse_int(row.get('Coupon Frequency')),
        'askModifiedDuration': parse_decimal(row.get('Ask Modified Duration')),
        'bidModifiedDuration': parse_decimal(row.get('Bid Modified Duration')),
        'standardPoorRating': parse_string(row.get("Standard & Poor's Rating")),
        'moodyRating': parse_string(row.get("Moody's Rating")),
        'fitchRating': parse_string(row.get('Fitch Rating')),
        'dbrsRating': parse_string(row.get('DBRS Rating')),
        'askYieldToMaturity': parse_decimal(row.get('Ask Yield to Maturity')),
        'askPrice': parse_decimal(row.get('Ask Price')),
        'maturityType': parse_string(row.get('Maturity Type')),
        'issuedAmount': parse_bigint(row.get('Issued Amount')),
        'outstandingAmount': parse_bigint(row.get('Outstanding Amount')),
        'currency': parse_string(row.get('Currency')) or 'USD',
        
        # Optional fields
        'series': parse_string(row.get('Series')),
        'bloombergCompositeRating': parse_string(row.get('Bloomberg Composite Rating')),
        'announce': parse_string(row.get('Announce')),
    }
    
    # Set updatedAt to current timestamp (database will handle createdAt on insert)
    record['updatedAt'] = datetime.now().isoformat()
    
    # Remove None values to let database use defaults (but keep updatedAt)
    filtered = {k: v for k, v in record.items() if v is not None}
    # Ensure updatedAt is always included
    if 'updatedAt' not in filtered:
        filtered['updatedAt'] = record['updatedAt']
    return filtered

def process_and_upsert_row(row_data: Tuple[int, Dict[str, Any]]) -> Tuple[bool, Optional[str]]:
    """Process a single row and upsert to Supabase. Returns (success, error_message)."""
    index, row_dict = row_data
    
    try:
        # Create Supabase client in this process (can't share across processes)
        supabase = create_supabase_client()
        
        # Transform row
        row_series = pd.Series(row_dict)
        record = transform_row(row_series)
        cusip = record['cusip']
        
        # Upsert by CUSIP (unique key)
        result = supabase.table('instruments').upsert(
            record,
            on_conflict='cusip'
        ).execute()
        
        return (True, None)
    except Exception as e:
        return (False, f"Row {index + 1} (CUSIP: {row_dict.get('CUSIP', 'unknown')}): {e}")

if __name__ == "__main__":
    # Load CSV
    df = pd.read_csv('ust-notes-data.csv')
    print(f"Loaded {len(df)} rows from CSV")
    
    # Verify Supabase connection before starting
    try:
        test_client = create_supabase_client()
        print("Connected to Supabase")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        exit(1)
    
    # Convert DataFrame to list of dicts for multiprocessing
    rows_data = [(idx, row.to_dict()) for idx, row in df.iterrows()]
    
    # Use multiprocessing to process rows in parallel
    num_workers = min(cpu_count(), 8)  # Limit to 8 workers to avoid overwhelming Supabase
    print(f"Processing with {num_workers} workers...")
    
    success_count = 0
    error_count = 0
    errors = []
    
    with Pool(processes=num_workers) as pool:
        results = pool.map(process_and_upsert_row, rows_data)
        
        for success, error_msg in results:
            if success:
                success_count += 1
            else:
                error_count += 1
                errors.append(error_msg)
                if error_msg:
                    print(error_msg)
            
            # Print progress every 50 rows
            total_processed = success_count + error_count
            if total_processed % 50 == 0:
                print(f"Processed {total_processed}/{len(df)} rows...")
    
    print(f"\nIngestion complete!")
    print(f"Successfully upserted: {success_count}")
    print(f"Errors: {error_count}")
    if errors:
        print(f"\nFirst 10 errors:")
        for err in errors[:10]:
            print(f"  - {err}")