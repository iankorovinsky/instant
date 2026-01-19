import type {
  DeterministicInputs,
  Execution,
  ExecutionEvent,
  ExecutionSummary,
  ExecutionWithFills,
  Fill,
  SlippageBreakdown,
} from "@/lib/ems/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ApiExecution = Record<string, unknown>;
type ApiFill = Record<string, unknown>;
type ApiEvent = Record<string, unknown>;

function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

function buildDeterministicInputs(api: ApiExecution): DeterministicInputs {
  const inputs = (api.deterministicInputs as Record<string, unknown>) || {};
  const bucket = (inputs.maturityBucket as string) || (inputs.bucket as string) || "0-2Y";
  const spreadBp = Number(inputs.spreadBps ?? inputs.spreadBp ?? 0);
  const maxClip = Number(inputs.maxClip ?? 0);
  const baselineMidPrice = Number(inputs.baselinePrice ?? inputs.baselineMidPrice ?? 0);

  return {
    modelVersion: "v1.0.0",
    bucket,
    spreadBp,
    maxClip,
    delayMsPerClip: 0,
    sizeImpactFunction: "linear",
    sizeImpactParameters: {
      sizeImpactBps: Number(inputs.sizeImpactBps ?? 0),
      sideImpactBps: Number(inputs.sideImpactBps ?? 0),
    },
    baselineMidPrice,
    pricingAsOfDate: parseDate(api.asOfDate),
    curveSource: "FRED",
  };
}

function buildSlippageBreakdown(api: ApiExecution): SlippageBreakdown | null {
  if (api.slippageTotal === undefined) {
    return null;
  }

  const breakdown = (api.slippageBreakdown as Record<string, unknown>) || {};
  const total = Number(api.slippageTotal ?? 0);
  const bucketSpread = Number(breakdown.bucketSpread ?? 0);
  const sizeImpact = Number(breakdown.sizeImpact ?? 0);

  const components = [
    {
      type: "BUCKET_SPREAD" as const,
      amount: bucketSpread,
      percentage: total !== 0 ? Math.round((bucketSpread / total) * 100) : 0,
      description: "Bucket spread impact",
    },
    {
      type: "SIZE_IMPACT" as const,
      amount: sizeImpact,
      percentage: total !== 0 ? Math.round((sizeImpact / total) * 100) : 0,
      description: "Size impact based on clip sizing",
    },
  ];

  return {
    total,
    totalDollars: 0,
    bucketSpread,
    sizeImpact,
    limitConstraint: null,
    components,
  };
}

function mapExecution(api: ApiExecution): Execution {
  return {
    executionId: String(api.executionId ?? ""),
    orderId: String(api.orderId ?? ""),
    accountId: String(api.accountId ?? ""),
    accountName: api.accountName ? String(api.accountName) : undefined,
    instrumentId: String(api.instrumentId ?? ""),
    cusip: String(api.cusip ?? api.instrumentId ?? ""),
    description: String(api.instrumentName ?? api.instrumentId ?? ""),
    side: (api.side as "BUY" | "SELL") || "BUY",
    orderType: (api.orderType as "MARKET" | "LIMIT" | "CURVE_RELATIVE") || "MARKET",
    limitPrice: api.limitPrice !== undefined ? Number(api.limitPrice) : undefined,
    curveSpread: api.curveSpreadBp !== undefined ? Number(api.curveSpreadBp) : undefined,
    totalQuantity: Number(api.totalQuantity ?? 0),
    filledQuantity: Number(api.filledQuantity ?? 0),
    avgFillPrice: api.avgFillPrice !== undefined ? Number(api.avgFillPrice) : null,
    status: (api.status as Execution["status"]) || "PENDING",
    asOfDate: parseDate(api.asOfDate),
    executionStartTime: parseDate(api.executionStartTime ?? api.asOfDate),
    executionEndTime: api.executionEndTime ? parseDate(api.executionEndTime) : undefined,
    settlementDate: api.settlementDate ? parseDate(api.settlementDate) : undefined,
    settledDate: api.settledDate ? parseDate(api.settledDate) : undefined,
    slippageBreakdown: buildSlippageBreakdown(api),
    deterministicInputs: buildDeterministicInputs(api),
    explanation: String(api.explanation ?? ""),
    createdAt: parseDate(api.createdAt),
    updatedAt: parseDate(api.updatedAt),
  };
}

