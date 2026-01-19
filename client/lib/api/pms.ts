/**
 * PMS API Client
 *
 * Client-side API for Portfolio Management System operations.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type TargetScope = "account" | "household";

export interface BucketWeights {
  "0-2y": number;
  "2-5y": number;
  "5-10y": number;
  "10-20y": number;
  "20y+": number;
}

export interface TargetConstraints {
  minPositionSize?: number;
  maxPositionSize?: number;
  maxTurnover?: number;
  blacklist?: string[];
}

export interface SetTargetRequest {
  scope: TargetScope;
  scopeId: string;
  modelId?: string;
  durationTarget: number;
  bucketWeights: BucketWeights;
  constraints?: TargetConstraints;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdBy: string;
}

export interface RunOptimizationRequest {
  scope: TargetScope;
  scopeId: string;
  targetId?: string;
  modelId?: string;
  durationTarget: number;
  bucketWeights: BucketWeights;
  constraints?: TargetConstraints;
  assumptions: string;
  asOfDate?: string;
  requestedBy: string;
}

export interface ProposalTrade {
  side: "BUY" | "SELL";
  instrumentId: string;
  cusip?: string;
  description?: string;
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
}

export interface PortfolioAnalytics {
  totalMarketValue: number;
  totalDuration: number;
  totalDv01: number;
  cashBalance: number;
  cashPercentage: number;
  bucketWeights: BucketWeights;
}

export interface AccountView {
  account: {
    accountId: string;
    householdId: string;
    name: string;
    accountType: string;
    modelId?: string;
    createdAt: string;
    createdBy: string;
  };
  positions: Array<{
    accountId: string;
    instrumentId: string;
    cusip: string;
    description: string;
    quantity: number;
    avgCost: number;
    marketValue: number;
    duration: number;
    dv01: number;
  }>;
  analytics: PortfolioAnalytics;
  asOfDate: string;
}

export interface HouseholdView {
  household: {
    householdId: string;
    name: string;
    createdAt: string;
    createdBy: string;
  };
  accounts: Array<{
    accountId: string;
    householdId: string;
    name: string;
    accountType: string;
    createdAt: string;
    createdBy: string;
  }>;
  positions: Array<{
    accountId: string;
    instrumentId: string;
    cusip: string;
    description: string;
    quantity: number;
    avgCost: number;
    marketValue: number;
    duration: number;
    dv01: number;
  }>;
  analytics: PortfolioAnalytics;
  asOfDate: string;
}

export interface AccountsResponse {
  accounts: Array<{
    accountId: string;
    householdId: string;
    name: string;
    accountType: string;
    createdAt: string;
    createdBy: string;
    modelId?: string;
    householdName?: string;
    marketValue: number;
    duration: number;
    lastActivity: string;
  }>;
  count: number;
}

export interface HouseholdsResponse {
  households: Array<{
    householdId: string;
    name: string;
    createdAt: string;
    createdBy: string;
    accountCount: number;
    totalMarketValue: number;
    lastActivity: string;
  }>;
  count: number;
}

export interface Proposal {
  proposalId: string;
  accountId?: string;
  householdId?: string;
  asOfDate: string;
  targetId?: string;
  trades: ProposalTrade[];
  currentAnalytics: PortfolioAnalytics;
  predictedAnalytics: PortfolioAnalytics;
  assumptions: string;
  status: string;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  sentToOmsAt?: string;
}

export interface ProposalsResponse {
  proposals: Proposal[];
  count: number;
}

export interface DriftResponse {
  drift: Array<{
    accountId: string;
    asOfDate: string;
    currentDuration: number;
    targetDuration: number;
    durationDrift: number;
    bucketDrifts: BucketWeights;
    overallDrift: number;
    lastRebalancedAt?: string;
  }>;
  count: number;
}

export async function setTarget(request: SetTargetRequest) {
  const response = await fetch(`${API_BASE_URL}/api/pms/targets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set target");
  }

  return response.json();
}

export async function runOptimization(request: RunOptimizationRequest) {
  const response = await fetch(`${API_BASE_URL}/api/pms/optimization`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to run optimization");
  }

  return response.json();
}

export async function approveProposal(proposalId: string, approvedBy: string) {
  const response = await fetch(`${API_BASE_URL}/api/pms/proposals/${proposalId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approvedBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to approve proposal");
  }

  return response.json();
}

export async function sendProposalToOms(proposalId: string, sentBy: string) {
  const response = await fetch(`${API_BASE_URL}/api/pms/proposals/${proposalId}/send-to-oms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sentBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send proposal to OMS");
  }

  return response.json();
}

export async function getAccountView(accountId: string): Promise<AccountView> {
  const response = await fetch(`${API_BASE_URL}/api/views/accounts/${accountId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load account view");
  }
  return response.json();
}

export async function getHouseholdView(householdId: string): Promise<HouseholdView> {
  const response = await fetch(`${API_BASE_URL}/api/views/households/${householdId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load household view");
  }
  return response.json();
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  const response = await fetch(`${API_BASE_URL}/api/views/proposals/${proposalId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load proposal");
  }
  return response.json();
}

export async function getProposals(): Promise<ProposalsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/views/proposals`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load proposals");
  }
  return response.json();
}

export async function getAccounts(): Promise<AccountsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/views/accounts`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load accounts");
  }
  return response.json();
}

export async function getHouseholds(): Promise<HouseholdsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/views/households`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load households");
  }
  return response.json();
}

export async function getDrift(): Promise<DriftResponse> {
  const response = await fetch(`${API_BASE_URL}/api/views/drift`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to load drift");
  }
  return response.json();
}
