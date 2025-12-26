import {
  Order,
  OrderEvent,
  OrderFill,
  OrderWithDetails,
  OrderBatch,
  ComplianceResult,
  OrderState,
  ComplianceStatus,
  OrderSummary,
} from "./types";
import { accounts, households } from "../pms/mock-data";

// Sample instruments for orders
export const instruments = [
  { cusip: "912828ZT", description: "US Treasury 2.5% 2026", type: "note" },
  { cusip: "38376HRK", description: "Goldman Sachs 3.75% 2028", type: "bond" },
  { cusip: "46625HRL", description: "JPMorgan 4.125% 2030", type: "bond" },
  { cusip: "06051GHF", description: "Bank of America 4.5% 2032", type: "bond" },
  { cusip: "912828YV", description: "US Treasury 3.0% 2029", type: "note" },
  { cusip: "594918BQ", description: "Microsoft 3.5% 2035", type: "bond" },
  { cusip: "037833AK", description: "Apple 2.85% 2027", type: "bond" },
  { cusip: "91282CBC", description: "US Treasury 4.25% 2040", type: "bond" },
  { cusip: "17275RBP", description: "Cisco Systems 4.0% 2027", type: "bond" },
  { cusip: "68389XBQ", description: "Oracle Corp 3.25% 2030", type: "bond" },
];

// Generate compliance results
function generateComplianceResult(status: ComplianceStatus): ComplianceResult {
  const baseResult: ComplianceResult = {
    status,
    evaluatedAt: new Date(),
    rulesEvaluated: ["RULE-001", "RULE-002", "RULE-003"],
    warnings: [],
    blocks: [],
    explanation: "",
  };

  if (status === "PASS") {
    baseResult.explanation = "All compliance rules passed. Order may proceed.";
  } else if (status === "WARN") {
    baseResult.warnings = [
      {
        ruleId: "RULE-002",
        ruleName: "Concentration Limit",
        scope: "ACCOUNT",
        message: "This order would increase position concentration to 12%, approaching the 15% limit.",
        metrics: { currentConcentration: 8, projectedConcentration: 12, limit: 15 },
      },
    ];
    baseResult.explanation = "Order has warnings but may proceed with acknowledgment.";
  } else if (status === "BLOCK") {
    baseResult.blocks = [
      {
        ruleId: "RULE-001",
        ruleName: "Position Limit",
        scope: "GLOBAL",
        message: "This order would exceed the maximum position size of $500,000.",
        metrics: { currentPosition: 450000, orderValue: 100000, limit: 500000 },
      },
    ];
    baseResult.explanation = "Order blocked due to compliance violations.";
  }

  return baseResult;
}

