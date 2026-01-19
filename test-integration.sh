#!/bin/bash

# Integration Test Script for Instant Trading System
# Tests the complete OMS flow: Create → Approve → Send to EMS

set -e

API_URL="${API_URL:-http://localhost:8080}"
ACCOUNT_ID="${ACCOUNT_ID:-test-account-123}"
INSTRUMENT_ID="${INSTRUMENT_ID:-912810TM6}"

echo "===================================="
echo "Instant Trading System - Integration Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1. Testing API Health..."
HEALTH=$(curl -s "${API_URL}/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: Create Order
echo "2. Creating test order..."
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/api/oms/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"accountId\": \"${ACCOUNT_ID}\",
    \"instrumentId\": \"${INSTRUMENT_ID}\",
    \"side\": \"BUY\",
    \"quantity\": 100000,
    \"orderType\": \"MARKET\",
    \"timeInForce\": \"DAY\",
    \"createdBy\": \"integration-test\"
  }")

ORDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
    echo -e "${RED}✗ Failed to create order${NC}"
    echo "Response: $CREATE_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Order created: ${ORDER_ID}${NC}"
fi
echo ""

# Wait for projection to update
echo "3. Waiting for projection worker to process event..."
sleep 2
echo ""

# Test 3: Query Blotter
echo "4. Querying blotter..."
BLOTTER=$(curl -s "${API_URL}/api/views/blotter")
if echo "$BLOTTER" | grep -q "$ORDER_ID"; then
    echo -e "${GREEN}✓ Order appears in blotter${NC}"
else
    echo -e "${YELLOW}⚠ Order not yet in blotter (projection may be slow)${NC}"
fi
echo ""

# Test 4: Get Order Details
echo "5. Getting order details..."
ORDER_DETAIL=$(curl -s "${API_URL}/api/views/orders/${ORDER_ID}")
if echo "$ORDER_DETAIL" | grep -q "$ORDER_ID"; then
    echo -e "${GREEN}✓ Order detail retrieved${NC}"
    STATE=$(echo "$ORDER_DETAIL" | grep -o '"state":"[^"]*' | cut -d'"' -f4)
    echo "  Order State: $STATE"
else
    echo -e "${RED}✗ Failed to get order detail${NC}"
    exit 1
fi
echo ""

# Test 5: Approve Order (if in APPROVAL_PENDING state)
if [ "$STATE" == "APPROVAL_PENDING" ]; then
    echo "6. Approving order..."
    APPROVE_RESPONSE=$(curl -s -X POST "${API_URL}/api/oms/orders/${ORDER_ID}/approve" \
      -H "Content-Type: application/json" \
      -d "{\"approvedBy\": \"integration-test\"}")

    if echo "$APPROVE_RESPONSE" | grep -q "approved"; then
        echo -e "${GREEN}✓ Order approved${NC}"
    else
        echo -e "${RED}✗ Failed to approve order${NC}"
        echo "Response: $APPROVE_RESPONSE"
    fi
    echo ""

    # Wait for projection
    sleep 1
fi

# Test 6: Query Events
echo "7. Querying events for order..."
EVENTS=$(curl -s "${API_URL}/api/events?aggregateType=Order&aggregateId=${ORDER_ID}")
EVENT_COUNT=$(echo "$EVENTS" | grep -o '"eventType"' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found ${EVENT_COUNT} events for order${NC}"
echo ""

# Test 7: Bulk Create Orders
echo "8. Testing bulk order creation..."
BULK_RESPONSE=$(curl -s -X POST "${API_URL}/api/oms/orders/bulk" \
  -H "Content-Type: application/json" \
  -d "{
    \"createdBy\": \"integration-test\",
    \"orders\": [
      {
        \"accountId\": \"${ACCOUNT_ID}\",
        \"instrumentId\": \"${INSTRUMENT_ID}\",
        \"side\": \"BUY\",
        \"quantity\": 50000,
        \"orderType\": \"MARKET\",
        \"timeInForce\": \"DAY\",
        \"createdBy\": \"integration-test\"
      },
      {
        \"accountId\": \"${ACCOUNT_ID}\",
        \"instrumentId\": \"${INSTRUMENT_ID}\",
        \"side\": \"SELL\",
        \"quantity\": 75000,
        \"orderType\": \"LIMIT\",
        \"limitPrice\": 99.5,
        \"timeInForce\": \"DAY\",
        \"createdBy\": \"integration-test\"
      }
    ]
  }")

BATCH_ID=$(echo "$BULK_RESPONSE" | grep -o '"batchId":"[^"]*' | cut -d'"' -f4)
if [ -n "$BATCH_ID" ]; then
    echo -e "${GREEN}✓ Bulk orders created: Batch ${BATCH_ID}${NC}"
else
    echo -e "${RED}✗ Bulk order creation failed${NC}"
    echo "Response: $BULK_RESPONSE"
fi
echo ""

# Summary
echo "===================================="
echo -e "${GREEN}Integration Test Complete!${NC}"
echo "===================================="
echo ""
echo "Summary:"
echo "- Created order: $ORDER_ID"
echo "- Batch created: $BATCH_ID"
echo "- Events recorded: $EVENT_COUNT"
echo ""
echo "To view all orders:"
echo "  curl ${API_URL}/api/views/blotter | jq"
echo ""
echo "To view events:"
echo "  curl \"${API_URL}/api/events?eventType=OrderCreated\" | jq"
echo ""
