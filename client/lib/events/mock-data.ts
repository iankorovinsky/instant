import type {
  Event,
  EventTimelineItem,
  EventModule,
  AggregateType,
  ActorRole,
  EventFilters,
  EventStatistics,
  EventRelationship,
  MODULE_CONFIG,
  AGGREGATE_CONFIG,
} from "./types";

// Helper to generate UUIDs
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to get module from event type
export function getModuleFromEventType(eventType: string): EventModule {
  if (eventType.startsWith("MarketData") || eventType.startsWith("Instrument") || eventType.startsWith("Curve")) {
    return "marketdata";
  }
  if (eventType.startsWith("Evaluated") || eventType.startsWith("Risk") || eventType.startsWith("Pricing")) {
    return "pricing";
  }
  if (eventType.startsWith("Order") && !eventType.includes("Execution")) {
    return "oms";
  }
  if (eventType.startsWith("Execution") || eventType.startsWith("Fill") || eventType.startsWith("Slippage")) {
    return "ems";
  }
  if (eventType.startsWith("Account") || eventType.startsWith("Household") || eventType.startsWith("Proposal") ||
      eventType.startsWith("Target") || eventType.startsWith("Drift") || eventType.startsWith("Rebalance")) {
    return "pms";
  }
  if (eventType.startsWith("Rule") || eventType.startsWith("Violation") || eventType.startsWith("Compliance")) {
    return "compliance";
  }
  if (eventType.startsWith("AI") || eventType.startsWith("Copilot")) {
    return "copilot";
  }
  return "oms";
}

// Helper to generate summary from event
function generateSummary(eventType: string, payload: Record<string, unknown>): string {
  switch (eventType) {
    case "OrderCreated":
      return `${payload.side} ${payload.quantity} ${payload.cusip}`;
    case "OrderApproved":
      return `Order approved by ${payload.approvedBy}`;
    case "OrderRejected":
      return `Order rejected: ${payload.reason}`;
    case "OrderSentToEMS":
      return `Sent to execution`;
    case "FillGenerated":
      return `Filled ${payload.fillQty} @ ${payload.fillPrice}`;
    case "ExecutionRequested":
      return `Execution requested for ${payload.quantity} shares`;
    case "ProposalGenerated":
      return `${payload.tradeCount} trades proposed`;
    case "RuleEvaluated":
      return `Rule ${payload.ruleId}: ${payload.result}`;
    case "ViolationDetected":
      return `${payload.severity} violation: ${payload.ruleName}`;
    case "MarketDataCurveIngested":
      return `Yield curve for ${payload.asOfDate}`;
    case "EvaluatedPriceComputed":
      return `${payload.cusip}: ${payload.cleanPrice}`;
    case "AccountCreated":
      return `Account ${payload.accountName} created`;
    case "AIDraftProposed":
      return `AI proposed ${payload.actionCount} actions`;
    default:
      return eventType.replace(/([A-Z])/g, " $1").trim();
  }
}

// Sample correlation chains (groups of related events)
const correlationChains = [
  generateUUID(), // Order creation flow 1
  generateUUID(), // Order creation flow 2
  generateUUID(), // Proposal approval flow
  generateUUID(), // Compliance check flow
  generateUUID(), // Market data ingestion flow
  generateUUID(), // Execution flow 1
  generateUUID(), // Execution flow 2
  generateUUID(), // Account setup flow
  generateUUID(), // Rebalance flow
  generateUUID(), // AI copilot flow
];

// Sample aggregate IDs
const orderIds = [generateUUID(), generateUUID(), generateUUID(), generateUUID(), generateUUID()];
const accountIds = [generateUUID(), generateUUID(), generateUUID()];
const householdIds = [generateUUID(), generateUUID()];
const proposalIds = [generateUUID(), generateUUID(), generateUUID()];
const executionIds = [generateUUID(), generateUUID(), generateUUID(), generateUUID()];
const ruleIds = [generateUUID(), generateUUID(), generateUUID()];
const instrumentCusips = ["912796XY2", "91282CJK5", "912810TV2", "912828YK6", "91282CJP4"];