// Sample orders
export const orders: Order[] = [
  // DRAFT orders (3)
  {
    orderId: "ord-001",
    accountId: "acc-001",
    instrumentId: "inst-001",
    cusip: "912828ZT",
    instrumentDescription: "US Treasury 2.5% 2026",
    side: "BUY",
    quantity: 50000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "DRAFT",
    createdAt: new Date("2024-12-24T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T09:00:00"),
    lastStateChangeAt: new Date("2024-12-24T09:00:00"),
    notes: "Initial position build",
  },
  {
    orderId: "ord-002",
    accountId: "acc-002",
    instrumentId: "inst-002",
    cusip: "38376HRK",
    instrumentDescription: "Goldman Sachs 3.75% 2028",
    side: "SELL",
    quantity: 25000,
    orderType: "LIMIT",
    limitPrice: 98.50,
    timeInForce: "DAY",
    state: "DRAFT",
    createdAt: new Date("2024-12-24T10:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T10:30:00"),
    lastStateChangeAt: new Date("2024-12-24T10:30:00"),
  },
  {
    orderId: "ord-003",
    accountId: "acc-003",
    instrumentId: "inst-003",
    cusip: "46625HRL",
    instrumentDescription: "JPMorgan 4.125% 2030",
    side: "BUY",
    quantity: 75000,
    orderType: "CURVE_RELATIVE",
    curveSpreadBp: 125,
    timeInForce: "DAY",
    state: "DRAFT",
    createdAt: new Date("2024-12-24T11:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T11:00:00"),
    lastStateChangeAt: new Date("2024-12-24T11:00:00"),
  },

  // APPROVAL_PENDING orders (6)
  {
    orderId: "ord-004",
    accountId: "acc-001",
    instrumentId: "inst-004",
    cusip: "06051GHF",
    instrumentDescription: "Bank of America 4.5% 2032",
    side: "BUY",
    quantity: 100000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-23T14:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-23T14:05:00"),
    lastStateChangeAt: new Date("2024-12-23T14:05:00"),
  },
  {
    orderId: "ord-005",
    accountId: "acc-002",
    instrumentId: "inst-005",
    cusip: "912828YV",
    instrumentDescription: "US Treasury 3.0% 2029",
    side: "BUY",
    quantity: 150000,
    orderType: "LIMIT",
    limitPrice: 97.25,
    timeInForce: "DAY",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("WARN"),
    createdAt: new Date("2024-12-23T15:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-23T15:35:00"),
    lastStateChangeAt: new Date("2024-12-23T15:35:00"),
  },
  {
    orderId: "ord-006",
    accountId: "acc-005",
    instrumentId: "inst-006",
    cusip: "594918BQ",
    instrumentDescription: "Microsoft 3.5% 2035",
    side: "SELL",
    quantity: 30000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-23T16:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-23T16:02:00"),
    lastStateChangeAt: new Date("2024-12-23T16:02:00"),
  },
  {
    orderId: "ord-007",
    accountId: "acc-007",
    instrumentId: "inst-001",
    cusip: "912828ZT",
    instrumentDescription: "US Treasury 2.5% 2026",
    side: "BUY",
    quantity: 200000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("BLOCK"),
    createdAt: new Date("2024-12-24T08:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T08:01:00"),
    lastStateChangeAt: new Date("2024-12-24T08:01:00"),
  },
  {
    orderId: "ord-008",
    accountId: "acc-003",
    instrumentId: "inst-007",
    cusip: "037833AK",
    instrumentDescription: "Apple 2.85% 2027",
    side: "BUY",
    quantity: 60000,
    orderType: "LIMIT",
    limitPrice: 99.00,
    timeInForce: "IOC",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("PASS"),
    batchId: "batch-001",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T09:32:00"),
    lastStateChangeAt: new Date("2024-12-24T09:32:00"),
  },
  {
    orderId: "ord-009",
    accountId: "acc-008",
    instrumentId: "inst-003",
    cusip: "46625HRL",
    instrumentDescription: "JPMorgan 4.125% 2030",
    side: "SELL",
    quantity: 40000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVAL_PENDING",
    complianceResult: generateComplianceResult("WARN"),
    batchId: "batch-001",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T09:32:00"),
    lastStateChangeAt: new Date("2024-12-24T09:32:00"),
  },

  // APPROVED orders (5)
  {
    orderId: "ord-010",
    accountId: "acc-001",
    instrumentId: "inst-008",
    cusip: "91282CBC",
    instrumentDescription: "US Treasury 4.25% 2040",
    side: "BUY",
    quantity: 80000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-22T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-22T11:00:00"),
    lastStateChangeAt: new Date("2024-12-22T11:00:00"),
  },
  {
    orderId: "ord-011",
    accountId: "acc-004",
    instrumentId: "inst-009",
    cusip: "17275RBP",
    instrumentDescription: "Cisco Systems 4.0% 2027",
    side: "SELL",
    quantity: 35000,
    orderType: "LIMIT",
    limitPrice: 99.50,
    timeInForce: "DAY",
    state: "APPROVED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-22T13:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-22T14:30:00"),
    lastStateChangeAt: new Date("2024-12-22T14:30:00"),
  },
  {
    orderId: "ord-012",
    accountId: "acc-006",
    instrumentId: "inst-002",
    cusip: "38376HRK",
    instrumentDescription: "Goldman Sachs 3.75% 2028",
    side: "BUY",
    quantity: 45000,
    orderType: "CURVE_RELATIVE",
    curveSpreadBp: 85,
    timeInForce: "DAY",
    state: "APPROVED",
    complianceResult: generateComplianceResult("WARN"),
    batchId: "batch-001",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T10:00:00"),
    lastStateChangeAt: new Date("2024-12-24T10:00:00"),
  },
  {
    orderId: "ord-013",
    accountId: "acc-009",
    instrumentId: "inst-010",
    cusip: "68389XBQ",
    instrumentDescription: "Oracle Corp 3.25% 2030",
    side: "BUY",
    quantity: 55000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "APPROVED",
    complianceResult: generateComplianceResult("PASS"),
    batchId: "batch-001",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T10:00:00"),
    lastStateChangeAt: new Date("2024-12-24T10:00:00"),
  },
  {
    orderId: "ord-014",
    accountId: "acc-010",
    instrumentId: "inst-001",
    cusip: "912828ZT",
    instrumentDescription: "US Treasury 2.5% 2026",
    side: "SELL",
    quantity: 70000,
    orderType: "LIMIT",
    limitPrice: 99.75,
    timeInForce: "DAY",
    state: "APPROVED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-23T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-23T10:30:00"),
    lastStateChangeAt: new Date("2024-12-23T10:30:00"),
  },

  // SENT orders (4)
  {
    orderId: "ord-015",
    accountId: "acc-001",
    instrumentId: "inst-005",
    cusip: "912828YV",
    instrumentDescription: "US Treasury 3.0% 2029",
    side: "BUY",
    quantity: 120000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "SENT",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-21T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-21T11:00:00"),
    lastStateChangeAt: new Date("2024-12-21T11:00:00"),
    sentToEmsAt: new Date("2024-12-21T11:00:00"),
  },
  {
    orderId: "ord-016",
    accountId: "acc-002",
    instrumentId: "inst-008",
    cusip: "91282CBC",
    instrumentDescription: "US Treasury 4.25% 2040",
    side: "BUY",
    quantity: 90000,
    orderType: "LIMIT",
    limitPrice: 93.50,
    timeInForce: "DAY",
    state: "SENT",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-21T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-21T12:00:00"),
    lastStateChangeAt: new Date("2024-12-21T12:00:00"),
    sentToEmsAt: new Date("2024-12-21T12:00:00"),
  },
  {
    orderId: "ord-017",
    accountId: "acc-005",
    instrumentId: "inst-004",
    cusip: "06051GHF",
    instrumentDescription: "Bank of America 4.5% 2032",
    side: "SELL",
    quantity: 50000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "SENT",
    complianceResult: generateComplianceResult("PASS"),
    batchId: "batch-001",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-24T10:30:00"),
    lastStateChangeAt: new Date("2024-12-24T10:30:00"),
    sentToEmsAt: new Date("2024-12-24T10:30:00"),
  },
  {
    orderId: "ord-018",
    accountId: "acc-003",
    instrumentId: "inst-006",
    cusip: "594918BQ",
    instrumentDescription: "Microsoft 3.5% 2035",
    side: "BUY",
    quantity: 65000,
    orderType: "CURVE_RELATIVE",
    curveSpreadBp: 100,
    timeInForce: "DAY",
    state: "SENT",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-20T14:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-20T15:00:00"),
    lastStateChangeAt: new Date("2024-12-20T15:00:00"),
    sentToEmsAt: new Date("2024-12-20T15:00:00"),
  },

  // PARTIALLY_FILLED orders (3)
  {
    orderId: "ord-019",
    accountId: "acc-001",
    instrumentId: "inst-002",
    cusip: "38376HRK",
    instrumentDescription: "Goldman Sachs 3.75% 2028",
    side: "BUY",
    quantity: 100000,
    orderType: "LIMIT",
    limitPrice: 97.50,
    timeInForce: "DAY",
    state: "PARTIALLY_FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-19T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-19T14:00:00"),
    lastStateChangeAt: new Date("2024-12-19T14:00:00"),
    sentToEmsAt: new Date("2024-12-19T11:00:00"),
  },
  {
    orderId: "ord-020",
    accountId: "acc-004",
    instrumentId: "inst-003",
    cusip: "46625HRL",
    instrumentDescription: "JPMorgan 4.125% 2030",
    side: "SELL",
    quantity: 80000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "PARTIALLY_FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-18T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-18T15:00:00"),
    lastStateChangeAt: new Date("2024-12-18T15:00:00"),
    sentToEmsAt: new Date("2024-12-18T10:00:00"),
  },
  {
    orderId: "ord-021",
    accountId: "acc-007",
    instrumentId: "inst-009",
    cusip: "17275RBP",
    instrumentDescription: "Cisco Systems 4.0% 2027",
    side: "BUY",
    quantity: 60000,
    orderType: "LIMIT",
    limitPrice: 99.00,
    timeInForce: "DAY",
    state: "PARTIALLY_FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-17T11:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-17T16:00:00"),
    lastStateChangeAt: new Date("2024-12-17T16:00:00"),
    sentToEmsAt: new Date("2024-12-17T12:00:00"),
  },

  // FILLED orders (4)
  {
    orderId: "ord-022",
    accountId: "acc-001",
    instrumentId: "inst-001",
    cusip: "912828ZT",
    instrumentDescription: "US Treasury 2.5% 2026",
    side: "BUY",
    quantity: 150000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-16T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-16T11:00:00"),
    lastStateChangeAt: new Date("2024-12-16T11:00:00"),
    sentToEmsAt: new Date("2024-12-16T09:30:00"),
    fullyFilledAt: new Date("2024-12-16T11:00:00"),
  },
  {
    orderId: "ord-023",
    accountId: "acc-002",
    instrumentId: "inst-004",
    cusip: "06051GHF",
    instrumentDescription: "Bank of America 4.5% 2032",
    side: "SELL",
    quantity: 40000,
    orderType: "LIMIT",
    limitPrice: 96.00,
    timeInForce: "DAY",
    state: "FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-15T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-15T14:00:00"),
    lastStateChangeAt: new Date("2024-12-15T14:00:00"),
    sentToEmsAt: new Date("2024-12-15T10:30:00"),
    fullyFilledAt: new Date("2024-12-15T14:00:00"),
  },
  {
    orderId: "ord-024",
    accountId: "acc-005",
    instrumentId: "inst-007",
    cusip: "037833AK",
    instrumentDescription: "Apple 2.85% 2027",
    side: "BUY",
    quantity: 85000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-14T11:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-14T12:30:00"),
    lastStateChangeAt: new Date("2024-12-14T12:30:00"),
    sentToEmsAt: new Date("2024-12-14T11:15:00"),
    fullyFilledAt: new Date("2024-12-14T12:30:00"),
  },
  {
    orderId: "ord-025",
    accountId: "acc-008",
    instrumentId: "inst-010",
    cusip: "68389XBQ",
    instrumentDescription: "Oracle Corp 3.25% 2030",
    side: "SELL",
    quantity: 30000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "FILLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-13T14:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-13T15:00:00"),
    lastStateChangeAt: new Date("2024-12-13T15:00:00"),
    sentToEmsAt: new Date("2024-12-13T14:15:00"),
    fullyFilledAt: new Date("2024-12-13T15:00:00"),
  },

  // SETTLED orders (3)
  {
    orderId: "ord-026",
    accountId: "acc-001",
    instrumentId: "inst-005",
    cusip: "912828YV",
    instrumentDescription: "US Treasury 3.0% 2029",
    side: "BUY",
    quantity: 200000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "SETTLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-10T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-12T16:00:00"),
    lastStateChangeAt: new Date("2024-12-12T16:00:00"),
    sentToEmsAt: new Date("2024-12-10T09:30:00"),
    fullyFilledAt: new Date("2024-12-10T11:00:00"),
    settledAt: new Date("2024-12-12T16:00:00"),
  },
  {
    orderId: "ord-027",
    accountId: "acc-003",
    instrumentId: "inst-002",
    cusip: "38376HRK",
    instrumentDescription: "Goldman Sachs 3.75% 2028",
    side: "SELL",
    quantity: 50000,
    orderType: "LIMIT",
    limitPrice: 98.00,
    timeInForce: "DAY",
    state: "SETTLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-09T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-11T16:00:00"),
    lastStateChangeAt: new Date("2024-12-11T16:00:00"),
    sentToEmsAt: new Date("2024-12-09T10:30:00"),
    fullyFilledAt: new Date("2024-12-09T14:00:00"),
    settledAt: new Date("2024-12-11T16:00:00"),
  },
  {
    orderId: "ord-028",
    accountId: "acc-006",
    instrumentId: "inst-008",
    cusip: "91282CBC",
    instrumentDescription: "US Treasury 4.25% 2040",
    side: "BUY",
    quantity: 100000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "SETTLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-08T11:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-10T16:00:00"),
    lastStateChangeAt: new Date("2024-12-10T16:00:00"),
    sentToEmsAt: new Date("2024-12-08T11:30:00"),
    fullyFilledAt: new Date("2024-12-08T13:00:00"),
    settledAt: new Date("2024-12-10T16:00:00"),
  },

  // CANCELLED orders (2)
  {
    orderId: "ord-029",
    accountId: "acc-002",
    instrumentId: "inst-006",
    cusip: "594918BQ",
    instrumentDescription: "Microsoft 3.5% 2035",
    side: "BUY",
    quantity: 75000,
    orderType: "LIMIT",
    limitPrice: 95.00,
    timeInForce: "DAY",
    state: "CANCELLED",
    complianceResult: generateComplianceResult("PASS"),
    createdAt: new Date("2024-12-20T09:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-20T16:00:00"),
    lastStateChangeAt: new Date("2024-12-20T16:00:00"),
  },
  {
    orderId: "ord-030",
    accountId: "acc-004",
    instrumentId: "inst-001",
    cusip: "912828ZT",
    instrumentDescription: "US Treasury 2.5% 2026",
    side: "SELL",
    quantity: 45000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "CANCELLED",
    createdAt: new Date("2024-12-19T14:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-19T14:30:00"),
    lastStateChangeAt: new Date("2024-12-19T14:30:00"),
  },

  // REJECTED orders (2)
  {
    orderId: "ord-031",
    accountId: "acc-007",
    instrumentId: "inst-003",
    cusip: "46625HRL",
    instrumentDescription: "JPMorgan 4.125% 2030",
    side: "BUY",
    quantity: 500000,
    orderType: "MARKET",
    timeInForce: "DAY",
    state: "REJECTED",
    complianceResult: generateComplianceResult("BLOCK"),
    createdAt: new Date("2024-12-18T11:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-18T11:30:00"),
    lastStateChangeAt: new Date("2024-12-18T11:30:00"),
  },
  {
    orderId: "ord-032",
    accountId: "acc-009",
    instrumentId: "inst-004",
    cusip: "06051GHF",
    instrumentDescription: "Bank of America 4.5% 2032",
    side: "SELL",
    quantity: 300000,
    orderType: "LIMIT",
    limitPrice: 97.00,
    timeInForce: "DAY",
    state: "REJECTED",
    complianceResult: generateComplianceResult("BLOCK"),
    createdAt: new Date("2024-12-17T10:00:00"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-12-17T10:15:00"),
    lastStateChangeAt: new Date("2024-12-17T10:15:00"),
  },
];

