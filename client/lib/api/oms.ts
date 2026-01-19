/**
 * OMS API Client
 *
 * Client-side API for Order Management System operations.
 * Handles all communication with the backend OMS service.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'CURVE_RELATIVE';
export type TimeInForce = 'DAY' | 'IOC';
export type OrderState =
  | 'DRAFT'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'SETTLED';

export interface CreateOrderRequest {
  accountId: string;
  instrumentId: string; // CUSIP
  side: OrderSide;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  curveSpreadBp?: number;
  timeInForce: TimeInForce;
  batchId?: string;
  createdBy: string;
}

export interface AmendOrderRequest {
  quantity?: number;
  orderType?: OrderType;
  limitPrice?: number;
  curveSpreadBp?: number;
  updatedBy: string;
}

export interface Order {
  orderId: string;
  accountId: string;
  accountName?: string;
  householdId?: string;
  instrumentId: string;
  instrumentName?: string;
  cusip?: string;
  instrumentType?: string;
  side: OrderSide;
  quantity: number;
  orderType: OrderType;
  limitPrice?: number;
  curveSpreadBp?: number;
  timeInForce: TimeInForce;
  state: OrderState;
  batchId?: string;
  complianceResult?: ComplianceResult;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  lastStateChangeAt: string;
  sentToEmsAt?: string;
  fullyFilledAt?: string;
  settledAt?: string;
  events?: any[];
}

export interface ComplianceResult {
  status: 'PASS' | 'WARN' | 'BLOCK';
  rulesPassed?: string[];
  warnings?: ComplianceViolation[];
  blocks?: ComplianceViolation[];
  checkedAt: string;
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  description: string;
  metrics?: Record<string, any>;
}

export interface BlotterFilters {
  accountId?: string;
  householdId?: string;
  state?: OrderState;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface BlotterResponse {
  orders: Order[];
  count: number;
}

export interface OrderResponse {
  orderId: string;
  correlationId: string;
  status: string;
}

export interface BulkCreateResponse {
  batchId: string;
  correlationId: string;
  results: Array<{
    orderId?: string;
    status: string;
    error?: string;
  }>;
}

/**
 * Create a new order
 */
export async function createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }

  return response.json();
}

/**
 * Amend an existing order
 */
export async function amendOrder(orderId: string, request: AmendOrderRequest): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders/${orderId}/amend`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to amend order');
  }

  return response.json();
}

/**
 * Approve an order
 */
export async function approveOrder(orderId: string, approvedBy: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders/${orderId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ approvedBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve order');
  }

  return response.json();
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string, cancelledBy: string, reason?: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelledBy, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel order');
  }

  return response.json();
}

/**
 * Send an approved order to EMS
 */
export async function sendToEMS(orderId: string, sentBy: string): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders/${orderId}/send-to-ems`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sentBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send order to EMS');
  }

  return response.json();
}

/**
 * Get blotter (list of orders)
 */
export async function getBlotter(filters?: BlotterFilters): Promise<BlotterResponse> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.accountId) params.append('accountId', filters.accountId);
    if (filters.householdId) params.append('householdId', filters.householdId);
    if (filters.state) params.append('state', filters.state);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
  }

  const url = `${API_BASE_URL}/api/views/blotter${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch blotter');
  }

  return response.json();
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/api/views/orders/${orderId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch order');
  }

  return response.json();
}

/**
 * Get orders by batch ID
 */
export async function getOrdersByBatchId(batchId: string): Promise<{
  batchId: string;
  orders: Order[];
  count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/views/orders/batch/${batchId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch batch orders');
  }

  return response.json();
}

/**
 * Bulk create orders
 */
export async function bulkCreateOrders(orders: CreateOrderRequest[], createdBy: string): Promise<BulkCreateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/oms/orders/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orders, createdBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to bulk create orders');
  }

  return response.json();
}
