import type {
  Rule,
  RuleVersion,
  Violation,
  Evaluation,
  ComplianceSummary,
  MetricInfo,
  OperatorInfo,
  RuleSeverity,
  RuleScope,
  RuleStatus,
  EvaluationPoint,
  EvaluationResult,
} from "./types";

// Metric definitions for the predicate builder
export const metricDefinitions: MetricInfo[] = [
  {
    id: "portfolio.duration",
    name: "Portfolio Duration",
    description: "Weighted average duration of the portfolio in years",
    category: "portfolio",
    valueType: "number",
    unit: "years",
  },
  {
    id: "portfolio.dv01",
    name: "Portfolio DV01",
    description: "Dollar value of a 01 basis point move",
    category: "portfolio",
    valueType: "currency",
    unit: "$",
  },
  {
    id: "portfolio.marketValue",
    name: "Portfolio Market Value",
    description: "Total market value of the portfolio",
    category: "portfolio",
    valueType: "currency",
    unit: "$",
  },
  {
    id: "portfolio.cash",
    name: "Portfolio Cash",
    description: "Cash balance in the portfolio",
    category: "portfolio",
    valueType: "currency",
    unit: "$",
  },
  {
    id: "portfolio.cashPercentage",
    name: "Cash Percentage",
    description: "Cash as a percentage of total portfolio value",
    category: "portfolio",
    valueType: "percentage",
    unit: "%",
  },
  {
    id: "position.quantity",
    name: "Position Quantity",
    description: "Quantity of a specific position",
    category: "position",
    valueType: "number",
  },
  {
    id: "position.marketValue",
    name: "Position Market Value",
    description: "Market value of a specific position",
    category: "position",
    valueType: "currency",
    unit: "$",
  },
  {
    id: "position.percentage",
    name: "Position Percentage",
    description: "Position as a percentage of portfolio",
    category: "position",
    valueType: "percentage",
    unit: "%",
  },
  {
    id: "order.quantity",
    name: "Order Quantity",
    description: "Quantity in the order",
    category: "order",
    valueType: "number",
  },
  {
    id: "order.value",
    name: "Order Value",
    description: "Total value of the order",
    category: "order",
    valueType: "currency",
    unit: "$",
  },
  {
    id: "order.side",
    name: "Order Side",
    description: "Buy or Sell",
    category: "order",
    valueType: "enum",
  },
];

// Operator definitions
export const operatorDefinitions: OperatorInfo[] = [
  { id: "<=", label: "Less than or equal", description: "Value must be at most threshold" },
  { id: ">=", label: "Greater than or equal", description: "Value must be at least threshold" },
  { id: "<", label: "Less than", description: "Value must be less than threshold" },
  { id: ">", label: "Greater than", description: "Value must exceed threshold" },
  { id: "==", label: "Equals", description: "Value must equal threshold" },
  { id: "!=", label: "Not equals", description: "Value must not equal threshold" },
  { id: "in", label: "In list", description: "Value must be in the specified list" },
];

