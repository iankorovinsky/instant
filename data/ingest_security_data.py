import pandas as pd
import os
from datetime import datetime
from decimal import Decimal
from supabase import create_client, Client
from typing import Optional, Dict, Any

def parse_date(date_str: str) -> Optional[datetime]:
    """Parse date string to datetime, handling #N/A values."""
    if pd.isna(date_str) or str(date_str).startswith('#N/A'):
        return None
    try:
        return datetime.strptime(str(date_str).strip(), '%Y-%m-%d')
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

def parse_bigint(value: Any) -> Optional[int]:
    """Parse value to int (for BigInt fields), handling #N/A values."""
    if pd.isna(value) or str(value).startswith('#N/A'):
        return None
    try:
        return int(float(value))
    except:
        return None

def create_supabase_client() -> Client:
    """Create and return Supabase client."""
    url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    
    if not url or not key:
        raise ValueError(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "(or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) environment variables."
        )
    
    return create_client(url, key)

    
    years_to_maturity = (maturity_date - issue_date).days / 365.25
    
    if years_to_maturity <= 1:
        return 'bill'
    elif years_to_maturity <= 10:
        return 'note'
    else:
        return 'bond'

def transform_row(row: pd.Series) -> Dict[str, Any]:
    """Transform CSV row to database record format matching Prisma schema (camelCase)."""
    issue_date = parse_date(row.get('Issue Date'))
    maturity_date = parse_date(row.get('Maturity'))
    
    instrument_type = 'note'
    
    # Use camelCase field names to match Prisma schema (no @map directives)
    record = {
        'cusip': str(row['CUSIP']).strip(),
        'name': parse_string(row.get('Name')),
        'ticker': parse_string(row.get('Ticker')),
        'type': instrument_type,
        'coupon': parse_decimal(row.get('Coupon')),
        'issueDate': issue_date.isoformat() if issue_date else None,
        'maturityDate': maturity_date.isoformat() if maturity_date else None,
        'couponFrequency': int(parse_decimal(row.get('Coupon Frequency'))) if parse_decimal(row.get('Coupon Frequency')) is not None else None,
        'askModifiedDuration': parse_decimal(row.get('Ask Modified Duration')),
        'bidModifiedDuration': parse_decimal(row.get('Bid Modified Duration')),
        'standardPoorRating': parse_string(row.get("Standard & Poor's Rating")),  # Note: schema uses snake_case for this field
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
    
    # Remove None values to let database use defaults
    return {k: v for k, v in record.items() if v is not None}

if __name__ == "__main__":
    # Load CSV
    df = pd.read_csv('ust-notes-data.csv')
    print(f"Loaded {len(df)} rows from CSV")
    
    # Create Supabase client
    try:
        supabase = create_supabase_client()
        print("Connected to Supabase")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        exit(1)
    
    # Transform and upsert data
    success_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        try:
            record = transform_row(row)
            cusip = record['cusip']
            
            # Upsert by CUSIP (unique key)
            result = supabase.table('instruments').upsert(
                record,
                on_conflict='cusip'
            ).execute()
            
            success_count += 1
            if (index + 1) % 50 == 0:
                print(f"Processed {index + 1}/{len(df)} rows...")
                
        except Exception as e:
            error_count += 1
            print(f"Error processing row {index + 1} (CUSIP: {row.get('CUSIP', 'unknown')}): {e}")
    
    print(f"\nIngestion complete!")
    print(f"Successfully upserted: {success_count}")
    print(f"Errors: {error_count}")