// Sample actors
const actors = [
  { actorId: "user-001", role: "user" as ActorRole, name: "John Smith" },
  { actorId: "user-002", role: "user" as ActorRole, name: "Sarah Johnson" },
  { actorId: "system", role: "system" as ActorRole, name: "System" },
  { actorId: "copilot", role: "copilot" as ActorRole, name: "AI Copilot" },
  { actorId: "scheduler", role: "scheduler" as ActorRole, name: "Scheduler" },
];

// Base date for events (last 7 days)
const baseDate = new Date();
baseDate.setDate(baseDate.getDate() - 7);

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// Generate sample events
export const events: Event[] = [
  // === Market Data Events (Day 1) ===
  {
    eventId: generateUUID(),
    eventType: "MarketDataCurveIngested",
    occurredAt: addHours(baseDate, 6),
    actor: actors[2],
    aggregate: { type: "YieldCurve", id: generateUUID() },
    correlationId: correlationChains[4],
    causationId: null,
    payload: {
      asOfDate: "2024-01-15",
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-15.csv",
      curvePoints: 11,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "InstrumentIngested",
    occurredAt: addHours(baseDate, 6.5),
    actor: actors[2],
    aggregate: { type: "Instrument", id: instrumentCusips[0] },
    correlationId: correlationChains[4],
    causationId: null,
    payload: {
      cusip: instrumentCusips[0],
      name: "US Treasury Bill 03/21/2024",
      type: "bill",
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Pricing Events (Day 1) ===
  {
    eventId: generateUUID(),
    eventType: "EvaluatedPriceComputed",
    occurredAt: addHours(baseDate, 7),
    actor: actors[2],
    aggregate: { type: "Instrument", id: instrumentCusips[0] },
    correlationId: correlationChains[4],
    causationId: null,
    payload: {
      cusip: instrumentCusips[0],
      asOfDate: "2024-01-15",
      cleanPrice: 99.2345,
      yieldToMaturity: 5.35,
      modifiedDuration: 0.18,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RiskMetricsComputed",
    occurredAt: addHours(baseDate, 7.1),
    actor: actors[2],
    aggregate: { type: "Instrument", id: instrumentCusips[1] },
    correlationId: correlationChains[4],
    causationId: null,
    payload: {
      cusip: instrumentCusips[1],
      modifiedDuration: 1.85,
      dv01: 0.0185,
      convexity: 0.04,
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Account Setup Flow (Day 1-2) ===
  {
    eventId: generateUUID(),
    eventType: "AccountCreated",
    occurredAt: addHours(baseDate, 9),
    actor: actors[0],
    aggregate: { type: "Account", id: accountIds[0] },
    correlationId: correlationChains[7],
    causationId: null,
    payload: {
      accountId: accountIds[0],
      accountName: "Smith Family Trust",
      accountType: "Trust",
      taxStatus: "taxable",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "HouseholdCreated",
    occurredAt: addHours(baseDate, 9.5),
    actor: actors[0],
    aggregate: { type: "Household", id: householdIds[0] },
    correlationId: correlationChains[7],
    causationId: null,
    payload: {
      householdId: householdIds[0],
      householdName: "Smith Family",
      accountCount: 3,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "TargetSet",
    occurredAt: addHours(baseDate, 10),
    actor: actors[0],
    aggregate: { type: "Account", id: accountIds[0] },
    correlationId: correlationChains[7],
    causationId: null,
    payload: {
      modelId: "conservative-income",
      targetDuration: 5.5,
      targetAllocation: { bills: 20, notes: 50, bonds: 30 },
    },
    explanation: "Target allocation set based on client risk profile and income needs.",
    schemaVersion: 1,
  },

  // === Compliance Rule Setup (Day 2) ===
  {
    eventId: generateUUID(),
    eventType: "RuleCreated",
    occurredAt: addHours(baseDate, 24),
    actor: actors[1],
    aggregate: { type: "Rule", id: ruleIds[0] },
    correlationId: correlationChains[3],
    causationId: null,
    payload: {
      ruleId: ruleIds[0],
      ruleName: "Max Single Security Weight",
      severity: "high",
      scope: "account",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RuleActivated",
    occurredAt: addHours(baseDate, 24.5),
    actor: actors[1],
    aggregate: { type: "Rule", id: ruleIds[0] },
    correlationId: correlationChains[3],
    causationId: null,
    payload: {
      ruleId: ruleIds[0],
      effectiveDate: "2024-01-15",
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Order Creation Flow 1 (Day 3) ===
  {
    eventId: generateUUID(),
    eventType: "OrderCreated",
    occurredAt: addHours(baseDate, 48),
    actor: actors[0],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      accountId: accountIds[0],
      cusip: instrumentCusips[1],
      side: "buy",
      quantity: 100000,
      orderType: "market",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderValidated",
    occurredAt: addMinutes(addHours(baseDate, 48), 1),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      validationChecks: ["account_active", "sufficient_cash", "security_eligible"],
      allPassed: true,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RuleEvaluated",
    occurredAt: addMinutes(addHours(baseDate, 48), 2),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      ruleId: ruleIds[0],
      ruleName: "Max Single Security Weight",
      result: "passed",
      currentWeight: 8.5,
      threshold: 10,
    },
    explanation: "Order passes concentration limit check. Current weight 8.5% is below 10% threshold.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ComplianceCheckPassed",
    occurredAt: addMinutes(addHours(baseDate, 48), 3),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      rulesEvaluated: 5,
      rulesPassed: 5,
      rulesFailed: 0,
    },
    explanation: "All 5 compliance rules passed for this order.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderApproved",
    occurredAt: addMinutes(addHours(baseDate, 48), 10),
    actor: actors[1],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      approvedBy: "Sarah Johnson",
      approvalLevel: "senior_trader",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderSentToEMS",
    occurredAt: addMinutes(addHours(baseDate, 48), 11),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      executionId: executionIds[0],
      routedTo: "primary_broker",
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Execution Flow 1 (Day 3) ===
  {
    eventId: generateUUID(),
    eventType: "ExecutionRequested",
    occurredAt: addMinutes(addHours(baseDate, 48), 12),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      orderId: orderIds[0],
      cusip: instrumentCusips[1],
      quantity: 100000,
      algorithm: "TWAP",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ExecutionStarted",
    occurredAt: addMinutes(addHours(baseDate, 48), 13),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      startTime: addMinutes(addHours(baseDate, 48), 13).toISOString(),
      estimatedDuration: "30 minutes",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "FillGenerated",
    occurredAt: addMinutes(addHours(baseDate, 48), 20),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      fillId: generateUUID(),
      fillQty: 25000,
      fillPrice: 99.875,
      venue: "NYSE",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "FillGenerated",
    occurredAt: addMinutes(addHours(baseDate, 48), 28),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      fillId: generateUUID(),
      fillQty: 35000,
      fillPrice: 99.89,
      venue: "NASDAQ",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "FillGenerated",
    occurredAt: addMinutes(addHours(baseDate, 48), 38),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      fillId: generateUUID(),
      fillQty: 40000,
      fillPrice: 99.88,
      venue: "BATS",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderFullyFilled",
    occurredAt: addMinutes(addHours(baseDate, 48), 40),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      orderId: orderIds[0],
      totalFills: 3,
      avgPrice: 99.8817,
      totalQuantity: 100000,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "SlippageComputed",
    occurredAt: addMinutes(addHours(baseDate, 48), 41),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[0] },
    correlationId: correlationChains[5],
    causationId: null,
    payload: {
      executionId: executionIds[0],
      arrivalPrice: 99.85,
      avgFillPrice: 99.8817,
      slippageBps: 3.17,
      marketImpact: 1.5,
      timingCost: 1.2,
      spreadCost: 0.47,
    },
    explanation: "Total slippage of 3.17 bps. Market impact (1.5 bps) driven by order size relative to ADV. Timing cost (1.2 bps) due to adverse price movement during execution window.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderCompleted",
    occurredAt: addMinutes(addHours(baseDate, 48), 42),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[0] },
    correlationId: correlationChains[0],
    causationId: null,
    payload: {
      orderId: orderIds[0],
      status: "filled",
      avgPrice: 99.8817,
      totalCost: 9988170,
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Order with Compliance Violation (Day 4) ===
  {
    eventId: generateUUID(),
    eventType: "OrderCreated",
    occurredAt: addHours(baseDate, 72),
    actor: actors[0],
    aggregate: { type: "Order", id: orderIds[1] },
    correlationId: correlationChains[1],
    causationId: null,
    payload: {
      orderId: orderIds[1],
      accountId: accountIds[1],
      cusip: instrumentCusips[2],
      side: "buy",
      quantity: 500000,
      orderType: "market",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RuleEvaluated",
    occurredAt: addMinutes(addHours(baseDate, 72), 2),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[1] },
    correlationId: correlationChains[1],
    causationId: null,
    payload: {
      orderId: orderIds[1],
      ruleId: ruleIds[0],
      ruleName: "Max Single Security Weight",
      result: "failed",
      currentWeight: 15.2,
      threshold: 10,
    },
    explanation: "Order FAILS concentration limit check. Resulting weight of 15.2% exceeds 10% threshold by 5.2 percentage points.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ViolationDetected",
    occurredAt: addMinutes(addHours(baseDate, 72), 3),
    actor: actors[2],
    aggregate: { type: "Rule", id: ruleIds[0] },
    correlationId: correlationChains[1],
    causationId: null,
    payload: {
      violationId: generateUUID(),
      orderId: orderIds[1],
      ruleId: ruleIds[0],
      ruleName: "Max Single Security Weight",
      severity: "high",
      breachAmount: 5.2,
    },
    explanation: "High severity violation: Order would result in 15.2% concentration in a single security, exceeding the 10% limit.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderBlockedByCompliance",
    occurredAt: addMinutes(addHours(baseDate, 72), 4),
    actor: actors[2],
    aggregate: { type: "Order", id: orderIds[1] },
    correlationId: correlationChains[1],
    causationId: null,
    payload: {
      orderId: orderIds[1],
      blockingRules: ["Max Single Security Weight"],
      canOverride: true,
      overrideLevel: "compliance_officer",
    },
    explanation: "Order blocked due to concentration limit violation. Requires compliance officer override to proceed.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderRejected",
    occurredAt: addMinutes(addHours(baseDate, 72), 30),
    actor: actors[1],
    aggregate: { type: "Order", id: orderIds[1] },
    correlationId: correlationChains[1],
    causationId: null,
    payload: {
      orderId: orderIds[1],
      reason: "Compliance violation - concentration limit exceeded",
      rejectedBy: "Sarah Johnson",
    },
    explanation: "Order rejected by senior trader due to unresolved compliance violation.",
    schemaVersion: 1,
  },

  // === Proposal Generation Flow (Day 5) ===
  {
    eventId: generateUUID(),
    eventType: "DriftCalculated",
    occurredAt: addHours(baseDate, 96),
    actor: actors[4],
    aggregate: { type: "Account", id: accountIds[0] },
    correlationId: correlationChains[8],
    causationId: null,
    payload: {
      accountId: accountIds[0],
      driftScore: 4.2,
      driftThreshold: 3.0,
      triggerRebalance: true,
    },
    explanation: "Account drift score (4.2%) exceeds threshold (3.0%). Triggering rebalance proposal generation.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RebalanceTriggered",
    occurredAt: addMinutes(addHours(baseDate, 96), 1),
    actor: actors[2],
    aggregate: { type: "Account", id: accountIds[0] },
    correlationId: correlationChains[8],
    causationId: null,
    payload: {
      accountId: accountIds[0],
      triggerType: "drift",
      driftScore: 4.2,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ProposalGenerated",
    occurredAt: addMinutes(addHours(baseDate, 96), 5),
    actor: actors[2],
    aggregate: { type: "Proposal", id: proposalIds[0] },
    correlationId: correlationChains[8],
    causationId: null,
    payload: {
      proposalId: proposalIds[0],
      accountId: accountIds[0],
      tradeCount: 5,
      totalNotional: 250000,
      expectedDriftReduction: 3.8,
    },
    explanation: "Generated 5 trades totaling $250,000 to reduce drift from 4.2% to 0.4%. Optimization minimized trading costs while achieving target allocation.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ProposalApproved",
    occurredAt: addMinutes(addHours(baseDate, 96), 60),
    actor: actors[0],
    aggregate: { type: "Proposal", id: proposalIds[0] },
    correlationId: correlationChains[8],
    causationId: null,
    payload: {
      proposalId: proposalIds[0],
      approvedBy: "John Smith",
      modifications: [],
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === AI Copilot Flow (Day 6) ===
  {
    eventId: generateUUID(),
    eventType: "CopilotSuggestionGenerated",
    occurredAt: addHours(baseDate, 120),
    actor: actors[3],
    aggregate: { type: "Account", id: accountIds[2] },
    correlationId: correlationChains[9],
    causationId: null,
    payload: {
      accountId: accountIds[2],
      suggestionType: "rebalance",
      confidence: 0.85,
      reason: "duration_drift",
    },
    explanation: "AI detected portfolio duration (6.2y) significantly exceeds target (5.0y). Suggesting rebalance to reduce interest rate risk.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "AIDraftProposed",
    occurredAt: addMinutes(addHours(baseDate, 120), 2),
    actor: actors[3],
    aggregate: { type: "Proposal", id: proposalIds[1] },
    correlationId: correlationChains[9],
    causationId: null,
    payload: {
      proposalId: proposalIds[1],
      accountId: accountIds[2],
      actionCount: 3,
      actions: [
        { type: "sell", cusip: instrumentCusips[2], quantity: 50000 },
        { type: "buy", cusip: instrumentCusips[0], quantity: 30000 },
        { type: "buy", cusip: instrumentCusips[1], quantity: 20000 },
      ],
    },
    explanation: "AI proposes selling long-duration bonds and purchasing shorter-duration securities to reduce portfolio duration from 6.2y to 5.1y.",
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "AIDraftModified",
    occurredAt: addMinutes(addHours(baseDate, 120), 30),
    actor: actors[0],
    aggregate: { type: "Proposal", id: proposalIds[1] },
    correlationId: correlationChains[9],
    causationId: null,
    payload: {
      proposalId: proposalIds[1],
      modifications: [
        { field: "actions[0].quantity", from: 50000, to: 40000 },
      ],
      reason: "Reduced sell quantity to maintain yield",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "AIDraftApproved",
    occurredAt: addMinutes(addHours(baseDate, 120), 45),
    actor: actors[0],
    aggregate: { type: "Proposal", id: proposalIds[1] },
    correlationId: correlationChains[9],
    causationId: null,
    payload: {
      proposalId: proposalIds[1],
      approvedBy: "John Smith",
      finalActionCount: 3,
    },
    explanation: "User approved AI-generated proposal with minor modifications.",
    schemaVersion: 1,
  },

  // === More Market Data Events (Day 6-7) ===
  {
    eventId: generateUUID(),
    eventType: "MarketDataCurveIngested",
    occurredAt: addHours(baseDate, 126),
    actor: actors[2],
    aggregate: { type: "YieldCurve", id: generateUUID() },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      asOfDate: "2024-01-16",
      sourceUrl: "https://treasury.gov/yield-curve-2024-01-16.csv",
      curvePoints: 11,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "PricingBatchCompleted",
    occurredAt: addHours(baseDate, 127),
    actor: actors[2],
    aggregate: { type: "Instrument", id: "batch-001" },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      batchId: "batch-001",
      asOfDate: "2024-01-16",
      instrumentsProcessed: 35,
      successCount: 35,
      failureCount: 0,
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Additional Order Events (Day 7) ===
  {
    eventId: generateUUID(),
    eventType: "OrderCreated",
    occurredAt: addHours(baseDate, 144),
    actor: actors[1],
    aggregate: { type: "Order", id: orderIds[2] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      orderId: orderIds[2],
      accountId: accountIds[0],
      cusip: instrumentCusips[3],
      side: "sell",
      quantity: 75000,
      orderType: "limit",
      limitPrice: 100.25,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderAmended",
    occurredAt: addMinutes(addHours(baseDate, 144), 15),
    actor: actors[1],
    aggregate: { type: "Order", id: orderIds[2] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      orderId: orderIds[2],
      amendedFields: ["limitPrice"],
      oldLimitPrice: 100.25,
      newLimitPrice: 100.15,
      reason: "Market moved against us",
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Account Updates (Day 7) ===
  {
    eventId: generateUUID(),
    eventType: "AccountUpdated",
    occurredAt: addHours(baseDate, 150),
    actor: actors[0],
    aggregate: { type: "Account", id: accountIds[0] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      accountId: accountIds[0],
      updatedFields: ["targetDuration"],
      oldTargetDuration: 5.5,
      newTargetDuration: 5.0,
      reason: "Client risk preference update",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "HouseholdUpdated",
    occurredAt: addHours(baseDate, 151),
    actor: actors[0],
    aggregate: { type: "Household", id: householdIds[0] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      householdId: householdIds[0],
      updatedFields: ["primaryContact"],
      reason: "Contact information update",
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === Additional Compliance Events ===
  {
    eventId: generateUUID(),
    eventType: "RuleCreated",
    occurredAt: addHours(baseDate, 152),
    actor: actors[1],
    aggregate: { type: "Rule", id: ruleIds[1] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      ruleId: ruleIds[1],
      ruleName: "Duration Limit",
      severity: "medium",
      scope: "account",
      metric: "modified_duration",
      operator: "<=",
      threshold: 8.0,
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "RuleUpdated",
    occurredAt: addHours(baseDate, 153),
    actor: actors[1],
    aggregate: { type: "Rule", id: ruleIds[1] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      ruleId: ruleIds[1],
      updatedFields: ["threshold"],
      oldThreshold: 8.0,
      newThreshold: 7.5,
    },
    explanation: null,
    schemaVersion: 1,
  },

  // === More Execution Events ===
  {
    eventId: generateUUID(),
    eventType: "ExecutionRequested",
    occurredAt: addHours(baseDate, 156),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[1] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      executionId: executionIds[1],
      orderId: orderIds[2],
      cusip: instrumentCusips[3],
      quantity: 75000,
      algorithm: "VWAP",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "ExecutionFailed",
    occurredAt: addHours(baseDate, 157),
    actor: actors[2],
    aggregate: { type: "Execution", id: executionIds[1] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      executionId: executionIds[1],
      reason: "Insufficient liquidity",
      filledQuantity: 30000,
      unfilledQuantity: 45000,
    },
    explanation: "Execution partially failed due to insufficient market liquidity. 30,000 of 75,000 shares filled before market close.",
    schemaVersion: 1,
  },

  // === Pricing Failure Event ===
  {
    eventId: generateUUID(),
    eventType: "PricingFailed",
    occurredAt: addHours(baseDate, 158),
    actor: actors[2],
    aggregate: { type: "Instrument", id: instrumentCusips[4] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      cusip: instrumentCusips[4],
      asOfDate: "2024-01-17",
      error: "Missing curve data for interpolation",
      fallbackUsed: true,
      fallbackDate: "2024-01-16",
    },
    explanation: "Pricing failed due to missing curve data. Using previous day's curve as fallback.",
    schemaVersion: 1,
  },

  // === Recent Events (Today) ===
  {
    eventId: generateUUID(),
    eventType: "OrderCreated",
    occurredAt: addHours(baseDate, 165),
    actor: actors[0],
    aggregate: { type: "Order", id: orderIds[3] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      orderId: orderIds[3],
      accountId: accountIds[1],
      cusip: instrumentCusips[0],
      side: "buy",
      quantity: 200000,
      orderType: "market",
    },
    explanation: null,
    schemaVersion: 1,
  },
  {
    eventId: generateUUID(),
    eventType: "OrderApproved",
    occurredAt: addMinutes(addHours(baseDate, 165), 5),
    actor: actors[1],
    aggregate: { type: "Order", id: orderIds[3] },
    correlationId: generateUUID(),
    causationId: null,
    payload: {
      orderId: orderIds[3],
      approvedBy: "Sarah Johnson",
      approvalLevel: "senior_trader",
    },
    explanation: null,
    schemaVersion: 1,
  },
];

// Convert events to timeline items
export function getTimelineEvents(): EventTimelineItem[] {
  return events.map((event) => ({
    ...event,
    module: getModuleFromEventType(event.eventType),
    summary: generateSummary(event.eventType, event.payload),
    hasExplanation: event.explanation !== null,
  })).sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}

// Get event by ID
export function getEventById(eventId: string): Event | undefined {
  return events.find((e) => e.eventId === eventId);
}

// Get events by filter
export function getFilteredEvents(filters: EventFilters): EventTimelineItem[] {
  let filtered = getTimelineEvents();

  if (filters.aggregateType?.length) {
    filtered = filtered.filter((e) => filters.aggregateType!.includes(e.aggregate.type));
  }

  if (filters.aggregateId) {
    filtered = filtered.filter((e) => e.aggregate.id === filters.aggregateId);
  }

  if (filters.correlationId) {
    filtered = filtered.filter((e) => e.correlationId === filters.correlationId);
  }

  if (filters.causationId) {
    filtered = filtered.filter((e) => e.causationId === filters.causationId);
  }

  if (filters.eventType?.length) {
    filtered = filtered.filter((e) => filters.eventType!.includes(e.eventType));
  }

  if (filters.module?.length) {
    filtered = filtered.filter((e) => filters.module!.includes(e.module));
  }

  if (filters.actorId) {
    filtered = filtered.filter((e) => e.actor.actorId === filters.actorId);
  }

  if (filters.actorRole?.length) {
    filtered = filtered.filter((e) => filters.actorRole!.includes(e.actor.role));
  }

  if (filters.dateFrom) {
    filtered = filtered.filter((e) => e.occurredAt >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    filtered = filtered.filter((e) => e.occurredAt <= filters.dateTo!);
  }

  if (filters.hasExplanation !== undefined) {
    filtered = filtered.filter((e) => e.hasExplanation === filters.hasExplanation);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.eventType.toLowerCase().includes(query) ||
        e.summary.toLowerCase().includes(query) ||
        (e.explanation?.toLowerCase().includes(query) ?? false) ||
        e.aggregate.id.toLowerCase().includes(query)
    );
  }

  return filtered;
}

// Get related events
export function getRelatedEvents(eventId: string): {
  correlationChain: EventTimelineItem[];
  causationChain: EventTimelineItem[];
  aggregateTimeline: EventTimelineItem[];
} {
  const event = getEventById(eventId);
  if (!event) {
    return { correlationChain: [], causationChain: [], aggregateTimeline: [] };
  }

  const allEvents = getTimelineEvents();

  const correlationChain = event.correlationId
    ? allEvents.filter((e) => e.correlationId === event.correlationId)
    : [];

  const causationChain: EventTimelineItem[] = [];
  let currentEvent = event;
  while (currentEvent.causationId) {
    const causeEvent = allEvents.find((e) => e.eventId === currentEvent.causationId);
    if (causeEvent) {
      causationChain.unshift(causeEvent);
      currentEvent = causeEvent;
    } else {
      break;
    }
  }

  const aggregateTimeline = allEvents.filter(
    (e) => e.aggregate.type === event.aggregate.type && e.aggregate.id === event.aggregate.id
  );

  return { correlationChain, causationChain, aggregateTimeline };
}

// Get event statistics
export function getEventStatistics(): EventStatistics {
  const allEvents = getTimelineEvents();

  const eventsByModule: Record<EventModule, number> = {
    marketdata: 0,
    pricing: 0,
    oms: 0,
    ems: 0,
    pms: 0,
    compliance: 0,
    copilot: 0,
  };

  const eventsByAggregateType: Record<AggregateType, number> = {
    Order: 0,
    Account: 0,
    Household: 0,
    Proposal: 0,
    Execution: 0,
    Rule: 0,
    Instrument: 0,
    YieldCurve: 0,
    Model: 0,
  };

  const hourCounts: Record<string, number> = {};
  const correlationIds = new Set<string>();
  const aggregates = new Set<string>();
  let eventsWithExplanations = 0;

  allEvents.forEach((event) => {
    eventsByModule[event.module]++;
    eventsByAggregateType[event.aggregate.type]++;

    const hour = event.occurredAt.toISOString().slice(0, 13);
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;

    if (event.correlationId) correlationIds.add(event.correlationId);
    aggregates.add(`${event.aggregate.type}:${event.aggregate.id}`);
    if (event.hasExplanation) eventsWithExplanations++;
  });

  const eventsByHour = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  return {
    totalEvents: allEvents.length,
    eventsByModule,
    eventsByAggregateType,
    eventsByHour,
    eventsWithExplanations,
    uniqueCorrelationIds: correlationIds.size,
    uniqueAggregates: aggregates.size,
  };
}

// Formatting helpers
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getModuleColor(module: EventModule): string {
  const colors: Record<EventModule, string> = {
    marketdata: "bg-blue-100 text-blue-800",
    pricing: "bg-cyan-100 text-cyan-800",
    oms: "bg-green-100 text-green-800",
    ems: "bg-purple-100 text-purple-800",
    pms: "bg-orange-100 text-orange-800",
    compliance: "bg-red-100 text-red-800",
    copilot: "bg-indigo-100 text-indigo-800",
  };
  return colors[module];
}

export function getModuleLabel(module: EventModule): string {
  const labels: Record<EventModule, string> = {
    marketdata: "Market Data",
    pricing: "Pricing",
    oms: "OMS",
    ems: "EMS",
    pms: "PMS",
    compliance: "Compliance",
    copilot: "Copilot",
  };
  return labels[module];
}

export function getAggregateColor(type: AggregateType): string {
  const colors: Record<AggregateType, string> = {
    Order: "bg-green-100 text-green-800",
    Account: "bg-blue-100 text-blue-800",
    Household: "bg-purple-100 text-purple-800",
    Proposal: "bg-orange-100 text-orange-800",
    Execution: "bg-cyan-100 text-cyan-800",
    Rule: "bg-red-100 text-red-800",
    Instrument: "bg-yellow-100 text-yellow-800",
    YieldCurve: "bg-teal-100 text-teal-800",
    Model: "bg-pink-100 text-pink-800",
  };
  return colors[type];
}