// Sample fills
export const orderFills: OrderFill[] = [
  // Fills for ord-019 (PARTIALLY_FILLED - 60k of 100k)
  { fillId: "fill-001", orderId: "ord-019", quantity: 35000, price: 97.45, timestamp: new Date("2024-12-19T12:00:00") },
  { fillId: "fill-002", orderId: "ord-019", quantity: 25000, price: 97.48, timestamp: new Date("2024-12-19T14:00:00") },

  // Fills for ord-020 (PARTIALLY_FILLED - 50k of 80k)
  { fillId: "fill-003", orderId: "ord-020", quantity: 30000, price: 97.00, timestamp: new Date("2024-12-18T11:00:00") },
  { fillId: "fill-004", orderId: "ord-020", quantity: 20000, price: 96.95, timestamp: new Date("2024-12-18T15:00:00") },

  // Fills for ord-021 (PARTIALLY_FILLED - 40k of 60k)
  { fillId: "fill-005", orderId: "ord-021", quantity: 25000, price: 98.90, timestamp: new Date("2024-12-17T14:00:00") },
  { fillId: "fill-006", orderId: "ord-021", quantity: 15000, price: 98.95, timestamp: new Date("2024-12-17T16:00:00") },

  // Fills for ord-022 (FILLED)
  { fillId: "fill-007", orderId: "ord-022", quantity: 100000, price: 99.20, timestamp: new Date("2024-12-16T10:00:00") },
  { fillId: "fill-008", orderId: "ord-022", quantity: 50000, price: 99.22, timestamp: new Date("2024-12-16T11:00:00") },

  // Fills for ord-023 (FILLED)
  { fillId: "fill-009", orderId: "ord-023", quantity: 40000, price: 96.10, timestamp: new Date("2024-12-15T14:00:00") },

  // Fills for ord-024 (FILLED)
  { fillId: "fill-010", orderId: "ord-024", quantity: 85000, price: 98.75, timestamp: new Date("2024-12-14T12:30:00") },

  // Fills for ord-025 (FILLED)
  { fillId: "fill-011", orderId: "ord-025", quantity: 30000, price: 96.80, timestamp: new Date("2024-12-13T15:00:00") },

  // Fills for settled orders
  { fillId: "fill-012", orderId: "ord-026", quantity: 200000, price: 97.65, timestamp: new Date("2024-12-10T11:00:00") },
  { fillId: "fill-013", orderId: "ord-027", quantity: 50000, price: 98.05, timestamp: new Date("2024-12-09T14:00:00") },
  { fillId: "fill-014", orderId: "ord-028", quantity: 100000, price: 93.40, timestamp: new Date("2024-12-08T13:00:00") },
];