// Sample rules
export const rules: Rule[] = [
  // Global rules (4)
  {
    ruleId: "rule-001",
    ruleKey: "MAX_DURATION_GLOBAL",
    name: "Maximum Portfolio Duration",
    description: "Prevents portfolios from exceeding maximum duration limit to manage interest rate risk",
    version: 2,
    severity: "BLOCK",
    scope: "GLOBAL",
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 8.0,
    },
    explanationTemplate: "Portfolio duration of {metric} years exceeds maximum allowed duration of {threshold} years",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 1245,
    violationCount: 23,
    createdAt: new Date("2024-01-01"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-15"),
    updatedBy: "admin@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T10:30:00"),
    lastViolatedAt: new Date("2024-01-14T15:22:00"),
  },
  {
    ruleId: "rule-002",
    ruleKey: "MAX_DV01_GLOBAL",
    name: "Maximum Portfolio DV01",
    description: "Limits portfolio DV01 to manage interest rate sensitivity",
    version: 1,
    severity: "BLOCK",
    scope: "GLOBAL",
    predicate: {
      metric: "portfolio.dv01",
      operator: "<=",
      value: 50000,
    },
    explanationTemplate: "Portfolio DV01 of ${metric} exceeds maximum allowed DV01 of ${threshold}",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION", "POST_TRADE"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 1245,
    violationCount: 8,
    createdAt: new Date("2024-01-01"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "admin@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T10:30:00"),
    lastViolatedAt: new Date("2024-01-12T09:15:00"),
  },
  {
    ruleId: "rule-003",
    ruleKey: "MIN_CASH_GLOBAL",
    name: "Minimum Cash Percentage",
    description: "Ensures portfolios maintain minimum cash buffer for liquidity",
    version: 1,
    severity: "WARN",
    scope: "GLOBAL",
    predicate: {
      metric: "portfolio.cashPercentage",
      operator: ">=",
      value: 2.0,
    },
    explanationTemplate: "Cash percentage of {metric}% is below minimum required {threshold}%",
    evaluationPoints: ["PRE_TRADE", "POST_TRADE"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 1245,
    violationCount: 45,
    createdAt: new Date("2024-01-01"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "admin@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T10:30:00"),
    lastViolatedAt: new Date("2024-01-15T08:45:00"),
  },
  {
    ruleId: "rule-004",
    ruleKey: "MAX_POSITION_CONCENTRATION",
    name: "Maximum Position Concentration",
    description: "Prevents any single position from exceeding concentration limit",
    version: 1,
    severity: "BLOCK",
    scope: "GLOBAL",
    predicate: {
      metric: "position.percentage",
      operator: "<=",
      value: 10.0,
    },
    explanationTemplate: "Position concentration of {metric}% exceeds maximum allowed {threshold}%",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 856,
    violationCount: 12,
    createdAt: new Date("2024-01-01"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "admin@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T09:00:00"),
    lastViolatedAt: new Date("2024-01-10T14:30:00"),
  },
  // Household-scoped rules (3)
  {
    ruleId: "rule-005",
    ruleKey: "SMITH_MAX_DURATION",
    name: "Smith Household Max Duration",
    description: "Conservative duration limit for Smith household accounts",
    version: 1,
    severity: "BLOCK",
    scope: "HOUSEHOLD",
    scopeId: "hh-001",
    scopeName: "Smith Household",
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 6.0,
    },
    explanationTemplate: "Portfolio duration of {metric} years exceeds Smith household limit of {threshold} years",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 234,
    violationCount: 5,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T10:00:00"),
    lastViolatedAt: new Date("2024-01-13T11:00:00"),
  },
  {
    ruleId: "rule-006",
    ruleKey: "WILLIAMS_MIN_CASH",
    name: "Williams Household Min Cash",
    description: "Higher cash requirement for Williams household",
    version: 1,
    severity: "WARN",
    scope: "HOUSEHOLD",
    scopeId: "hh-002",
    scopeName: "Williams Household",
    predicate: {
      metric: "portfolio.cashPercentage",
      operator: ">=",
      value: 5.0,
    },
    explanationTemplate: "Cash percentage of {metric}% is below Williams household minimum of {threshold}%",
    evaluationPoints: ["PRE_TRADE"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 156,
    violationCount: 8,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T09:30:00"),
    lastViolatedAt: new Date("2024-01-14T16:00:00"),
  },
  {
    ruleId: "rule-007",
    ruleKey: "BROWN_MAX_ORDER",
    name: "Brown Household Max Order Size",
    description: "Limits individual order size for Brown household",
    version: 1,
    severity: "BLOCK",
    scope: "HOUSEHOLD",
    scopeId: "hh-003",
    scopeName: "Brown Household",
    predicate: {
      metric: "order.value",
      operator: "<=",
      value: 500000,
    },
    explanationTemplate: "Order value of ${metric} exceeds Brown household limit of ${threshold}",
    evaluationPoints: ["PRE_TRADE"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 89,
    violationCount: 3,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-14T14:00:00"),
    lastViolatedAt: new Date("2024-01-11T10:30:00"),
  },
  // Account-scoped rules (3)
  {
    ruleId: "rule-008",
    ruleKey: "SMITH_IRA_DURATION",
    name: "Smith IRA Max Duration",
    description: "Very conservative duration for Smith IRA account",
    version: 1,
    severity: "BLOCK",
    scope: "ACCOUNT",
    scopeId: "acc-002",
    scopeName: "Johnson IRA",
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 4.0,
    },
    explanationTemplate: "Portfolio duration of {metric} years exceeds IRA account limit of {threshold} years",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 67,
    violationCount: 2,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T08:00:00"),
    lastViolatedAt: new Date("2024-01-08T15:00:00"),
  },
  {
    ruleId: "rule-009",
    ruleKey: "DAVIS_TRUST_DV01",
    name: "Davis Trust DV01 Limit",
    description: "Lower DV01 limit for Davis Trust account",
    version: 1,
    severity: "BLOCK",
    scope: "ACCOUNT",
    scopeId: "acc-005",
    scopeName: "Davis Trust",
    predicate: {
      metric: "portfolio.dv01",
      operator: "<=",
      value: 25000,
    },
    explanationTemplate: "Portfolio DV01 of ${metric} exceeds Davis Trust limit of ${threshold}",
    evaluationPoints: ["PRE_TRADE", "PRE_EXECUTION"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 45,
    violationCount: 1,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-14T16:00:00"),
    lastViolatedAt: new Date("2024-01-05T11:00:00"),
  },
  {
    ruleId: "rule-010",
    ruleKey: "MILLER_CORP_CASH",
    name: "Miller Corporate Min Cash",
    description: "High cash requirement for Miller Corporate account",
    version: 1,
    severity: "WARN",
    scope: "ACCOUNT",
    scopeId: "acc-006",
    scopeName: "Miller Corporate",
    predicate: {
      metric: "portfolio.cashPercentage",
      operator: ">=",
      value: 10.0,
    },
    explanationTemplate: "Cash percentage of {metric}% is below Miller Corporate minimum of {threshold}%",
    evaluationPoints: ["PRE_TRADE", "POST_TRADE"],
    status: "ACTIVE",
    effectiveFrom: new Date("2024-01-01"),
    evaluationCount: 34,
    violationCount: 4,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "advisor@instant.com",
    lastEvaluatedAt: new Date("2024-01-15T07:30:00"),
    lastViolatedAt: new Date("2024-01-12T14:00:00"),
  },
  // Inactive/Draft rules (2)
  {
    ruleId: "rule-011",
    ruleKey: "EXPERIMENTAL_DURATION",
    name: "Experimental Duration Rule",
    description: "Testing new duration limits",
    version: 1,
    severity: "WARN",
    scope: "GLOBAL",
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 7.0,
    },
    explanationTemplate: "Portfolio duration of {metric} years exceeds experimental limit of {threshold} years",
    evaluationPoints: ["PRE_TRADE"],
    status: "DRAFT",
    effectiveFrom: new Date("2024-02-01"),
    evaluationCount: 0,
    violationCount: 0,
    createdAt: new Date("2024-01-10"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-10"),
    updatedBy: "admin@instant.com",
  },
  {
    ruleId: "rule-012",
    ruleKey: "DEPRECATED_MV_LIMIT",
    name: "Deprecated Market Value Limit",
    description: "Old market value limit - superseded",
    version: 3,
    severity: "BLOCK",
    scope: "GLOBAL",
    predicate: {
      metric: "portfolio.marketValue",
      operator: "<=",
      value: 10000000,
    },
    explanationTemplate: "Portfolio market value of ${metric} exceeds limit of ${threshold}",
    evaluationPoints: ["PRE_TRADE"],
    status: "INACTIVE",
    effectiveFrom: new Date("2023-01-01"),
    effectiveTo: new Date("2024-01-01"),
    evaluationCount: 2345,
    violationCount: 0,
    createdAt: new Date("2023-01-01"),
    createdBy: "admin@instant.com",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "admin@instant.com",
    lastEvaluatedAt: new Date("2023-12-31T23:59:00"),
  },
];

// Sample violations
export const violations: Violation[] = [
  // Active BLOCK violations (3)
  {
    violationId: "vio-001",
    ruleId: "rule-001",
    ruleName: "Maximum Portfolio Duration",
    ruleVersion: 2,
    severity: "BLOCK",
    scope: "GLOBAL",
    orderId: "order-025",
    orderDescription: "BUY 1,000,000 US Treasury 4.375% 02/15/2054",
    accountId: "acc-001",
    accountName: "Smith Family Trust",
    householdId: "hh-001",
    householdName: "Smith Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 8.5,
    threshold: 8.0,
    metricName: "portfolio.duration",
    status: "ACTIVE",
    explanation: "Portfolio duration of 8.5 years exceeds maximum allowed duration of 8.0 years",
    metricSnapshot: {
      "portfolio.duration": 8.5,
      "portfolio.dv01": 42000,
      "portfolio.marketValue": 5250000,
      "portfolio.cash": 125000,
      "portfolio.cashPercentage": 2.4,
    },
    evaluatedAt: new Date("2024-01-15T10:30:00"),
  },
  {
    violationId: "vio-002",
    ruleId: "rule-005",
    ruleName: "Smith Household Max Duration",
    ruleVersion: 1,
    severity: "BLOCK",
    scope: "HOUSEHOLD",
    scopeId: "hh-001",
    scopeName: "Smith Household",
    orderId: "order-026",
    orderDescription: "BUY 500,000 US Treasury 3.875% 02/15/2043",
    accountId: "acc-002",
    accountName: "Johnson IRA",
    householdId: "hh-001",
    householdName: "Smith Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 6.8,
    threshold: 6.0,
    metricName: "portfolio.duration",
    status: "ACTIVE",
    explanation: "Portfolio duration of 6.8 years exceeds Smith household limit of 6.0 years",
    metricSnapshot: {
      "portfolio.duration": 6.8,
      "portfolio.dv01": 28000,
      "portfolio.marketValue": 3500000,
      "portfolio.cash": 75000,
      "portfolio.cashPercentage": 2.1,
    },
    evaluatedAt: new Date("2024-01-15T09:45:00"),
  },
  {
    violationId: "vio-003",
    ruleId: "rule-007",
    ruleName: "Brown Household Max Order Size",
    ruleVersion: 1,
    severity: "BLOCK",
    scope: "HOUSEHOLD",
    scopeId: "hh-003",
    scopeName: "Brown Household",
    orderId: "order-027",
    orderDescription: "BUY 750,000 US Treasury 4.00% 11/15/2042",
    accountId: "acc-004",
    accountName: "Brown Joint Account",
    householdId: "hh-003",
    householdName: "Brown Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 750000,
    threshold: 500000,
    metricName: "order.value",
    status: "ACTIVE",
    explanation: "Order value of $750,000 exceeds Brown household limit of $500,000",
    metricSnapshot: {
      "order.value": 750000,
      "order.quantity": 750000,
      "order.side": "BUY",
    },
    evaluatedAt: new Date("2024-01-14T14:30:00"),
  },
  // Active WARN violations (3)
  {
    violationId: "vio-004",
    ruleId: "rule-003",
    ruleName: "Minimum Cash Percentage",
    ruleVersion: 1,
    severity: "WARN",
    scope: "GLOBAL",
    orderId: "order-028",
    orderDescription: "BUY 2,000,000 US Treasury 2.25% 11/15/2027",
    accountId: "acc-003",
    accountName: "Williams 401k",
    householdId: "hh-002",
    householdName: "Williams Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 1.5,
    threshold: 2.0,
    metricName: "portfolio.cashPercentage",
    status: "ACTIVE",
    explanation: "Cash percentage of 1.5% is below minimum required 2.0%",
    metricSnapshot: {
      "portfolio.duration": 4.2,
      "portfolio.dv01": 18000,
      "portfolio.marketValue": 4200000,
      "portfolio.cash": 63000,
      "portfolio.cashPercentage": 1.5,
    },
    evaluatedAt: new Date("2024-01-15T08:45:00"),
  },
  {
    violationId: "vio-005",
    ruleId: "rule-006",
    ruleName: "Williams Household Min Cash",
    ruleVersion: 1,
    severity: "WARN",
    scope: "HOUSEHOLD",
    scopeId: "hh-002",
    scopeName: "Williams Household",
    orderId: "order-029",
    orderDescription: "BUY 1,500,000 US Treasury 3.50% 02/15/2033",
    accountId: "acc-003",
    accountName: "Williams 401k",
    householdId: "hh-002",
    householdName: "Williams Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 3.2,
    threshold: 5.0,
    metricName: "portfolio.cashPercentage",
    status: "ACTIVE",
    explanation: "Cash percentage of 3.2% is below Williams household minimum of 5.0%",
    metricSnapshot: {
      "portfolio.duration": 5.1,
      "portfolio.dv01": 22000,
      "portfolio.marketValue": 4800000,
      "portfolio.cash": 153600,
      "portfolio.cashPercentage": 3.2,
    },
    evaluatedAt: new Date("2024-01-14T16:00:00"),
  },
  {
    violationId: "vio-006",
    ruleId: "rule-010",
    ruleName: "Miller Corporate Min Cash",
    ruleVersion: 1,
    severity: "WARN",
    scope: "ACCOUNT",
    scopeId: "acc-006",
    scopeName: "Miller Corporate",
    orderId: "order-030",
    orderDescription: "BUY 3,000,000 US Treasury 1.625% 05/15/2031",
    accountId: "acc-006",
    accountName: "Miller Corporate",
    householdId: "hh-005",
    householdName: "Miller Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 7.5,
    threshold: 10.0,
    metricName: "portfolio.cashPercentage",
    status: "ACTIVE",
    explanation: "Cash percentage of 7.5% is below Miller Corporate minimum of 10.0%",
    metricSnapshot: {
      "portfolio.duration": 6.2,
      "portfolio.dv01": 35000,
      "portfolio.marketValue": 6200000,
      "portfolio.cash": 465000,
      "portfolio.cashPercentage": 7.5,
    },
    evaluatedAt: new Date("2024-01-12T14:00:00"),
  },
  // Post-trade violation
  {
    violationId: "vio-007",
    ruleId: "rule-002",
    ruleName: "Maximum Portfolio DV01",
    ruleVersion: 1,
    severity: "BLOCK",
    scope: "GLOBAL",
    accountId: "acc-005",
    accountName: "Davis Trust",
    householdId: "hh-004",
    householdName: "Davis Household",
    evaluationPoint: "POST_TRADE",
    metricValue: 52000,
    threshold: 50000,
    metricName: "portfolio.dv01",
    status: "ACTIVE",
    explanation: "Portfolio DV01 of $52,000 exceeds maximum allowed DV01 of $50,000",
    metricSnapshot: {
      "portfolio.duration": 7.8,
      "portfolio.dv01": 52000,
      "portfolio.marketValue": 5800000,
      "portfolio.cash": 95000,
      "portfolio.cashPercentage": 1.6,
    },
    evaluatedAt: new Date("2024-01-13T11:30:00"),
  },
  // Resolved violations (3)
  {
    violationId: "vio-008",
    ruleId: "rule-001",
    ruleName: "Maximum Portfolio Duration",
    ruleVersion: 2,
    severity: "BLOCK",
    scope: "GLOBAL",
    orderId: "order-020",
    orderDescription: "BUY 1,500,000 US Treasury 4.125% 08/15/2053",
    accountId: "acc-001",
    accountName: "Smith Family Trust",
    householdId: "hh-001",
    householdName: "Smith Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 8.2,
    threshold: 8.0,
    metricName: "portfolio.duration",
    status: "RESOLVED",
    explanation: "Portfolio duration of 8.2 years exceeds maximum allowed duration of 8.0 years",
    metricSnapshot: {
      "portfolio.duration": 8.2,
      "portfolio.dv01": 38000,
      "portfolio.marketValue": 4800000,
      "portfolio.cash": 150000,
      "portfolio.cashPercentage": 3.1,
    },
    evaluatedAt: new Date("2024-01-10T14:00:00"),
    resolvedAt: new Date("2024-01-10T15:30:00"),
    resolvedBy: "advisor@instant.com",
  },
  {
    violationId: "vio-009",
    ruleId: "rule-004",
    ruleName: "Maximum Position Concentration",
    ruleVersion: 1,
    severity: "BLOCK",
    scope: "GLOBAL",
    orderId: "order-018",
    orderDescription: "BUY 2,000,000 US Treasury 4.50% 11/15/2033",
    accountId: "acc-004",
    accountName: "Brown Joint Account",
    householdId: "hh-003",
    householdName: "Brown Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 12.5,
    threshold: 10.0,
    metricName: "position.percentage",
    status: "RESOLVED",
    explanation: "Position concentration of 12.5% exceeds maximum allowed 10.0%",
    metricSnapshot: {
      "position.percentage": 12.5,
      "position.marketValue": 625000,
      "portfolio.marketValue": 5000000,
    },
    evaluatedAt: new Date("2024-01-08T10:00:00"),
    resolvedAt: new Date("2024-01-08T11:00:00"),
    resolvedBy: "advisor@instant.com",
  },
  {
    violationId: "vio-010",
    ruleId: "rule-003",
    ruleName: "Minimum Cash Percentage",
    ruleVersion: 1,
    severity: "WARN",
    scope: "GLOBAL",
    orderId: "order-015",
    orderDescription: "BUY 1,000,000 US Treasury 2.875% 05/15/2032",
    accountId: "acc-002",
    accountName: "Johnson IRA",
    householdId: "hh-001",
    householdName: "Smith Household",
    evaluationPoint: "PRE_TRADE",
    metricValue: 1.8,
    threshold: 2.0,
    metricName: "portfolio.cashPercentage",
    status: "RESOLVED",
    explanation: "Cash percentage of 1.8% is below minimum required 2.0%",
    metricSnapshot: {
      "portfolio.duration": 5.5,
      "portfolio.dv01": 24000,
      "portfolio.marketValue": 4000000,
      "portfolio.cash": 72000,
      "portfolio.cashPercentage": 1.8,
    },
    evaluatedAt: new Date("2024-01-05T09:30:00"),
    resolvedAt: new Date("2024-01-05T10:00:00"),
    resolvedBy: "advisor@instant.com",
  },
];

// Sample evaluations (recent history)
export const evaluations: Evaluation[] = [
  {
    evaluationId: "eval-001",
    ruleId: "rule-001",
    ruleName: "Maximum Portfolio Duration",
    ruleVersion: 2,
    orderId: "order-031",
    accountId: "acc-001",
    accountName: "Smith Family Trust",
    evaluationPoint: "PRE_TRADE",
    result: "PASS",
    metricValue: 7.2,
    threshold: 8.0,
    metricSnapshot: {
      "portfolio.duration": 7.2,
      "portfolio.dv01": 35000,
      "portfolio.marketValue": 5000000,
    },
    explanation: "Portfolio duration of 7.2 years is within maximum allowed duration of 8.0 years",
    evaluatedAt: new Date("2024-01-15T11:00:00"),
  },
  {
    evaluationId: "eval-002",
    ruleId: "rule-002",
    ruleName: "Maximum Portfolio DV01",
    ruleVersion: 1,
    orderId: "order-031",
    accountId: "acc-001",
    accountName: "Smith Family Trust",
    evaluationPoint: "PRE_TRADE",
    result: "PASS",
    metricValue: 38000,
    threshold: 50000,
    metricSnapshot: {
      "portfolio.dv01": 38000,
      "portfolio.duration": 7.2,
      "portfolio.marketValue": 5000000,
    },
    explanation: "Portfolio DV01 of $38,000 is within maximum allowed DV01 of $50,000",
    evaluatedAt: new Date("2024-01-15T11:00:00"),
  },
  {
    evaluationId: "eval-003",
    ruleId: "rule-003",
    ruleName: "Minimum Cash Percentage",
    ruleVersion: 1,
    orderId: "order-031",
    accountId: "acc-001",
    accountName: "Smith Family Trust",
    evaluationPoint: "PRE_TRADE",
    result: "PASS",
    metricValue: 2.5,
    threshold: 2.0,
    metricSnapshot: {
      "portfolio.cashPercentage": 2.5,
      "portfolio.cash": 125000,
      "portfolio.marketValue": 5000000,
    },
    explanation: "Cash percentage of 2.5% meets minimum required 2.0%",
    evaluatedAt: new Date("2024-01-15T11:00:00"),
  },
];

// Rule versions for version history
export const ruleVersions: RuleVersion[] = [
  {
    versionId: "rv-001-1",
    ruleId: "rule-001",
    version: 1,
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 10.0,
    },
    severity: "BLOCK",
    explanationTemplate: "Portfolio duration of {metric} years exceeds maximum allowed duration of {threshold} years",
    createdAt: new Date("2024-01-01"),
    createdBy: "admin@instant.com",
  },
  {
    versionId: "rv-001-2",
    ruleId: "rule-001",
    version: 2,
    predicate: {
      metric: "portfolio.duration",
      operator: "<=",
      value: 8.0,
    },
    severity: "BLOCK",
    explanationTemplate: "Portfolio duration of {metric} years exceeds maximum allowed duration of {threshold} years",
    createdAt: new Date("2024-01-15"),
    createdBy: "admin@instant.com",
  },
];

