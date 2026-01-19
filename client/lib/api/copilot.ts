/**
 * Copilot API Client
 *
 * Client-side API for AI Copilot operations.
 * Handles communication with the Python agent service.
 */

const COPILOT_API_URL = process.env.NEXT_PUBLIC_COPILOT_URL || 'http://localhost:8000';
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ============================================================================
// Types
// ============================================================================

export interface Command {
  commandType: string;
  payload: Record<string, unknown>;
  endpoint?: string;
}

export interface Rationale {
  summary: string;
  reasoning: string;
  alternatives: string[];
}

export interface CommandPlan {
  planId: string;
  commands: Command[];
  expectedEvents: string[];
  rationale: Rationale;
  assumptions: string[];
  confidence: number;
  route?: string;
  queryParams?: Record<string, string>;
  createdAt: string;
}

export interface ProposeRequest {
  query: string;
  context?: {
    currentRoute?: string;
    selectedAccountId?: string;
    selectedOrderId?: string;
    selectedInstrumentId?: string;
    [key: string]: unknown;
  };
  userId?: string;
}

export interface ExecuteRequest {
  planId: string;
  commands: Command[];
  userId: string;
}

export interface CommandResult {
  commandType: string;
  success: boolean;
  response?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionResult {
  planId: string;
  success: boolean;
  results: CommandResult[];
  correlationId: string;
  error?: string;
}

export interface SystemContext {
  accounts: Array<{
    accountId: string;
    name: string;
    householdId: string;
  }>;
  instruments: Array<{
    cusip: string;
    description: string;
  }>;
  recentOrders: Array<{
    orderId: string;
    instrumentId: string;
    side: string;
    quantity: number;
    state: string;
  }>;
  timestamp: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Generate a command plan from natural language
 */
export async function proposeCommands(request: ProposeRequest): Promise<CommandPlan> {
  const response = await fetch(`${COPILOT_API_URL}/copilot/propose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: request.query,
      context: request.context || {},
      userId: request.userId || 'user',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || error.error || 'Failed to generate command plan');
  }

  return response.json();
}

/**
 * Execute an approved command plan
 */
export async function executeCommands(request: ExecuteRequest): Promise<ExecutionResult> {
  const response = await fetch(`${COPILOT_API_URL}/copilot/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || error.error || 'Failed to execute command plan');
  }

  return response.json();
}

/**
 * Get current system context for the copilot
 */
export async function getSystemContext(): Promise<SystemContext> {
  const response = await fetch(`${COPILOT_API_URL}/copilot/context`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || error.error || 'Failed to get system context');
  }

  return response.json();
}

/**
 * Check if the copilot service is healthy
 */
export async function checkCopilotHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${COPILOT_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Event Storage (via Backend API)
// ============================================================================

/**
 * Store an AIDraftProposed event
 */
export async function storeAIDraftProposed(
  planId: string,
  plan: CommandPlan,
  userId: string
): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/api/copilot/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventType: 'AIDraftProposed',
      planId,
      plan,
      userId,
    }),
  });

  if (!response.ok) {
    console.warn('Failed to store AIDraftProposed event');
  }
}

/**
 * Store an AIDraftApproved event
 */
export async function storeAIDraftApproved(
  planId: string,
  userId: string
): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/api/copilot/drafts/${planId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
    }),
  });

  if (!response.ok) {
    console.warn('Failed to store AIDraftApproved event');
  }
}

/**
 * Store an AIDraftRejected event
 */
export async function storeAIDraftRejected(
  planId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const response = await fetch(`${BACKEND_API_URL}/api/copilot/drafts/${planId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      reason,
    }),
  });

  if (!response.ok) {
    console.warn('Failed to store AIDraftRejected event');
  }
}
