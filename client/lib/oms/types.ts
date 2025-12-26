// OMS Types based on implementation spec

export type OrderSide = "BUY" | "SELL";

export type OrderType = "MARKET" | "LIMIT" | "CURVE_RELATIVE";

export type TimeInForce = "DAY" | "IOC";

export type OrderState =
  | "DRAFT"
  | "STAGED"
  | "APPROVAL_PENDING"
  | "APPROVED"
  | "SENT"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "SETTLED";

export type ComplianceStatus = "PASS" | "WARN" | "BLOCK" | "PENDING";

export type ComplianceScope = "GLOBAL" | "HOUSEHOLD" | "ACCOUNT";

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  scope: ComplianceScope;
  message: string;
  metrics?: Record<string, unknown>;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  evaluatedAt: Date;
  rulesEvaluated: string[];
  warnings: ComplianceViolation[];
  blocks: ComplianceViolation[];
  explanation: string;
}

export interface Order {
  orderId: string;
  accountId: string;
  instrumentId: string;
  cusip: string;
  instrumentDescription: string;
  side: OrderSide;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  curveSpreadBp?: number;
  timeInForce: TimeInForce;
  state: OrderState;
  batchId?: string;
  complianceResult?: ComplianceResult;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  lastStateChangeAt: Date;
  sentToEmsAt?: Date;
  fullyFilledAt?: Date;
  settledAt?: Date;
  notes?: string;
}

export type OrderEventType =
  | "ORDER_CREATED"
  | "ORDER_AMENDED"
  | "ORDER_CANCELLED"
  | "ORDER_APPROVAL_REQUESTED"
  | "ORDER_APPROVED"
  | "ORDER_REJECTED"
  | "ORDER_SENT_TO_EMS"
  | "ORDER_PARTIALLY_FILLED"
  | "ORDER_FULLY_FILLED"
  | "ORDER_SETTLED";

export interface OrderEvent {
  eventId: string;
  orderId: string;
  eventType: OrderEventType;
  timestamp: Date;
  actor: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface OrderFill {
  fillId: string;
  orderId: string;
  quantity: number;
  price: number;
  timestamp: Date;
  executionId?: string;
}

export interface OrderWithDetails extends Order {
  accountName: string;
  householdId: string;
  householdName: string;
  fills: OrderFill[];
  events: OrderEvent[];
  filledQuantity: number;
  remainingQuantity: number;
  averageFillPrice?: number;
  estimatedPnL?: number;
}

// Batch upload types
export interface OrderBatch {
  batchId: string;
  orderCount: number;
  successCount: number;
  errorCount: number;
  status: "PROCESSING" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
  createdAt: Date;
  createdBy: string;
}

export interface BulkOrderRow {
  accountId?: string;
  accountName?: string;
  cusip: string;
  side: OrderSide;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  curveSpreadBp?: number;
  timeInForce?: TimeInForce;
  notes?: string;
}

export interface BulkOrderValidationResult {
  row: number;
  data: BulkOrderRow;
  isValid: boolean;
  errors: string[];
}

// Filter types for UI
export interface OrderFilters {
  state?: OrderState | "all";
  accountId?: string;
  householdId?: string;
  complianceStatus?: ComplianceStatus | "all";
  orderType?: OrderType | "all";
  dateFrom?: Date;
  dateTo?: Date;
  batchId?: string;
}

export type OrderGroupBy = "none" | "household" | "account" | "state";

// Helper types
export interface OrderSummary {
  total: number;
  byState: Record<OrderState, number>;
  byComplianceStatus: Record<ComplianceStatus, number>;
  totalQuantity: number;
  totalFilledQuantity: number;
}
