-- Seed data for the full app (PMS, OMS, EMS, Compliance, Events)

BEGIN;

-- Households
INSERT INTO households ("householdId", name, "createdAt", "createdBy")
VALUES
  ('seed-household-001', 'Cedar Ridge Family', NOW(), 'seed-script'),
  ('seed-household-002', 'Northlake Partners', NOW(), 'seed-script')
ON CONFLICT ("householdId") DO NOTHING;

-- Portfolio model (optional)
INSERT INTO portfolio_models (
  "modelId", name, description, "durationTarget", "bucketWeights", constraints,
  "createdAt", "createdBy", "updatedAt", "updatedBy"
)
VALUES (
  'seed-model-001',
  'Core Income',
  'Balanced duration with moderate risk',
  5.0,
  '{"0-2y":20,"2-5y":30,"5-10y":30,"10-20y":15,"20y+":5}',
  '{"maxPositionSize":10,"maxTurnover":20}',
  NOW(),
  'seed-script',
  NOW(),
  'seed-script'
)
ON CONFLICT ("modelId") DO NOTHING;

-- Accounts
INSERT INTO accounts ("accountId", "householdId", name, "accountType", "modelId", "createdAt", "createdBy")
VALUES
  ('seed-account-001', 'seed-household-001', 'Cedar Ridge Core', 'individual', 'seed-model-001', NOW(), 'seed-script'),
  ('seed-account-002', 'seed-household-001', 'Cedar Ridge Income', 'trust', NULL, NOW(), 'seed-script'),
  ('seed-account-003', 'seed-household-002', 'Northlake Alpha', 'corporate', NULL, NOW(), 'seed-script')
ON CONFLICT ("accountId") DO NOTHING;

-- Portfolio targets (used for drift calculations)
INSERT INTO portfolio_targets (
  "targetId", scope, "scopeId", "modelId", "durationTarget", "bucketWeights", constraints,
  "effectiveFrom", "createdAt", "createdBy", "accountId"
)
VALUES
  (
    'seed-target-001',
    'account',
    'seed-account-001',
    'seed-model-001',
    5.0,
    '{"0-2y":20,"2-5y":30,"5-10y":30,"10-20y":15,"20y+":5}',
    '{"maxPositionSize":10,"maxTurnover":20}',
    NOW(),
    NOW(),
    'seed-script',
    'seed-account-001'
  ),
  (
    'seed-target-002',
    'account',
    'seed-account-002',
    NULL,
    3.5,
    '{"0-2y":30,"2-5y":30,"5-10y":25,"10-20y":10,"20y+":5}',
    '{"maxPositionSize":12,"maxTurnover":25}',
    NOW(),
    NOW(),
    'seed-script',
    'seed-account-002'
  )
ON CONFLICT ("targetId") DO NOTHING;

-- Instruments
INSERT INTO instruments (
  cusip, name, ticker, type, coupon, "issueDate", "maturityDate",
  "couponFrequency", "askModifiedDuration", "bidModifiedDuration",
  "askYieldToMaturity", "askPrice", "maturityType",
  "issuedAmount", "outstandingAmount", currency,
  "createdAt", "updatedAt"
)
VALUES
  (
    '912810TM6',
    'US Treasury Note 2.5% 2030',
    'T 2.5 02/15/30',
    'note',
    2.5,
    '2020-02-15',
    '2030-02-15',
    2,
    8.5,
    8.5,
    2.5,
    100.0,
    'ORIGINAL',
    50000000000,
    45000000000,
    'USD',
    NOW(),
    NOW()
  ),
  (
    '912828ZT7',
    'US Treasury Note 3.0% 2027',
    'T 3 07/15/27',
    'note',
    3.0,
    '2017-07-15',
    '2027-07-15',
    2,
    4.2,
    4.2,
    3.0,
    99.5,
    'ORIGINAL',
    42000000000,
    38000000000,
    'USD',
    NOW(),
    NOW()
  )
ON CONFLICT (cusip) DO NOTHING;