// Helper functions
export function getRuleById(ruleId: string): Rule | undefined {
  return rules.find((r) => r.ruleId === ruleId);
}

export function getRuleVersions(ruleId: string): RuleVersion[] {
  return ruleVersions.filter((rv) => rv.ruleId === ruleId);
}

export function getViolationsForRule(ruleId: string): Violation[] {
  return violations.filter((v) => v.ruleId === ruleId);
}

export function getEvaluationsForRule(ruleId: string): Evaluation[] {
  return evaluations.filter((e) => e.ruleId === ruleId);
}

export function getComplianceSummary(): ComplianceSummary {
  const activeRules = rules.filter((r) => r.status === "ACTIVE");
  const activeViolations = violations.filter((v) => v.status === "ACTIVE");

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    blockRules: activeRules.filter((r) => r.severity === "BLOCK").length,
    warnRules: activeRules.filter((r) => r.severity === "WARN").length,
    globalRules: activeRules.filter((r) => r.scope === "GLOBAL").length,
    householdRules: activeRules.filter((r) => r.scope === "HOUSEHOLD").length,
    accountRules: activeRules.filter((r) => r.scope === "ACCOUNT").length,
    activeViolations: activeViolations.length,
    blockViolations: activeViolations.filter((v) => v.severity === "BLOCK").length,
    warnViolations: activeViolations.filter((v) => v.severity === "WARN").length,
    resolvedViolations: violations.filter((v) => v.status === "RESOLVED").length,
    evaluationsToday: evaluations.length,
  };
}

export function getSeverityColor(severity: RuleSeverity): string {
  switch (severity) {
    case "BLOCK":
      return "bg-red-100 text-red-800";
    case "WARN":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getScopeColor(scope: RuleScope): string {
  switch (scope) {
    case "GLOBAL":
      return "bg-blue-100 text-blue-800";
    case "HOUSEHOLD":
      return "bg-purple-100 text-purple-800";
    case "ACCOUNT":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusColor(status: RuleStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800";
    case "DRAFT":
      return "bg-blue-100 text-blue-800";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getEvaluationPointColor(point: EvaluationPoint): string {
  switch (point) {
    case "PRE_TRADE":
      return "bg-blue-100 text-blue-800";
    case "PRE_EXECUTION":
      return "bg-purple-100 text-purple-800";
    case "POST_TRADE":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getResultColor(result: EvaluationResult): string {
  switch (result) {
    case "PASS":
      return "bg-green-100 text-green-800";
    case "WARN":
      return "bg-yellow-100 text-yellow-800";
    case "BLOCK":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

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
  }).format(date);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
