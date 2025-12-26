// Position is computed from execution events, stored in projection view for performance
export interface Position {
  accountId: string;
  instrumentId: string;
  cusip: string;
  description: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  duration: number;
  dv01: number;
}

export interface PortfolioAnalytics {
  totalMarketValue: number;
  totalDuration: number;
  totalDv01: number;
  cashBalance: number;
  cashPercentage: number;
  bucketWeights: BucketWeights;
}

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

export interface ProposalTrade {
  side: "BUY" | "SELL";
  instrumentId: string;
  cusip: string;
  description: string;
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
}

export interface PortfolioDrift {
  accountId: string;
  asOfDate: Date;
  currentDuration: number;
  targetDuration: number;
  durationDrift: number;
  bucketDrifts: BucketWeights;
  overallDrift: number;
  lastRebalancedAt?: Date;
}

export interface HouseholdWithStats {
  householdId: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  accountCount: number;
  totalMarketValue: number;
  lastActivity: Date;
}

export interface AccountWithStats {
  accountId: string;
  householdId: string;
  name: string;
  accountType: string; // account_type enum from Prisma
  createdAt: Date;
  createdBy: string;
  modelId?: string;
  householdName: string;
  marketValue: number;
  duration: number;
  lastActivity: Date;
}

export interface DriftStatus {
  status: "in_tolerance" | "warning" | "out_of_tolerance";
  color: "green" | "yellow" | "red";
}

// Types that exist in mock data but may be moved to Prisma later

export interface Household {
  householdId: string;
  name: string;
  createdAt: Date;
  createdBy: string;
}

export type AccountType = "individual" | "joint" | "trust" | "ira" | "401k" | "corporate";

export interface Account {
  accountId: string;
  householdId: string;
  name: string;
  accountType: AccountType;
  createdAt: Date;
  createdBy: string;
  modelId?: string;
}

export interface PortfolioTarget {
  targetId: string;
  scope: "account" | "household";
  scopeId: string;
  modelId?: string;
  durationTarget: number;
  bucketWeights: BucketWeights;
  constraints?: TargetConstraints;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface PortfolioModel {
  modelId: string;
  name: string;
  description?: string;
  durationTarget: number;
  bucketWeights: BucketWeights;
  constraints?: TargetConstraints;
  assignedAccountIds: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export type ProposalStatus = "DRAFT" | "APPROVED" | "REJECTED" | "SENT_TO_OMS";

export interface Proposal {
  proposalId: string;
  accountId?: string;
  householdId?: string;
  asOfDate: Date;
  targetId?: string;
  trades: ProposalTrade[];
  currentAnalytics: PortfolioAnalytics;
  predictedAnalytics: PortfolioAnalytics;
  assumptions: string;
  status: ProposalStatus;
  createdAt: Date;
  createdBy: string;
  approvedAt?: Date;
  approvedBy?: string;
  sentToOmsAt?: Date;
}

export type RebalancingRuleType = "DRIFT_BASED" | "TIME_BASED" | "EVENT_BASED";

export interface RebalancingRule {
  ruleId: string;
  name: string;
  type: RebalancingRuleType;
  scope: "account" | "household" | "all";
  scopeId?: string;
  modelId?: string;
  driftThreshold?: number;
  schedule?: string;
  autoApprove: boolean;
  enabled: boolean;
  createdAt: Date;
  createdBy: string;
  lastTriggeredAt?: Date;
}