-- Positions
INSERT INTO positions (
  "accountId", "instrumentId", quantity, "avgCost", "marketValue", duration, dv01, "updatedAt"
)
VALUES
  ('seed-account-001', '912810TM6', 250000, 99.25, 248125, 7.9, 195, NOW()),
  ('seed-account-001', '912828ZT7', 150000, 100.10, 150150, 3.8, 85, NOW()),
  ('seed-account-002', '912828ZT7', 100000, 99.80, 99800, 3.8, 60, NOW())
ON CONFLICT ("accountId", "instrumentId") DO UPDATE SET
  quantity = EXCLUDED.quantity,
  "avgCost" = EXCLUDED."avgCost",
  "marketValue" = EXCLUDED."marketValue",
  duration = EXCLUDED.duration,
  dv01 = EXCLUDED.dv01,
  "updatedAt" = EXCLUDED."updatedAt";

-- Proposals
INSERT INTO proposals (
  "proposalId", "accountId", "householdId", "asOfDate", "targetId",
  trades, "currentAnalytics", "predictedAnalytics", assumptions,
  status, "createdAt", "createdBy"
)
VALUES (
  'seed-proposal-001',
  'seed-account-001',
  NULL,
  NOW(),
  'seed-target-001',
  '[{"side":"BUY","instrumentId":"912828ZT7","cusip":"912828ZT7","description":"US Treasury Note 3.0% 2027","quantity":50000,"estimatedPrice":99.7,"estimatedValue":49850}]',
  '{"totalMarketValue":398275,"totalDuration":5.2,"totalDv01":280,"cashBalance":25000,"cashPercentage":6.3,"bucketWeights":{"0-2y":18,"2-5y":32,"5-10y":30,"10-20y":15,"20y+":5}}',
  '{"totalMarketValue":448125,"totalDuration":5.0,"totalDv01":295,"cashBalance":20000,"cashPercentage":4.5,"bucketWeights":{"0-2y":20,"2-5y":30,"5-10y":30,"10-20y":15,"20y+":5}}',
  'Rebalance duration toward target with minimal turnover.',
  'DRAFT',
  NOW(),
  'seed-script'
)
ON CONFLICT ("proposalId") DO NOTHING;

-- Compliance rules
INSERT INTO compliance_rules (
  "ruleId",
  "ruleKey",
  name,
  description,
  version,
  severity,
  scope,
  predicate,
  "explanationTemplate",
  "evaluationPoints",
  status,
  "effectiveFrom",
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy"
)
VALUES
  (
    'seed-compliance-rule-001',
    'MAX_ORDER_VALUE',
    'Max Order Value',
    'Block orders above $1,000,000 notional',
    1,
    'BLOCK',
    'GLOBAL',
    '{"metric":"order.value","operator":"<=","value":1000000}',
    'Order value {metric} exceeds max {threshold}',
    '["PRE_TRADE"]',
    'ACTIVE',
    NOW(),
    NOW(),
    'seed-script',
    NOW(),
    'seed-script'
  )
ON CONFLICT ("ruleId") DO NOTHING;

-- Orders
INSERT INTO orders (
  "orderId", "accountId", "instrumentId", side, quantity, "orderType",
  "limitPrice", "curveSpreadBp", "timeInForce", state, "batchId", "complianceResult",
  "createdAt", "createdBy", "updatedAt", "lastStateChangeAt", "sentToEmsAt"
)
VALUES
  (
    'seed-order-001',
    'seed-account-001',
    '912810TM6',
    'BUY',
    100000,
    'LIMIT',
    99.75,
    NULL,
    'DAY',
    'APPROVED',
    NULL,
    '{"status":"PASS","checkedAt":"2025-01-01T09:00:00Z","rulesPassed":["MAX_ORDER_VALUE"]}',
    NOW() - INTERVAL '2 days',
    'seed-script',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'seed-order-002',
    'seed-account-002',
    '912828ZT7',
    'SELL',
    75000,
    'MARKET',
    NULL,
    NULL,
    'DAY',
    'APPROVAL_PENDING',
    NULL,
    '{"status":"WARN","checkedAt":"2025-01-01T10:00:00Z","warnings":[{"ruleId":"seed-compliance-rule-001","ruleName":"Max Order Value","description":"Order within limits but flagged for review"}]}',
    NOW() - INTERVAL '1 day',
    'seed-script',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NULL
  )
