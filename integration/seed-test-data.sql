-- Seed Test Data for Integration Tests
-- Run this before running integration tests

-- Insert test household
INSERT INTO households ("householdId", name, "createdAt", "createdBy")
VALUES ('test-household-123', 'Test Household', NOW(), 'test-user')
ON CONFLICT ("householdId") DO NOTHING;

-- Insert test account
INSERT INTO accounts ("accountId", "householdId", name, "accountType", "createdAt", "createdBy")
VALUES ('test-account-123', 'test-household-123', 'Test Account', 'individual', NOW(), 'test-user')
ON CONFLICT ("accountId") DO NOTHING;

-- Insert test instrument (US Treasury Note)
INSERT INTO instruments (
  cusip, name, ticker, type, coupon, "issueDate", "maturityDate",
  "couponFrequency", "askModifiedDuration", "bidModifiedDuration",
  "askYieldToMaturity", "askPrice", "maturityType",
  "issuedAmount", "outstandingAmount", currency,
  "createdAt", "updatedAt"
)
VALUES (
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
)
ON CONFLICT (cusip) DO NOTHING;

-- Verify data was inserted
SELECT 'Test data seeded successfully' as message;
SELECT 'Households:', COUNT(*) FROM households WHERE "householdId" = 'test-household-123';
SELECT 'Accounts:', COUNT(*) FROM accounts WHERE "accountId" = 'test-account-123';
SELECT 'Instruments:', COUNT(*) FROM instruments WHERE cusip = '912810TM6';