// Sample order events
export const orderEvents: OrderEvent[] = [
  // Events for ord-022 (FILLED order with full history)
  { eventId: "evt-001", orderId: "ord-022", eventType: "ORDER_CREATED", timestamp: new Date("2024-12-16T09:00:00"), actor: "advisor@instant.com", details: "Order created for 150,000 par US Treasury 2.5% 2026" },
  { eventId: "evt-002", orderId: "ord-022", eventType: "ORDER_APPROVAL_REQUESTED", timestamp: new Date("2024-12-16T09:00:00"), actor: "advisor@instant.com", details: "Order submitted for approval" },
  { eventId: "evt-003", orderId: "ord-022", eventType: "ORDER_APPROVED", timestamp: new Date("2024-12-16T09:15:00"), actor: "manager@instant.com", details: "Order approved" },
  { eventId: "evt-004", orderId: "ord-022", eventType: "ORDER_SENT_TO_EMS", timestamp: new Date("2024-12-16T09:30:00"), actor: "advisor@instant.com", details: "Order sent to EMS for execution" },
  { eventId: "evt-005", orderId: "ord-022", eventType: "ORDER_PARTIALLY_FILLED", timestamp: new Date("2024-12-16T10:00:00"), actor: "system", details: "Filled 100,000 @ 99.20" },
  { eventId: "evt-006", orderId: "ord-022", eventType: "ORDER_FULLY_FILLED", timestamp: new Date("2024-12-16T11:00:00"), actor: "system", details: "Filled 50,000 @ 99.22. Order fully filled." },

  // Events for ord-004 (APPROVAL_PENDING)
  { eventId: "evt-007", orderId: "ord-004", eventType: "ORDER_CREATED", timestamp: new Date("2024-12-23T14:00:00"), actor: "advisor@instant.com", details: "Order created for 100,000 par Bank of America 4.5% 2032" },
  { eventId: "evt-008", orderId: "ord-004", eventType: "ORDER_APPROVAL_REQUESTED", timestamp: new Date("2024-12-23T14:05:00"), actor: "advisor@instant.com", details: "Order submitted for approval" },

  // Events for ord-029 (CANCELLED)
  { eventId: "evt-009", orderId: "ord-029", eventType: "ORDER_CREATED", timestamp: new Date("2024-12-20T09:00:00"), actor: "advisor@instant.com", details: "Order created for 75,000 par Microsoft 3.5% 2035" },
  { eventId: "evt-010", orderId: "ord-029", eventType: "ORDER_APPROVAL_REQUESTED", timestamp: new Date("2024-12-20T09:05:00"), actor: "advisor@instant.com", details: "Order submitted for approval" },
  { eventId: "evt-011", orderId: "ord-029", eventType: "ORDER_APPROVED", timestamp: new Date("2024-12-20T10:00:00"), actor: "manager@instant.com", details: "Order approved" },
  { eventId: "evt-012", orderId: "ord-029", eventType: "ORDER_CANCELLED", timestamp: new Date("2024-12-20T16:00:00"), actor: "advisor@instant.com", details: "Order cancelled by user" },
];