ON CONFLICT ("orderId") DO NOTHING;

-- Executions
INSERT INTO executions (
  "executionId", "orderId", "accountId", "instrumentId", side,
  "totalQuantity", "filledQuantity", "avgFillPrice", status,
  "asOfDate", "executionStartTime", "executionEndTime", "slippageTotal",
  "slippageBreakdown", "deterministicInputs", "explanation", "createdAt", "updatedAt"
)
VALUES (
  'seed-execution-001',
  'seed-order-001',
  'seed-account-001',
  '912810TM6',
  'BUY',
  100000,
  100000,
  99.82,
  'FILLED',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '45 seconds',
  5.25,
  '{"bucketSpread":2.1,"sizeImpact":3.15}',
  '{"bucket":"5-10y","spreadBp":6,"maxClip":25000,"baselinePrice":99.8,"sizeImpactBps":3.15,"sideImpactBps":0.0}',
  'Filled within expected slippage bounds.',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT ("executionId") DO NOTHING;

-- Fills
INSERT INTO fills (
  "fillId", "executionId", "clipIndex", quantity, price, "timestamp", slippage, "createdAt"
)
VALUES
  ('seed-fill-001', 'seed-execution-001', 1, 50000, 99.80, NOW() - INTERVAL '1 day', 2.1, NOW() - INTERVAL '1 day'),
  ('seed-fill-002', 'seed-execution-001', 2, 50000, 99.84, NOW() - INTERVAL '1 day' + INTERVAL '30 seconds', 3.15, NOW() - INTERVAL '1 day')
ON CONFLICT ("fillId") DO NOTHING;

-- Events
INSERT INTO events (
  "eventId", "occurredAt", "eventType", "aggregateType", "aggregateId",
  "correlationId", "causationId", "actorId", "actorRole", payload, explanation, "schemaVersion"
)
VALUES
  (
    'seed-event-001',
    NOW() - INTERVAL '2 days',
    'OrderCreated',
    'Order',
    'seed-order-001',
    'seed-correlation-001',
    NULL,
    'seed-script',
    'user',
    '{"orderId":"seed-order-001","accountId":"seed-account-001","instrumentId":"912810TM6","side":"BUY","quantity":100000,"orderType":"LIMIT"}',
    'Order created for Cedar Ridge Core.',
    1
  ),
  (
    'seed-event-002',
    NOW() - INTERVAL '2 days' + INTERVAL '5 minutes',
    'RuleEvaluated',
    'Rule',
    'seed-compliance-rule-001',
    'seed-correlation-001',
    'seed-event-001',
    'seed-script',
    'system',
    '{"ruleId":"seed-compliance-rule-001","result":"PASS"}',
    'Compliance check passed.',
    1
  ),
  (
    'seed-event-003',
    NOW() - INTERVAL '1 day',
    'ExecutionRequested',
    'Execution',
    'seed-execution-001',
    'seed-correlation-002',
    NULL,
    'seed-script',
    'system',
    '{"executionId":"seed-execution-001","orderId":"seed-order-001"}',
    NULL,
    1
  ),
  (
    'seed-event-004',
    NOW() - INTERVAL '1 day' + INTERVAL '30 seconds',
    'FillGenerated',
    'Execution',
    'seed-execution-001',
    'seed-correlation-002',
    'seed-event-003',
    'seed-script',
    'system',
    '{"executionId":"seed-execution-001","clipIndex":2,"quantity":50000}',
    'Second clip executed.',
    1
  ),
  (
    'seed-event-005',
    NOW() - INTERVAL '12 hours',
    'ProposalGenerated',
    'Proposal',
    'seed-proposal-001',
    'seed-correlation-003',
    NULL,
    'seed-script',
    'user',
    '{"proposalId":"seed-proposal-001","accountId":"seed-account-001"}',
    'Optimization proposal generated.',
    1
  )
ON CONFLICT ("eventId") DO NOTHING;

COMMIT;

SELECT 'Seed data inserted' AS message;
