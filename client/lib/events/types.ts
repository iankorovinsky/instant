// Event Studio Types

// Event modules/categories
export type EventModule =
  | "marketdata"
  | "pricing"
  | "oms"
  | "ems"
  | "pms"
  | "compliance"
  | "copilot";

// Aggregate types
export type AggregateType =
  | "Order"
  | "Account"
  | "Household"
  | "Proposal"
  | "Execution"
  | "Rule"
  | "Instrument"
  | "YieldCurve"
  | "Model";

// Actor roles
export type ActorRole = "user" | "system" | "copilot" | "scheduler";

// Actor information
export interface Actor {
  actorId: string;
  role: ActorRole;
  name?: string;
}

// Aggregate reference
export interface Aggregate {
  type: AggregateType;
  id: string;
}

// Event envelope structure
export interface Event {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  actor: Actor;
  aggregate: Aggregate;
  correlationId: string | null;
  causationId: string | null;
  payload: Record<string, unknown>;
  explanation: string | null;
  schemaVersion: number;
}

// Event with computed fields for timeline view
export interface EventTimelineItem extends Event {
  module: EventModule;
  summary: string;
  hasExplanation: boolean;
}

// Event filters
export interface EventFilters {
  aggregateType?: AggregateType[];
  aggregateId?: string;
  correlationId?: string;
  causationId?: string;
  eventType?: string[];
  module?: EventModule[];
  actorId?: string;
  actorRole?: ActorRole[];
  dateFrom?: Date;
  dateTo?: Date;
  hasExplanation?: boolean;
  schemaVersion?: number;
  searchQuery?: string;
}

// Timeline view options
export type TimelineViewMode = "vertical" | "horizontal" | "list";

// Event grouping options
export type EventGroupBy = "none" | "module" | "aggregateType" | "correlationId" | "date";

// Replay scope options
export type ReplayScope =
  | "all"
  | "marketGrid"
  | "blotter"
  | "executionTape"
  | "accountPositions"
  | "complianceStatus"
  | "proposals"
  | "timeline";

// Replay status
export type ReplayStatus = "idle" | "in_progress" | "completed" | "failed";

// Replay request
export interface ReplayRequest {
  marketDate: Date;
  systemTimeCutoff: Date;
  scope: ReplayScope;
  aggregateId?: string;
}

// Replay result
export interface ReplayResult {
  status: ReplayStatus;
  eventCount: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  projectionState?: Record<string, unknown>;
}

// Event relationship
export interface EventRelationship {
  type: "correlation" | "causation" | "aggregate";
  eventId: string;
  eventType: string;
  occurredAt: Date;
}

// Event statistics
export interface EventStatistics {
  totalEvents: number;
  eventsByModule: Record<EventModule, number>;
  eventsByAggregateType: Record<AggregateType, number>;
  eventsByHour: { hour: string; count: number }[];
  eventsWithExplanations: number;
  uniqueCorrelationIds: number;
  uniqueAggregates: number;
}

// Event type definitions by module
export const EVENT_TYPES: Record<EventModule, string[]> = {
  marketdata: [
    "MarketDataCurveIngested",
    "InstrumentIngested",
    "InstrumentUpdated",
    "CurvePointsUpdated",
  ],
  pricing: [
    "EvaluatedPriceComputed",
    "RiskMetricsComputed",
    "PricingBatchCompleted",
    "PricingFailed",
  ],
  oms: [
    "OrderCreated",
    "OrderValidated",
    "OrderApproved",
    "OrderRejected",
    "OrderSentToEMS",
    "OrderCancelled",
    "OrderAmended",
    "OrderCompleted",
  ],
  ems: [
    "ExecutionRequested",
    "ExecutionStarted",
    "FillGenerated",
    "OrderPartiallyFilled",
    "OrderFullyFilled",
    "ExecutionFailed",
    "SlippageComputed",
  ],
  pms: [
    "AccountCreated",
    "AccountUpdated",
    "HouseholdCreated",
    "HouseholdUpdated",
    "ProposalGenerated",
    "ProposalApproved",
    "ProposalRejected",
    "TargetSet",
    "DriftCalculated",
    "RebalanceTriggered",
  ],
  compliance: [
    "RuleCreated",
    "RuleUpdated",
    "RuleActivated",
    "RuleDeactivated",
    "RuleEvaluated",
    "ViolationDetected",
    "ViolationResolved",
    "OrderBlockedByCompliance",
    "ComplianceCheckPassed",
  ],
  copilot: [
    "AIDraftProposed",
    "AIDraftApproved",
    "AIDraftRejected",
    "AIDraftModified",
    "CopilotSuggestionGenerated",
  ],
};

// Module display configuration
export const MODULE_CONFIG: Record<EventModule, { label: string; color: string; icon: string }> = {
  marketdata: { label: "Market Data", color: "bg-blue-100 text-blue-800", icon: "TrendingUp" },
  pricing: { label: "Pricing", color: "bg-cyan-100 text-cyan-800", icon: "DollarSign" },
  oms: { label: "OMS", color: "bg-green-100 text-green-800", icon: "FileText" },
  ems: { label: "EMS", color: "bg-purple-100 text-purple-800", icon: "Zap" },
  pms: { label: "PMS", color: "bg-orange-100 text-orange-800", icon: "PieChart" },
  compliance: { label: "Compliance", color: "bg-red-100 text-red-800", icon: "Shield" },
  copilot: { label: "Copilot", color: "bg-indigo-100 text-indigo-800", icon: "Bot" },
};

// Aggregate type display configuration
export const AGGREGATE_CONFIG: Record<AggregateType, { label: string; color: string }> = {
  Order: { label: "Order", color: "bg-green-100 text-green-800" },
  Account: { label: "Account", color: "bg-blue-100 text-blue-800" },
  Household: { label: "Household", color: "bg-purple-100 text-purple-800" },
  Proposal: { label: "Proposal", color: "bg-orange-100 text-orange-800" },
  Execution: { label: "Execution", color: "bg-cyan-100 text-cyan-800" },
  Rule: { label: "Rule", color: "bg-red-100 text-red-800" },
  Instrument: { label: "Instrument", color: "bg-yellow-100 text-yellow-800" },
  YieldCurve: { label: "Yield Curve", color: "bg-teal-100 text-teal-800" },
  Model: { label: "Model", color: "bg-pink-100 text-pink-800" },
};