// Sample batches
export const orderBatches: OrderBatch[] = [
  {
    batchId: "batch-001",
    orderCount: 6,
    successCount: 6,
    errorCount: 0,
    status: "COMPLETED",
    createdAt: new Date("2024-12-24T09:30:00"),
    createdBy: "advisor@instant.com",
  },
];

// Helper functions
export function getOrderWithDetails(orderId: string): OrderWithDetails | null {
  const order = orders.find((o) => o.orderId === orderId);
  if (!order) return null;

  const account = accounts.find((a) => a.accountId === order.accountId);
  const household = account ? households.find((h) => h.householdId === account.householdId) : null;
  const fills = orderFills.filter((f) => f.orderId === orderId);
  const events = orderEvents.filter((e) => e.orderId === orderId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const filledQuantity = fills.reduce((sum, f) => sum + f.quantity, 0);
  const averageFillPrice = fills.length > 0
    ? fills.reduce((sum, f) => sum + f.price * f.quantity, 0) / filledQuantity
    : undefined;

  return {
    ...order,
    accountName: account?.name || "Unknown Account",
    householdId: household?.householdId || "",
    householdName: household?.name || "Unknown Household",
    fills,
    events,
    filledQuantity,
    remainingQuantity: order.quantity - filledQuantity,
    averageFillPrice,
    estimatedPnL: fills.length > 0 ? Math.round((Math.random() - 0.5) * 5000) : undefined,
  };
}

export function getOrdersWithDetails(): OrderWithDetails[] {
  return orders.map((order) => getOrderWithDetails(order.orderId)!);
}

export function getOrdersByBatch(batchId: string): Order[] {
  return orders.filter((o) => o.batchId === batchId);
}

export function getOrderSummary(): OrderSummary {
  const byState: Record<OrderState, number> = {
    DRAFT: 0,
    STAGED: 0,
    APPROVAL_PENDING: 0,
    APPROVED: 0,
    SENT: 0,
    PARTIALLY_FILLED: 0,
    FILLED: 0,
    CANCELLED: 0,
    REJECTED: 0,
    SETTLED: 0,
  };

  const byComplianceStatus: Record<ComplianceStatus, number> = {
    PASS: 0,
    WARN: 0,
    BLOCK: 0,
    PENDING: 0,
  };

  let totalQuantity = 0;
  let totalFilledQuantity = 0;

  orders.forEach((order) => {
    byState[order.state]++;
    if (order.complianceResult) {
      byComplianceStatus[order.complianceResult.status]++;
    }
    totalQuantity += order.quantity;

    const fills = orderFills.filter((f) => f.orderId === order.orderId);
    totalFilledQuantity += fills.reduce((sum, f) => sum + f.quantity, 0);
  });

  return {
    total: orders.length,
    byState,
    byComplianceStatus,
    totalQuantity,
    totalFilledQuantity,
  };
}

export function formatOrderQuantity(quantity: number): string {
  if (quantity >= 1000000) {
    return `${(quantity / 1000000).toFixed(1)}M`;
  }
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(0)}K`;
  }
  return quantity.toString();
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function getStateColor(state: OrderState): string {
  switch (state) {
    case "DRAFT":
    case "STAGED":
      return "bg-gray-100 text-gray-800";
    case "APPROVAL_PENDING":
      return "bg-blue-100 text-blue-800";
    case "APPROVED":
      return "bg-indigo-100 text-indigo-800";
    case "SENT":
      return "bg-cyan-100 text-cyan-800";
    case "PARTIALLY_FILLED":
      return "bg-amber-100 text-amber-800";
    case "FILLED":
      return "bg-green-100 text-green-800";
    case "SETTLED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getComplianceColor(status: ComplianceStatus): string {
  switch (status) {
    case "PASS":
      return "bg-green-100 text-green-800";
    case "WARN":
      return "bg-yellow-100 text-yellow-800";
    case "BLOCK":
      return "bg-red-100 text-red-800";
    case "PENDING":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
