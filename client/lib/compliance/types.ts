// Rule severity levels
export type RuleSeverity = "BLOCK" | "WARN";

// Rule scope levels
export type RuleScope = "GLOBAL" | "HOUSEHOLD" | "ACCOUNT";

// Rule status
export type RuleStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DRAFT";

// Evaluation points
export type EvaluationPoint = "PRE_TRADE" | "PRE_EXECUTION" | "POST_TRADE";

// Evaluation result
export type EvaluationResult = "PASS" | "WARN" | "BLOCK";

// Violation status
export type ViolationStatus = "ACTIVE" | "RESOLVED";

// Predicate operators
export type PredicateOperator = "<=" | ">=" | "<" | ">" | "==" | "!=" | "in";

// Available metrics for rules
export type MetricType =
  | "portfolio.duration"
  | "portfolio.dv01"
  | "portfolio.marketValue"
  | "portfolio.cash"
  | "portfolio.cashPercentage"
  | "position.quantity"
  | "position.marketValue"
  | "position.percentage"
  | "order.quantity"
  | "order.value"
  | "order.side";

export interface InstrumentFilter {
  cusip?: string;
  instrumentType?: string;
}

export interface Predicate {
  metric: MetricType;
  operator: PredicateOperator;
  value: number | string;
  instrumentFilter?: InstrumentFilter;
}

export interface Rule {
  ruleId: string;
  ruleKey: string;
  name: string;
  description?: string;
  version: number;
  severity: RuleSeverity;
  scope: RuleScope;
  scopeId?: string; // householdId or accountId if scoped
  scopeName?: string; // household or account name for display
  predicate: Predicate;
  explanationTemplate: string;
  evaluationPoints: EvaluationPoint[];
  status: RuleStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;
  evaluationCount: number;
  violationCount: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  lastEvaluatedAt?: Date;
  lastViolatedAt?: Date;
}

export interface RuleVersion {
  versionId: string;
  ruleId: string;
  version: number;
  predicate: Predicate;
  severity: RuleSeverity;
  explanationTemplate: string;
  createdAt: Date;
  createdBy: string;
}

export interface MetricSnapshot {
  [key: string]: number | string | null;
}

export interface Violation {
  violationId: string;
  ruleId: string;
  ruleName: string;
  ruleVersion: number;
  severity: RuleSeverity;
  scope: RuleScope;
  scopeId?: string;
  scopeName?: string;
  orderId?: string;
  orderDescription?: string;
  accountId: string;
  accountName: string;
  householdId?: string;
  householdName?: string;
  evaluationPoint: EvaluationPoint;
  metricValue: number;
  threshold: number;
  metricName: string;
  status: ViolationStatus;
  explanation: string;
  metricSnapshot: MetricSnapshot;
  evaluatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface Evaluation {
  evaluationId: string;
  ruleId: string;
  ruleName: string;
  ruleVersion: number;
  orderId?: string;
  accountId: string;
  accountName: string;
  evaluationPoint: EvaluationPoint;
  result: EvaluationResult;
  metricValue: number;
  threshold: number;
  metricSnapshot: MetricSnapshot;
  explanation: string;
  evaluatedAt: Date;
}

// Summary statistics for dashboard
export interface ComplianceSummary {
  totalRules: number;
  activeRules: number;
  blockRules: number;
  warnRules: number;
  globalRules: number;
  householdRules: number;
  accountRules: number;
  activeViolations: number;
  blockViolations: number;
  warnViolations: number;
  resolvedViolations: number;
  evaluationsToday: number;
}

// Filter options for violations
export interface ViolationFilters {
  severity?: RuleSeverity[];
  scope?: RuleScope[];
  householdId?: string;
  accountId?: string;
  ruleId?: string;
  status?: ViolationStatus[];
  evaluationPoint?: EvaluationPoint[];
  dateFrom?: Date;
  dateTo?: Date;
}

// Filter options for rules
export interface RuleFilters {
  severity?: RuleSeverity[];
  scope?: RuleScope[];
  status?: RuleStatus[];
  evaluationPoint?: EvaluationPoint[];
}

// Grouping options
export type ViolationGroupBy = "none" | "scope" | "rule" | "severity" | "account";
export type RuleGroupBy = "none" | "scope" | "severity" | "status";

// Metric metadata for UI
export interface MetricInfo {
  id: MetricType;
  name: string;
  description: string;
  category: "portfolio" | "position" | "order";
  valueType: "number" | "percentage" | "currency" | "enum";
  unit?: string;
}

// Operator metadata for UI
export interface OperatorInfo {
  id: PredicateOperator;
  label: string;
  description: string;
}
