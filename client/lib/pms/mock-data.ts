import {
  Household,
  Account,
  Position,
  PortfolioModel,
  PortfolioTarget,
  Proposal,
  PortfolioDrift,
  RebalancingRule,
  HouseholdWithStats,
  AccountWithStats,
  PortfolioAnalytics,
  BucketWeights,
} from "./types";

// Sample Households
export const households: Household[] = [
  {
    householdId: "hh-001",
    name: "Johnson Family Trust",
    createdAt: new Date("2024-01-15"),
    createdBy: "advisor@instant.com",
  },
  {
    householdId: "hh-002",
    name: "Smith Retirement Holdings",
    createdAt: new Date("2024-02-20"),
    createdBy: "advisor@instant.com",
  },
  {
    householdId: "hh-003",
    name: "Chen Investment Group",
    createdAt: new Date("2024-03-10"),
    createdBy: "advisor@instant.com",
  },
  {
    householdId: "hh-004",
    name: "Williams Estate",
    createdAt: new Date("2024-04-05"),
    createdBy: "advisor@instant.com",
  },
  {
    householdId: "hh-005",
    name: "Garcia Family Office",
    createdAt: new Date("2024-05-12"),
    createdBy: "advisor@instant.com",
  },
];

// Sample Accounts
export const accounts: Account[] = [
  {
    accountId: "acc-001",
    householdId: "hh-001",
    name: "Johnson Trust - Core Fixed Income",
    accountType: "trust",
    createdAt: new Date("2024-01-15"),
    createdBy: "advisor@instant.com",
    modelId: "model-001",
  },
  {
    accountId: "acc-002",
    householdId: "hh-001",
    name: "Johnson IRA",
    accountType: "ira",
    createdAt: new Date("2024-01-16"),
    createdBy: "advisor@instant.com",
    modelId: "model-002",
  },
  {
    accountId: "acc-003",
    householdId: "hh-002",
    name: "Smith 401(k)",
    accountType: "401k",
    createdAt: new Date("2024-02-20"),
    createdBy: "advisor@instant.com",
    modelId: "model-001",
  },
  {
    accountId: "acc-004",
    householdId: "hh-002",
    name: "Smith Joint Account",
    accountType: "joint",
    createdAt: new Date("2024-02-22"),
    createdBy: "advisor@instant.com",
  },
  {
    accountId: "acc-005",
    householdId: "hh-003",
    name: "Chen Corporate Holdings",
    accountType: "corporate",
    createdAt: new Date("2024-03-10"),
    createdBy: "advisor@instant.com",
    modelId: "model-003",
  },
  {
    accountId: "acc-006",
    householdId: "hh-003",
    name: "Chen Individual",
    accountType: "individual",
    createdAt: new Date("2024-03-12"),
    createdBy: "advisor@instant.com",
  },
  {
    accountId: "acc-007",
    householdId: "hh-004",
    name: "Williams Estate Trust",
    accountType: "trust",
    createdAt: new Date("2024-04-05"),
    createdBy: "advisor@instant.com",
    modelId: "model-002",
  },
  {
    accountId: "acc-008",
    householdId: "hh-005",
    name: "Garcia Family Trust",
    accountType: "trust",
    createdAt: new Date("2024-05-12"),
    createdBy: "advisor@instant.com",
    modelId: "model-001",
  },
  {
    accountId: "acc-009",
    householdId: "hh-005",
    name: "Garcia IRA",
    accountType: "ira",
    createdAt: new Date("2024-05-15"),
    createdBy: "advisor@instant.com",
  },
  {
    accountId: "acc-010",
    householdId: "hh-005",
    name: "Garcia Joint",
    accountType: "joint",
    createdAt: new Date("2024-05-18"),
    createdBy: "advisor@instant.com",
    modelId: "model-003",
  },
];

