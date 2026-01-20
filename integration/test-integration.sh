#!/bin/bash

# Integration Test Script for Instant Trading System
# Tests the complete OMS flow: Create → Approve → Send to EMS

set -e

API_URL="${API_URL:-http://localhost:8080}"
ACCOUNT_ID="${ACCOUNT_ID:-test-account-123}"
INSTRUMENT_ID="${INSTRUMENT_ID:-912810TM6}"
COMPLIANCE_RULE_ID="${COMPLIANCE_RULE_ID:-test-compliance-rule-001}"

echo "===================================="
echo "Instant Trading System - Integration Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

wait_for_match() {
    local label="$1"
    local command="$2"
    local pattern="$3"
    local delay="${4:-2}"
    while true; do
        LAST_RESPONSE=$(eval "$command")
        if echo "$LAST_RESPONSE" | grep -q "$pattern"; then
            echo -e "${GREEN}✓ ${label}${NC}"
            return 0
        fi
        sleep "$delay"
    done
}

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

# Test 1.5: Verify OMS endpoint exists
echo "1.5. Verifying OMS endpoint..."
ENDPOINT_CHECK=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/oms/orders" \
  -H "Content-Type: application/json" \
  -d '{}')
if [ "$ENDPOINT_CHECK" = "400" ] || [ "$ENDPOINT_CHECK" = "201" ]; then
    echo -e "${GREEN}✓ OMS endpoint exists${NC}"
elif [ "$ENDPOINT_CHECK" = "404" ]; then
    echo -e "${RED}✗ OMS endpoint not found (404)${NC}"
    echo -e "${YELLOW}  → Make sure the API server is running the latest code${NC}"
    echo -e "${YELLOW}  → Try: cd services/api && go run main.go${NC}"
    exit 1
else
    echo -e "${RED}✗ Unexpected response code: $ENDPOINT_CHECK${NC}"
    exit 1
fi
echo ""

# Test 1.6: Verify Compliance views endpoint exists
echo "1.6. Verifying Compliance views endpoint..."
COMPLIANCE_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/views/compliance/rules")
if [ "$COMPLIANCE_CHECK" = "200" ] || [ "$COMPLIANCE_CHECK" = "500" ]; then
    echo -e "${GREEN}✓ Compliance views endpoint exists${NC}"
else
    echo -e "${RED}✗ Compliance views endpoint not available (${COMPLIANCE_CHECK})${NC}"
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

# Test 3: Query Blotter
echo "4. Waiting for blotter projection..."
wait_for_match "Order appears in blotter" "curl -s \"${API_URL}/api/views/blotter\"" "$ORDER_ID"
echo ""

