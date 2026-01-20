import type {
  EvaluationPoint,
  EvaluationResult,
  MetricInfo,
  OperatorInfo,
  RuleScope,
  RuleSeverity,
  RuleStatus,
} from "./types";

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

export const operatorDefinitions: OperatorInfo[] = [
  { id: "<=", label: "Less than or equal", description: "Value must be at most threshold" },
  { id: ">=", label: "Greater than or equal", description: "Value must be at least threshold" },
  { id: "<", label: "Less than", description: "Value must be less than threshold" },
  { id: ">", label: "Greater than", description: "Value must exceed threshold" },
  { id: "==", label: "Equals", description: "Value must equal threshold" },
  { id: "!=", label: "Not equals", description: "Value must not equal threshold" },
  { id: "in", label: "In list", description: "Value must be in the specified list" },
];

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