// Sample Positions
export const positions: Position[] = [
  // Account acc-001 (Johnson Trust)
  { accountId: "acc-001", instrumentId: "inst-001", cusip: "912828ZT", description: "US Treasury 2.5% 2026", quantity: 100000, avgCost: 98.50, marketValue: 99250, duration: 1.8, dv01: 178.65 },
  { accountId: "acc-001", instrumentId: "inst-002", cusip: "38376HRK", description: "Goldman Sachs 3.75% 2028", quantity: 50000, avgCost: 97.25, marketValue: 48875, duration: 3.2, dv01: 156.40 },
  { accountId: "acc-001", instrumentId: "inst-003", cusip: "46625HRL", description: "JPMorgan 4.125% 2030", quantity: 75000, avgCost: 96.80, marketValue: 73500, duration: 5.1, dv01: 374.85 },
  { accountId: "acc-001", instrumentId: "inst-004", cusip: "06051GHF", description: "Bank of America 4.5% 2032", quantity: 60000, avgCost: 95.50, marketValue: 58200, duration: 6.8, dv01: 395.76 },
  { accountId: "acc-001", instrumentId: "inst-005", cusip: "17275RBP", description: "Cisco Systems 4.0% 2027", quantity: 40000, avgCost: 99.10, marketValue: 39880, duration: 2.5, dv01: 99.70 },

  // Account acc-002 (Johnson IRA)
  { accountId: "acc-002", instrumentId: "inst-006", cusip: "912828YV", description: "US Treasury 3.0% 2029", quantity: 80000, avgCost: 97.80, marketValue: 79040, duration: 4.2, dv01: 332.00 },
  { accountId: "acc-002", instrumentId: "inst-007", cusip: "594918BQ", description: "Microsoft 3.5% 2035", quantity: 45000, avgCost: 94.20, marketValue: 43290, duration: 8.5, dv01: 367.96 },
  { accountId: "acc-002", instrumentId: "inst-008", cusip: "037833AK", description: "Apple 2.85% 2027", quantity: 55000, avgCost: 98.50, marketValue: 54725, duration: 2.8, dv01: 153.23 },

  // Account acc-003 (Smith 401k)
  { accountId: "acc-003", instrumentId: "inst-001", cusip: "912828ZT", description: "US Treasury 2.5% 2026", quantity: 150000, avgCost: 98.75, marketValue: 149625, duration: 1.8, dv01: 269.33 },
  { accountId: "acc-003", instrumentId: "inst-009", cusip: "78009PAZ", description: "Royal Bank of Canada 3.2% 2028", quantity: 70000, avgCost: 97.00, marketValue: 69300, duration: 3.5, dv01: 242.55 },
  { accountId: "acc-003", instrumentId: "inst-010", cusip: "404280BF", description: "HSBC Holdings 4.25% 2031", quantity: 55000, avgCost: 95.80, marketValue: 53680, duration: 5.8, dv01: 311.34 },

  // Account acc-004 (Smith Joint)
  { accountId: "acc-004", instrumentId: "inst-011", cusip: "89114QCC", description: "Toronto-Dominion 2.65% 2027", quantity: 40000, avgCost: 98.20, marketValue: 39680, duration: 2.6, dv01: 103.17 },
  { accountId: "acc-004", instrumentId: "inst-012", cusip: "91282CBA", description: "US Treasury 4.0% 2033", quantity: 60000, avgCost: 96.50, marketValue: 58500, duration: 7.2, dv01: 421.20 },

  // Account acc-005 (Chen Corporate)
  { accountId: "acc-005", instrumentId: "inst-013", cusip: "30231GAV", description: "Exxon Mobil 3.482% 2030", quantity: 100000, avgCost: 96.20, marketValue: 97500, duration: 5.0, dv01: 487.50 },
  { accountId: "acc-005", instrumentId: "inst-014", cusip: "172967KZ", description: "Citigroup 4.412% 2031", quantity: 80000, avgCost: 95.50, marketValue: 77600, duration: 5.5, dv01: 426.80 },
  { accountId: "acc-005", instrumentId: "inst-015", cusip: "91282CBB", description: "US Treasury 3.875% 2034", quantity: 120000, avgCost: 95.00, marketValue: 116400, duration: 8.2, dv01: 954.48 },

  // Account acc-006 (Chen Individual)
  { accountId: "acc-006", instrumentId: "inst-002", cusip: "38376HRK", description: "Goldman Sachs 3.75% 2028", quantity: 30000, avgCost: 97.50, marketValue: 29550, duration: 3.2, dv01: 94.56 },
  { accountId: "acc-006", instrumentId: "inst-016", cusip: "459058GH", description: "Intel Corp 4.0% 2029", quantity: 25000, avgCost: 97.80, marketValue: 24700, duration: 4.0, dv01: 98.80 },

  // Account acc-007 (Williams Estate)
  { accountId: "acc-007", instrumentId: "inst-017", cusip: "91282CBC", description: "US Treasury 4.25% 2040", quantity: 200000, avgCost: 93.50, marketValue: 190000, duration: 12.5, dv01: 2375.00 },
  { accountId: "acc-007", instrumentId: "inst-018", cusip: "822582BQ", description: "Shell Finance 4.125% 2035", quantity: 75000, avgCost: 94.80, marketValue: 72300, duration: 8.8, dv01: 636.24 },

  // Account acc-008 (Garcia Family Trust)
  { accountId: "acc-008", instrumentId: "inst-001", cusip: "912828ZT", description: "US Treasury 2.5% 2026", quantity: 200000, avgCost: 98.60, marketValue: 198400, duration: 1.8, dv01: 357.12 },
  { accountId: "acc-008", instrumentId: "inst-019", cusip: "68389XBQ", description: "Oracle Corp 3.25% 2030", quantity: 60000, avgCost: 96.50, marketValue: 58800, duration: 5.2, dv01: 305.76 },
  { accountId: "acc-008", instrumentId: "inst-020", cusip: "713448EQ", description: "PepsiCo 3.0% 2028", quantity: 45000, avgCost: 97.80, marketValue: 44550, duration: 3.4, dv01: 151.47 },

  // Account acc-009 (Garcia IRA)
  { accountId: "acc-009", instrumentId: "inst-006", cusip: "912828YV", description: "US Treasury 3.0% 2029", quantity: 50000, avgCost: 97.60, marketValue: 49400, duration: 4.2, dv01: 207.48 },
  { accountId: "acc-009", instrumentId: "inst-021", cusip: "931142EK", description: "Walmart 3.55% 2032", quantity: 35000, avgCost: 96.20, marketValue: 34230, duration: 6.5, dv01: 222.50 },

  // Account acc-010 (Garcia Joint)
  { accountId: "acc-010", instrumentId: "inst-022", cusip: "91282CBD", description: "US Treasury 4.5% 2038", quantity: 90000, avgCost: 94.20, marketValue: 86580, duration: 10.8, dv01: 935.06 },
  { accountId: "acc-010", instrumentId: "inst-023", cusip: "88579YBA", description: "3M Company 3.7% 2030", quantity: 40000, avgCost: 96.80, marketValue: 39120, duration: 5.0, dv01: 195.60 },
];

