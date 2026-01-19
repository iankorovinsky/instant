#!/bin/bash

# Seed Test Data Script
# Seeds the database with test accounts and instruments for integration testing

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

if [ -z "$DIRECT_URL" ]; then
    echo "Error: DIRECT_URL not set in .env"
    exit 1
fi

echo "Seeding test data..."

# Run the SQL file
psql "$DIRECT_URL" -f "$(dirname "$0")/seed-test-data.sql"

echo ""
echo "✓ Test data seeded successfully!"
echo ""
echo "You can now run: make test"