# Test 4: Get Order Details
echo "5. Getting order details..."
ORDER_DETAIL=$(curl -s "${API_URL}/api/views/orders/${ORDER_ID}")
if echo "$ORDER_DETAIL" | grep -q "$ORDER_ID"; then
    STATE=$(echo "$ORDER_DETAIL" | grep -o '"state":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ Order detail retrieved (state: ${STATE})${NC}"
else
    echo -e "${RED}✗ Failed to get order detail${NC}"
    exit 1
fi
echo ""

# Test 4.5: Verify compliance result stored
echo "5.5. Waiting for compliance result..."
wait_for_match "Compliance result stored" \
  "curl -s \"${API_URL}/api/views/orders/${ORDER_ID}\"" \
  "complianceResult"
ORDER_DETAIL=$(curl -s "${API_URL}/api/views/orders/${ORDER_ID}")
if echo "$ORDER_DETAIL" | grep -q "\"status\":\"WARN\""; then
    echo -e "${GREEN}✓ Compliance result stored (WARN)${NC}"
else
    echo -e "${YELLOW}⚠ Compliance result stored (status not WARN)${NC}"
fi
STATE=$(echo "$ORDER_DETAIL" | grep -o '"state":"[^"]*' | cut -d'"' -f4)
echo ""

# Test 4.6: Verify compliance violation projection
echo "5.6. Waiting for compliance violation projection..."
wait_for_match "Compliance violation projected" \
  "curl -s \"${API_URL}/api/views/compliance/violations?ruleId=${COMPLIANCE_RULE_ID}&accountId=${ACCOUNT_ID}\"" \
  "${COMPLIANCE_RULE_ID}"
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

    echo "6. Waiting for approval projection..."
    wait_for_match "Order approval projected" "curl -s \"${API_URL}/api/views/orders/${ORDER_ID}\"" "\"state\":\"APPROVED\""
    echo ""
fi

# Test 6: Query Events
echo "7. Querying events for order..."
EVENTS=$(curl -s "${API_URL}/api/events?aggregateType=Order&aggregateId=${ORDER_ID}")
EVENT_COUNT=$(echo "$EVENTS" | grep -o '"eventType"' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found ${EVENT_COUNT} events for order${NC}"
echo ""

# Test 7: Send to EMS
echo "8. Sending order to EMS..."
SEND_RESPONSE=$(curl -s -X POST "${API_URL}/api/oms/orders/${ORDER_ID}/send-to-ems" \
  -H "Content-Type: application/json" \
  -d "{\"sentBy\": \"integration-test\"}")

if echo "$SEND_RESPONSE" | grep -q "sent_to_ems"; then
    echo -e "${GREEN}✓ Order sent to EMS${NC}"
else
    echo -e "${RED}✗ Failed to send order to EMS${NC}"
    echo "Response: $SEND_RESPONSE"
    exit 1
fi
echo ""

# Test 8: Query Executions
echo "10. Waiting for execution projection..."
EXECUTION_ID=""
ATTEMPTS=0
while [ -z "$EXECUTION_ID" ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    EXECUTIONS=$(curl -s "${API_URL}/api/views/executions?orderId=${ORDER_ID}")
    EXECUTION_ID=$(echo "$EXECUTIONS" | grep -o '"executionId":"[^"]*' | cut -d'"' -f4 | head -n 1)
    if [ -n "$EXECUTION_ID" ]; then
        echo -e "${GREEN}✓ Execution created: ${EXECUTION_ID}${NC}"
        break
    fi
    if [ $((ATTEMPTS % 5)) -eq 0 ]; then
        echo -e "${YELLOW}⏳ Waiting for execution projection...${NC}"
    fi
    sleep 2
done
echo ""

# Test 9: Execution Detail + Events
echo "11. Fetching execution detail..."
EXEC_DETAIL=$(curl -s "${API_URL}/api/views/executions/${EXECUTION_ID}")
if echo "$EXEC_DETAIL" | grep -q "$EXECUTION_ID"; then
    echo -e "${GREEN}✓ Execution detail retrieved${NC}"
else
    echo -e "${RED}✗ Failed to get execution detail${NC}"
    echo "Response: $EXEC_DETAIL"
    exit 1
fi
echo ""

echo "12. Querying execution events..."
EXEC_EVENTS=$(curl -s "${API_URL}/api/events?aggregateType=Execution&aggregateId=${EXECUTION_ID}")
EXEC_EVENT_COUNT=$(echo "$EXEC_EVENTS" | grep -o '"eventType"' | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found ${EXEC_EVENT_COUNT} events for execution${NC}"
echo ""

# Test 10: PMS Optimization Flow
echo "12. Waiting for PMS account view..."
wait_for_match "PMS account view available" "curl -s \"${API_URL}/api/views/accounts/${ACCOUNT_ID}\"" "$ACCOUNT_ID"
echo ""

echo "13. Waiting for PMS positions..."
POSITION_COUNT=0
ATTEMPTS=0
while [ "$POSITION_COUNT" -le 0 ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    ACCOUNT_VIEW=$(curl -s "${API_URL}/api/views/accounts/${ACCOUNT_ID}")
    POSITION_COUNT=$(echo "$ACCOUNT_VIEW" | grep -o '"instrumentId"' | wc -l | tr -d ' ')
    if [ "$POSITION_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Positions updated (${POSITION_COUNT})${NC}"
        break
    fi
    sleep 2
done
echo ""

echo "14. Setting PMS target..."
TARGET_RESPONSE=$(curl -s -X POST "${API_URL}/api/pms/targets" \
  -H "Content-Type: application/json" \
  -d "{
    \"scope\": \"account\",
    \"scopeId\": \"${ACCOUNT_ID}\",
    \"durationTarget\": 5,
    \"bucketWeights\": {\"0-2y\": 20, \"2-5y\": 30, \"5-10y\": 30, \"10-20y\": 15, \"20y+\": 5},
    \"createdBy\": \"integration-test\"
  }")

TARGET_ID=$(echo "$TARGET_RESPONSE" | grep -o '"targetId":"[^"]*' | cut -d'"' -f4)
if [ -n "$TARGET_ID" ]; then
    echo -e "${GREEN}✓ Target set: ${TARGET_ID}${NC}"
else
    echo -e "${RED}✗ Failed to set target${NC}"
    echo "Response: $TARGET_RESPONSE"
    exit 1
fi
echo ""

echo "15. Running optimization..."
OPT_RESPONSE=$(curl -s -X POST "${API_URL}/api/pms/optimization" \
  -H "Content-Type: application/json" \
  -d "{
    \"scope\": \"account\",
    \"scopeId\": \"${ACCOUNT_ID}\",
    \"targetId\": \"${TARGET_ID}\",
    \"durationTarget\": 5,
    \"bucketWeights\": {\"0-2y\": 20, \"2-5y\": 30, \"5-10y\": 30, \"10-20y\": 15, \"20y+\": 5},
    \"assumptions\": \"integration-test\",
    \"requestedBy\": \"integration-test\"
  }")

PROPOSAL_ID=$(echo "$OPT_RESPONSE" | grep -o '"proposalId":"[^"]*' | cut -d'"' -f4)
if [ -n "$PROPOSAL_ID" ]; then
    echo -e "${GREEN}✓ Proposal generated: ${PROPOSAL_ID}${NC}"
else
    echo -e "${RED}✗ Failed to run optimization${NC}"
    echo "Response: $OPT_RESPONSE"
    exit 1
fi
echo ""

echo "16. Approving proposal..."
APPROVE_PROPOSAL=$(curl -s -X POST "${API_URL}/api/pms/proposals/${PROPOSAL_ID}/approve" \
  -H "Content-Type: application/json" \
  -d "{\"approvedBy\": \"integration-test\"}")

if echo "$APPROVE_PROPOSAL" | grep -q "approved"; then
    echo -e "${GREEN}✓ Proposal approved${NC}"
else
    echo -e "${RED}✗ Failed to approve proposal${NC}"
    echo "Response: $APPROVE_PROPOSAL"
    exit 1
fi
echo ""

echo "17. Sending proposal to OMS..."
SEND_PROPOSAL=$(curl -s -X POST "${API_URL}/api/pms/proposals/${PROPOSAL_ID}/send-to-oms" \
  -H "Content-Type: application/json" \
  -d "{\"sentBy\": \"integration-test\"}")

if echo "$SEND_PROPOSAL" | grep -q "sent_to_oms"; then
    echo -e "${GREEN}✓ Proposal sent to OMS${NC}"
else
    echo -e "${RED}✗ Failed to send proposal to OMS${NC}"
    echo "Response: $SEND_PROPOSAL"
    exit 1
fi
echo ""

# Test 11: Bulk Create Orders
echo "18. Testing bulk order creation..."
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
echo "- Execution: $EXECUTION_ID"
echo "- Batch created: $BATCH_ID"
echo "- Events recorded: $EVENT_COUNT"
echo "- Execution events: $EXEC_EVENT_COUNT"
echo ""
echo "To view all orders:"
echo "  curl ${API_URL}/api/views/blotter | jq"
echo ""
echo "To view events:"
echo "  curl \"${API_URL}/api/events?eventType=OrderCreated\" | jq"
echo ""