// Sample Portfolio Models
export const portfolioModels: PortfolioModel[] = [
  {
    modelId: "model-001",
    name: "Conservative Fixed Income",
    description: "Low duration, high credit quality bond portfolio focused on capital preservation",
    durationTarget: 3.5,
    bucketWeights: { "0-2y": 40, "2-5y": 35, "5-10y": 20, "10-20y": 5, "20y+": 0 },
    constraints: { maxPositionSize: 10, maxTurnover: 20 },
    assignedAccountIds: ["acc-001", "acc-003", "acc-008"],
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-06-15"),
    updatedBy: "advisor@instant.com",
  },
  {
    modelId: "model-002",
    name: "Moderate Duration",
    description: "Balanced duration exposure across the yield curve for moderate income and growth",
    durationTarget: 5.5,
    bucketWeights: { "0-2y": 20, "2-5y": 30, "5-10y": 30, "10-20y": 15, "20y+": 5 },
    constraints: { maxPositionSize: 15 },
    assignedAccountIds: ["acc-002", "acc-007"],
    createdAt: new Date("2024-01-15"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-05-20"),
    updatedBy: "advisor@instant.com",
  },
  {
    modelId: "model-003",
    name: "Long Duration Growth",
    description: "Extended duration portfolio for long-term growth and income maximization",
    durationTarget: 8.0,
    bucketWeights: { "0-2y": 10, "2-5y": 15, "5-10y": 30, "10-20y": 30, "20y+": 15 },
    constraints: { maxPositionSize: 12, maxTurnover: 25 },
    assignedAccountIds: ["acc-005", "acc-010"],
    createdAt: new Date("2024-02-01"),
    createdBy: "advisor@instant.com",
    updatedAt: new Date("2024-04-10"),
    updatedBy: "advisor@instant.com",
  },
];

// Sample Portfolio Targets
export const portfolioTargets: PortfolioTarget[] = [
  {
    targetId: "target-001",
    scope: "account",
    scopeId: "acc-001",
    modelId: "model-001",
    durationTarget: 3.5,
    bucketWeights: { "0-2y": 40, "2-5y": 35, "5-10y": 20, "10-20y": 5, "20y+": 0 },
    effectiveFrom: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    createdBy: "advisor@instant.com",
  },
  {
    targetId: "target-002",
    scope: "household",
    scopeId: "hh-002",
    durationTarget: 4.5,
    bucketWeights: { "0-2y": 30, "2-5y": 35, "5-10y": 25, "10-20y": 10, "20y+": 0 },
    effectiveFrom: new Date("2024-02-20"),
    createdAt: new Date("2024-02-20"),
    createdBy: "advisor@instant.com",
  },
  {
    targetId: "target-003",
    scope: "account",
    scopeId: "acc-005",
    modelId: "model-003",
    durationTarget: 8.0,
    bucketWeights: { "0-2y": 10, "2-5y": 15, "5-10y": 30, "10-20y": 30, "20y+": 15 },
    effectiveFrom: new Date("2024-03-10"),
    createdAt: new Date("2024-03-10"),
    createdBy: "advisor@instant.com",
  },
];

// Sample Proposals
export const proposals: Proposal[] = [
  {
    proposalId: "prop-001",
    accountId: "acc-001",
    asOfDate: new Date("2024-12-20"),
    targetId: "target-001",
    trades: [
      { side: "SELL", instrumentId: "inst-004", cusip: "06051GHF", description: "Bank of America 4.5% 2032", quantity: 20000, estimatedPrice: 97.00, estimatedValue: 19400 },
      { side: "BUY", instrumentId: "inst-001", cusip: "912828ZT", description: "US Treasury 2.5% 2026", quantity: 20000, estimatedPrice: 99.25, estimatedValue: 19850 },
    ],
    currentAnalytics: {
      totalMarketValue: 319705,
      totalDuration: 4.2,
      totalDv01: 1204.36,
      cashBalance: 15000,
      cashPercentage: 4.5,
      bucketWeights: { "0-2y": 32, "2-5y": 28, "5-10y": 25, "10-20y": 15, "20y+": 0 },
    },
    predictedAnalytics: {
      totalMarketValue: 319705,
      totalDuration: 3.6,
      totalDv01: 1080.50,
      cashBalance: 14550,
      cashPercentage: 4.4,
      bucketWeights: { "0-2y": 38, "2-5y": 30, "5-10y": 22, "10-20y": 10, "20y+": 0 },
    },
    assumptions: "Optimization targets Conservative Fixed Income model. Reducing long-duration exposure to move closer to 3.5yr duration target.",
    status: "DRAFT",
    createdAt: new Date("2024-12-20"),
    createdBy: "advisor@instant.com",
  },
  {
    proposalId: "prop-002",
    householdId: "hh-002",
    asOfDate: new Date("2024-12-18"),
    targetId: "target-002",
    trades: [
      { side: "BUY", instrumentId: "inst-003", cusip: "46625HRL", description: "JPMorgan 4.125% 2030", quantity: 30000, estimatedPrice: 97.50, estimatedValue: 29250 },
      { side: "SELL", instrumentId: "inst-001", cusip: "912828ZT", description: "US Treasury 2.5% 2026", quantity: 25000, estimatedPrice: 99.20, estimatedValue: 24800 },
    ],
    currentAnalytics: {
      totalMarketValue: 370785,
      totalDuration: 3.8,
      totalDv01: 1347.59,
      cashBalance: 22000,
      cashPercentage: 5.6,
      bucketWeights: { "0-2y": 45, "2-5y": 30, "5-10y": 20, "10-20y": 5, "20y+": 0 },
    },
    predictedAnalytics: {
      totalMarketValue: 370785,
      totalDuration: 4.4,
      totalDv01: 1520.00,
      cashBalance: 17550,
      cashPercentage: 4.5,
      bucketWeights: { "0-2y": 38, "2-5y": 32, "5-10y": 24, "10-20y": 6, "20y+": 0 },
    },
    assumptions: "Household-level optimization to increase duration toward 4.5yr target. Shifting from short-duration treasuries to intermediate corporates.",
    status: "APPROVED",
    createdAt: new Date("2024-12-18"),
    createdBy: "advisor@instant.com",
    approvedAt: new Date("2024-12-19"),
    approvedBy: "advisor@instant.com",
  },
  {
    proposalId: "prop-003",
    accountId: "acc-007",
    asOfDate: new Date("2024-12-15"),
    trades: [
      { side: "BUY", instrumentId: "inst-017", cusip: "91282CBC", description: "US Treasury 4.25% 2040", quantity: 50000, estimatedPrice: 93.80, estimatedValue: 46900 },
    ],
    currentAnalytics: {
      totalMarketValue: 262300,
      totalDuration: 10.8,
      totalDv01: 3011.24,
      cashBalance: 55000,
      cashPercentage: 17.3,
      bucketWeights: { "0-2y": 5, "2-5y": 10, "5-10y": 25, "10-20y": 40, "20y+": 20 },
    },
    predictedAnalytics: {
      totalMarketValue: 262300,
      totalDuration: 11.2,
      totalDv01: 3250.00,
      cashBalance: 8100,
      cashPercentage: 3.0,
      bucketWeights: { "0-2y": 3, "2-5y": 8, "5-10y": 22, "10-20y": 42, "20y+": 25 },
    },
    assumptions: "Deploying excess cash into long-duration treasuries to match liability profile.",
    status: "SENT_TO_OMS",
    createdAt: new Date("2024-12-15"),
    createdBy: "advisor@instant.com",
    approvedAt: new Date("2024-12-16"),
    approvedBy: "advisor@instant.com",
    sentToOmsAt: new Date("2024-12-17"),
  },
];

// Sample Portfolio Drift
export const portfolioDrift: PortfolioDrift[] = [
  {
    accountId: "acc-001",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 4.2,
    targetDuration: 3.5,
    durationDrift: 20.0,
    bucketDrifts: { "0-2y": -8, "2-5y": -7, "5-10y": 5, "10-20y": 10, "20y+": 0 },
    overallDrift: 15.5,
    lastRebalancedAt: new Date("2024-11-15"),
  },
  {
    accountId: "acc-002",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 5.2,
    targetDuration: 5.5,
    durationDrift: 5.5,
    bucketDrifts: { "0-2y": 2, "2-5y": -3, "5-10y": 1, "10-20y": 0, "20y+": 0 },
    overallDrift: 4.2,
    lastRebalancedAt: new Date("2024-12-01"),
  },
  {
    accountId: "acc-003",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 3.6,
    targetDuration: 3.5,
    durationDrift: 2.9,
    bucketDrifts: { "0-2y": -2, "2-5y": 1, "5-10y": 1, "10-20y": 0, "20y+": 0 },
    overallDrift: 2.1,
    lastRebalancedAt: new Date("2024-12-10"),
  },
  {
    accountId: "acc-005",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 6.5,
    targetDuration: 8.0,
    durationDrift: 18.8,
    bucketDrifts: { "0-2y": 5, "2-5y": 5, "5-10y": -5, "10-20y": -3, "20y+": -2 },
    overallDrift: 14.2,
    lastRebalancedAt: new Date("2024-10-20"),
  },
  {
    accountId: "acc-007",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 10.8,
    targetDuration: 5.5,
    durationDrift: 96.4,
    bucketDrifts: { "0-2y": -15, "2-5y": -20, "5-10y": -5, "10-20y": 25, "20y+": 15 },
    overallDrift: 52.0,
  },
  {
    accountId: "acc-008",
    asOfDate: new Date("2024-12-24"),
    currentDuration: 3.2,
    targetDuration: 3.5,
    durationDrift: 8.6,
    bucketDrifts: { "0-2y": 5, "2-5y": -2, "5-10y": -2, "10-20y": -1, "20y+": 0 },
    overallDrift: 5.8,
    lastRebalancedAt: new Date("2024-11-28"),
  },
];

// Sample Rebalancing Rules
export const rebalancingRules: RebalancingRule[] = [
  {
    ruleId: "rule-001",
    name: "Monthly Portfolio Review",
    type: "TIME_BASED",
    scope: "all",
    schedule: "0 9 1 * *",
    autoApprove: false,
    enabled: true,
    createdAt: new Date("2024-01-01"),
    createdBy: "advisor@instant.com",
    lastTriggeredAt: new Date("2024-12-01"),
  },
  {
    ruleId: "rule-002",
    name: "High Drift Alert",
    type: "DRIFT_BASED",
    scope: "all",
    driftThreshold: 15,
    autoApprove: false,
    enabled: true,
    createdAt: new Date("2024-01-15"),
    createdBy: "advisor@instant.com",
    lastTriggeredAt: new Date("2024-12-20"),
  },
];

// Helper functions to get computed data

export function getHouseholdsWithStats(): HouseholdWithStats[] {
  return households.map((household) => {
    const householdAccounts = accounts.filter((a) => a.householdId === household.householdId);
    const householdPositions = positions.filter((p) =>
      householdAccounts.some((a) => a.accountId === p.accountId)
    );
    const totalMarketValue = householdPositions.reduce((sum, p) => sum + p.marketValue, 0);
    const lastActivity = new Date(
      Math.max(...householdAccounts.map((a) => a.createdAt.getTime()))
    );

    return {
      ...household,
      accountCount: householdAccounts.length,
      totalMarketValue,
      lastActivity,
    };
  });
}

export function getAccountsWithStats(): AccountWithStats[] {
  return accounts.map((account) => {
    const household = households.find((h) => h.householdId === account.householdId);
    const accountPositions = positions.filter((p) => p.accountId === account.accountId);
    const marketValue = accountPositions.reduce((sum, p) => sum + p.marketValue, 0);
    const totalDv01 = accountPositions.reduce((sum, p) => sum + p.dv01, 0);
    const duration =
      marketValue > 0
        ? accountPositions.reduce((sum, p) => sum + (p.duration * p.marketValue) / marketValue, 0)
        : 0;

    return {
      ...account,
      householdName: household?.name || "Unknown",
      marketValue,
      duration,
      lastActivity: account.createdAt,
    };
  });
}

export function getAccountPositions(accountId: string): Position[] {
  return positions.filter((p) => p.accountId === accountId);
}

export function getAccountAnalytics(accountId: string): PortfolioAnalytics {
  const accountPositions = getAccountPositions(accountId);
  const totalMarketValue = accountPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalDv01 = accountPositions.reduce((sum, p) => sum + p.dv01, 0);
  const totalDuration =
    totalMarketValue > 0
      ? accountPositions.reduce((sum, p) => sum + (p.duration * p.marketValue) / totalMarketValue, 0)
      : 0;

  // Mock cash balance (5-15% of portfolio)
  const cashBalance = Math.round(totalMarketValue * (0.05 + Math.random() * 0.1));

  // Calculate approximate bucket weights based on duration
  const bucketWeights: BucketWeights = {
    "0-2y": 0,
    "2-5y": 0,
    "5-10y": 0,
    "10-20y": 0,
    "20y+": 0,
  };

  accountPositions.forEach((p) => {
    const weight = (p.marketValue / totalMarketValue) * 100;
    if (p.duration <= 2) bucketWeights["0-2y"] += weight;
    else if (p.duration <= 5) bucketWeights["2-5y"] += weight;
    else if (p.duration <= 10) bucketWeights["5-10y"] += weight;
    else if (p.duration <= 20) bucketWeights["10-20y"] += weight;
    else bucketWeights["20y+"] += weight;
  });

  // Round bucket weights
  Object.keys(bucketWeights).forEach((key) => {
    bucketWeights[key as keyof BucketWeights] = Math.round(bucketWeights[key as keyof BucketWeights]);
  });

  return {
    totalMarketValue: totalMarketValue + cashBalance,
    totalDuration: Math.round(totalDuration * 100) / 100,
    totalDv01: Math.round(totalDv01 * 100) / 100,
    cashBalance,
    cashPercentage: Math.round((cashBalance / (totalMarketValue + cashBalance)) * 1000) / 10,
    bucketWeights,
  };
}

export function getHouseholdAnalytics(householdId: string): PortfolioAnalytics {
  const householdAccounts = accounts.filter((a) => a.householdId === householdId);
  const analytics = householdAccounts.map((a) => getAccountAnalytics(a.accountId));

  const totalMarketValue = analytics.reduce((sum, a) => sum + a.totalMarketValue, 0);
  const totalDv01 = analytics.reduce((sum, a) => sum + a.totalDv01, 0);
  const cashBalance = analytics.reduce((sum, a) => sum + a.cashBalance, 0);
  const totalDuration =
    totalMarketValue > 0
      ? analytics.reduce((sum, a) => sum + (a.totalDuration * a.totalMarketValue) / totalMarketValue, 0)
      : 0;

  const bucketWeights: BucketWeights = { "0-2y": 0, "2-5y": 0, "5-10y": 0, "10-20y": 0, "20y+": 0 };
  analytics.forEach((a) => {
    const weight = a.totalMarketValue / totalMarketValue;
    Object.keys(bucketWeights).forEach((key) => {
      bucketWeights[key as keyof BucketWeights] += a.bucketWeights[key as keyof BucketWeights] * weight;
    });
  });

  Object.keys(bucketWeights).forEach((key) => {
    bucketWeights[key as keyof BucketWeights] = Math.round(bucketWeights[key as keyof BucketWeights]);
  });

  return {
    totalMarketValue,
    totalDuration: Math.round(totalDuration * 100) / 100,
    totalDv01: Math.round(totalDv01 * 100) / 100,
    cashBalance,
    cashPercentage: Math.round((cashBalance / totalMarketValue) * 1000) / 10,
    bucketWeights,
  };
}

export function getDriftStatus(driftPercent: number): { status: string; color: string } {
  if (Math.abs(driftPercent) <= 5) return { status: "in_tolerance", color: "green" };
  if (Math.abs(driftPercent) <= 15) return { status: "warning", color: "yellow" };
  return { status: "out_of_tolerance", color: "red" };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
