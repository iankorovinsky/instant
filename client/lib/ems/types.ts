// Execution states following the lifecycle: PENDING → SIMULATING → PARTIALLY_FILLED → FILLED → SETTLED
export type ExecutionState =
  | "PENDING"
  | "SIMULATING"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "SETTLED"
  | "CANCELLED";

export type SlippageComponentType = "BUCKET_SPREAD" | "SIZE_IMPACT" | "LIMIT_CONSTRAINT";

export interface SlippageComponent {
  type: SlippageComponentType;
  amount: number; // in basis points or dollars
  percentage: number; // percentage of total slippage
  description?: string;
}

export interface SlippageBreakdown {
  total: number; // total slippage in basis points
  totalDollars: number; // total slippage in dollars
  bucketSpread: number;
  sizeImpact: number;
  limitConstraint: number | null;
  components: SlippageComponent[];
}

export interface DeterministicInputs {
  modelVersion: string;
  bucket: string; // maturity bucket (0-2y, 2-5y, 5-10y, 10-20y, 20y+)
  spreadBp: number; // bucket spread in basis points
  maxClip: number; // maximum clip size
  delayMsPerClip: number; // delay per clip in milliseconds
  sizeImpactFunction: string; // function type/name (e.g., "linear", "sqrt")
  sizeImpactParameters: Record<string, number>;
  baselineMidPrice: number;
  pricingAsOfDate: Date;
  curveSource: string;
}

export interface Fill {
  fillId: string;
  executionId: string;
  clipIndex: number; // 0-based clip index
  quantity: number;
  price: number;
  timestamp: Date;
  slippage: number; // slippage for this fill in basis points
  cumulativeQuantity: number; // cumulative filled quantity after this fill
  createdAt: Date;
}

export interface Execution {
  executionId: string;
  orderId: string;
  accountId: string;
  accountName?: string;
  householdId?: string;
  householdName?: string;
  instrumentId: string;
  cusip: string;
  description: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "CURVE_RELATIVE";
  limitPrice?: number;
  curveSpread?: number;
  totalQuantity: number;
  filledQuantity: number;
  avgFillPrice: number | null;
  status: ExecutionState;
  asOfDate: Date;
  executionStartTime: Date;
  executionEndTime?: Date;
  settlementDate?: Date;
  settledDate?: Date;
  slippageBreakdown: SlippageBreakdown | null;
  deterministicInputs: DeterministicInputs;
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionWithFills extends Execution {
  fills: Fill[];
}

export type ExecutionEventType =
  | "ExecutionRequested"
  | "ExecutionSimulated"
  | "FillGenerated"
  | "OrderPartiallyFilled"
  | "OrderFullyFilled"
  | "SettlementBooked"
  | "ExecutionCancelled";

export interface ExecutionEvent {
  eventId: string;
  executionId: string;
  eventType: ExecutionEventType;
  timestamp: Date;
  payload: Record<string, unknown>;
  description: string;
}

export interface LiquidityProfile {
  bucket: string;
  spreadBp: number;
  maxClipSize: number;
  delayMsPerClip: number;
  sizeImpactFunction: string;
  sizeImpactParameters: Record<string, number>;
}

// Summary statistics for dashboard
export interface ExecutionSummary {
  total: number;
  pending: number;
  simulating: number;
  partiallyFilled: number;
  filled: number;
  settled: number;
  cancelled: number;
  totalFilledQuantity: number;
  totalSlippageBp: number;
  avgSlippageBp: number;
}

// Filter options for execution tape
export interface ExecutionFilters {
  orderId?: string;
  status?: ExecutionState[];
  dateFrom?: Date;
  dateTo?: Date;
  cusip?: string;
  side?: "BUY" | "SELL";
  accountId?: string;
}

// Grouping options
export type ExecutionGroupBy = "none" | "order" | "instrument" | "date" | "account";