function mapFill(api: ApiFill, runningTotal: number): Fill {
  const quantity = Number(api.quantity ?? 0);
  return {
    fillId: String(api.fillId ?? ""),
    executionId: String(api.executionId ?? ""),
    clipIndex: Number(api.clipIndex ?? 0),
    quantity,
    price: Number(api.price ?? 0),
    timestamp: parseDate(api.timestamp),
    slippage: Number(api.slippage ?? 0),
    cumulativeQuantity: runningTotal + quantity,
    createdAt: parseDate(api.createdAt ?? api.timestamp),
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchExecutions(params?: {
  status?: string[];
  orderId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<Execution[]> {
  const query = new URLSearchParams();
  if (params?.status?.length) {
    query.set("status", params.status.join(","));
  }
  if (params?.orderId) {
    query.set("orderId", params.orderId);
  }
  if (params?.fromDate) {
    query.set("fromDate", params.fromDate);
  }
  if (params?.toDate) {
    query.set("toDate", params.toDate);
  }

  const result = await fetchJson<{ executions: ApiExecution[] }>(
    `/api/views/executions?${query.toString()}`
  );

  return (result.executions || []).map(mapExecution);
}

export async function fetchExecutionById(id: string): Promise<ExecutionWithFills | null> {
  const execution = await fetchJson<ApiExecution>(`/api/views/executions/${id}`);
  if (!execution) {
    return null;
  }

  const mapped = mapExecution(execution);
  const fills = Array.isArray(execution.fills) ? execution.fills : [];

  let runningTotal = 0;
  const mappedFills = fills.map((fill) => {
    const mappedFill = mapFill(fill as ApiFill, runningTotal);
    runningTotal += mappedFill.quantity;
    return mappedFill;
  });

  return {
    ...mapped,
    fills: mappedFills,
  };
}

export async function fetchExecutionEvents(executionId: string): Promise<ExecutionEvent[]> {
  const result = await fetchJson<{ events: ApiEvent[] }>(
    `/api/events?aggregateType=Execution&aggregateId=${executionId}`
  );

  return (result.events || []).map((event) => ({
    eventId: String(event.eventId ?? ""),
    executionId,
    eventType: String(event.eventType ?? "ExecutionRequested") as ExecutionEvent["eventType"],
    timestamp: parseDate(event.occurredAt),
    payload: (event.payload as Record<string, unknown>) || {},
    description: String(event.explanation ?? ""),
  }));
}

export function summarizeExecutions(executions: Execution[]): ExecutionSummary {
  const filledExecutions = executions.filter(
    (execution) => execution.status === "FILLED" || execution.status === "SETTLED"
  );

  const totalSlippage = filledExecutions.reduce(
    (sum, execution) => sum + (execution.slippageBreakdown?.total || 0),
    0
  );

  return {
    total: executions.length,
    pending: executions.filter((e) => e.status === "PENDING").length,
    simulating: executions.filter((e) => e.status === "SIMULATING").length,
    partiallyFilled: executions.filter((e) => e.status === "PARTIALLY_FILLED").length,
    filled: executions.filter((e) => e.status === "FILLED").length,
    settled: executions.filter((e) => e.status === "SETTLED").length,
    cancelled: executions.filter((e) => e.status === "CANCELLED").length,
    totalFilledQuantity: executions.reduce((sum, e) => sum + e.filledQuantity, 0),
    totalSlippageBp: totalSlippage,
    avgSlippageBp: filledExecutions.length > 0 ? totalSlippage / filledExecutions.length : 0,
  };
}
