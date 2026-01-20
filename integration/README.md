# Integration Tests

This directory contains integration test scripts and test data for the Instant Trading System.

## Files

- `test-integration.sh` - Main integration test script that tests the OMS flow
- `seed-test-data.sql` - SQL script to seed test data (accounts, instruments, households)
- `seed-test-data.sh` - Shell script wrapper for seeding test data

## Usage

```bash
# Run full integration test suite (auto-seeds data)
make test

# Or run manually:
make seed-test-data          # Seed test data
./integration/test-integration.sh  # Run tests
```

## Test Data

The test data includes:
- **Household**: `test-household-123`
- **Account**: `test-account-123`
- **Instrument**: `912810TM6` (US Treasury Note 2.5% 2030)

## Requirements

- API server running on `http://localhost:8080`
- Database migrations applied (`make migrate`)
- Test data seeded (`make seed-test-data`)
