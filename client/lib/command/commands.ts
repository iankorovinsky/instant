import type { Command, NavigationCommand, ActionCommand, AgentResponse } from "./types";

// Navigation Commands
export const navigationCommands: NavigationCommand[] = [
  // Dashboard
  {
    id: "nav-dashboard",
    label: "Dashboard",
    description: "Go to main dashboard",
    icon: "LayoutDashboard",
    category: "navigation",
    keywords: ["home", "dashboard", "main", "overview"],
    route: "/app",
    shortcut: "G D",
    execute: (_, router) => router.push("/app"),
  },

  // OMS
  {
    id: "nav-oms",
    label: "OMS - Orders",
    description: "View order management system",
    icon: "FileText",
    category: "navigation",
    keywords: ["oms", "orders", "order management", "blotter"],
    route: "/app/oms/orders",
    shortcut: "G O",
    execute: (_, router) => router.push("/app/oms/orders"),
  },
  {
    id: "nav-oms-create",
    label: "Create Order",
    description: "Create a new order",
    icon: "Plus",
    category: "navigation",
    keywords: ["create order", "new order", "add order"],
    route: "/app/oms/create",
    execute: (_, router) => router.push("/app/oms/create"),
  },
  {
    id: "nav-oms-upload",
    label: "Upload Orders",
    description: "Bulk upload orders",
    icon: "Upload",
    category: "navigation",
    keywords: ["upload", "bulk", "import orders"],
    route: "/app/oms/upload",
    execute: (_, router) => router.push("/app/oms/upload"),
  },

  // EMS
  {
    id: "nav-ems",
    label: "EMS - Executions",
    description: "View execution management system",
    icon: "Zap",
    category: "navigation",
    keywords: ["ems", "executions", "execution management", "fills", "tape"],
    route: "/app/ems/executions",
    shortcut: "G E",
    execute: (_, router) => router.push("/app/ems/executions"),
  },

  // PMS
  {
    id: "nav-pms",
    label: "PMS - Portfolio Management",
    description: "Portfolio management overview",
    icon: "PieChart",
    category: "navigation",
    keywords: ["pms", "portfolio", "portfolio management"],
    route: "/app/pms",
    shortcut: "G P",
    execute: (_, router) => router.push("/app/pms"),
  },
  {
    id: "nav-pms-households",
    label: "PMS - Households",
    description: "View all households",
    icon: "Users",
    category: "navigation",
    keywords: ["households", "families", "clients"],
    route: "/app/pms/households",
    execute: (_, router) => router.push("/app/pms/households"),
  },
  {
    id: "nav-pms-accounts",
    label: "PMS - Accounts",
    description: "View all accounts",
    icon: "Wallet",
    category: "navigation",
    keywords: ["accounts", "portfolios"],
    route: "/app/pms/accounts",
    execute: (_, router) => router.push("/app/pms/accounts"),
  },
  {
    id: "nav-pms-models",
    label: "PMS - Models",
    description: "View model portfolios",
    icon: "Layers",
    category: "navigation",
    keywords: ["models", "model portfolios", "templates"],
    route: "/app/pms/models",
    execute: (_, router) => router.push("/app/pms/models"),
  },
  {
    id: "nav-pms-proposals",
    label: "PMS - Proposals",
    description: "View rebalancing proposals",
    icon: "FileCheck",
    category: "navigation",
    keywords: ["proposals", "rebalancing proposals", "trades"],
    route: "/app/pms/proposals",
    execute: (_, router) => router.push("/app/pms/proposals"),
  },
  {
    id: "nav-pms-optimization",
    label: "PMS - Optimization",
    description: "Run portfolio optimization",
    icon: "Sparkles",
    category: "navigation",
    keywords: ["optimization", "optimize", "optimizer"],
    route: "/app/pms/optimization",
    execute: (_, router) => router.push("/app/pms/optimization"),
  },
  {
    id: "nav-pms-drift",
    label: "PMS - Drift Analysis",
    description: "View portfolio drift",
    icon: "TrendingUp",
    category: "navigation",
    keywords: ["drift", "drift analysis", "deviation"],
    route: "/app/pms/drift",
    execute: (_, router) => router.push("/app/pms/drift"),
  },
  {
    id: "nav-pms-rebalancing",
    label: "PMS - Rebalancing",
    description: "Rebalancing dashboard",
    icon: "RefreshCw",
    category: "navigation",
    keywords: ["rebalancing", "rebalance"],
    route: "/app/pms/rebalancing",
    execute: (_, router) => router.push("/app/pms/rebalancing"),
  },

  // Compliance
  {
    id: "nav-compliance",
    label: "Compliance",
    description: "Compliance dashboard",
    icon: "Shield",
    category: "navigation",
    keywords: ["compliance", "rules", "regulations"],
    route: "/app/compliance",
    shortcut: "G C",
    execute: (_, router) => router.push("/app/compliance"),
  },
  {
    id: "nav-compliance-rules",
    label: "Compliance - Rules",
    description: "View compliance rules",
    icon: "Scale",
    category: "navigation",
    keywords: ["rules", "compliance rules", "regulations"],
    route: "/app/compliance/rules",
    execute: (_, router) => router.push("/app/compliance/rules"),
  },
  {
    id: "nav-compliance-violations",
    label: "Compliance - Violations",
    description: "View compliance violations",
    icon: "AlertTriangle",
    category: "navigation",
    keywords: ["violations", "breaches", "alerts"],
    route: "/app/compliance/violations",
    execute: (_, router) => router.push("/app/compliance/violations"),
  },

  // Market Data
  {
    id: "nav-marketdata",
    label: "Market Data",
    description: "Market data dashboard",
    icon: "BarChart3",
    category: "navigation",
    keywords: ["market data", "marketdata", "pricing", "instruments"],
    route: "/app/marketdata",
    shortcut: "G M",
    execute: (_, router) => router.push("/app/marketdata"),
  },
  {
    id: "nav-marketdata-instruments",
    label: "Market Data - Instruments",
    description: "View UST instruments",
    icon: "FileText",
    category: "navigation",
    keywords: ["instruments", "securities", "cusip", "bonds", "notes", "bills"],
    route: "/app/marketdata/instruments",
    execute: (_, router) => router.push("/app/marketdata/instruments"),
  },
  {
    id: "nav-marketdata-curves",
    label: "Market Data - Yield Curves",
    description: "View yield curves",
    icon: "TrendingUp",
    category: "navigation",
    keywords: ["curves", "yield curves", "rates", "treasury"],
    route: "/app/marketdata/curves",
    execute: (_, router) => router.push("/app/marketdata/curves"),
  },
  {
    id: "nav-marketdata-pricing",
    label: "Market Data - Pricing Grid",
    description: "View market pricing grid",
    icon: "Grid3X3",
    category: "navigation",
    keywords: ["pricing", "grid", "market grid", "prices"],
    route: "/app/marketdata/pricing",
    execute: (_, router) => router.push("/app/marketdata/pricing"),
  },

  // Event Studio
  {
    id: "nav-events",
    label: "Event Studio",
    description: "Event studio dashboard",
    icon: "Activity",
    category: "navigation",
    keywords: ["events", "event studio", "timeline", "history"],
    route: "/app/events",
    shortcut: "G V",
    execute: (_, router) => router.push("/app/events"),
  },
  {
    id: "nav-events-timeline",
    label: "Event Timeline",
    description: "View event timeline",
    icon: "Clock",
    category: "navigation",
    keywords: ["timeline", "event timeline", "event history"],
    route: "/app/events/timeline",
    execute: (_, router) => router.push("/app/events/timeline"),
  },
  {
    id: "nav-events-replay",
    label: "Event Replay",
    description: "Time-travel replay",
    icon: "History",
    category: "navigation",
    keywords: ["replay", "time travel", "rebuild", "projection"],
    route: "/app/events/replay",
    execute: (_, router) => router.push("/app/events/replay"),
  },
];

// Context-specific Action Commands
export const actionCommands: ActionCommand[] = [
  // OMS Actions
  {
    id: "action-create-order",
    label: "Create Order",
    description: "Create a new order",
    icon: "Plus",
    category: "action",
    action: "create-order",
    keywords: ["create order", "new order"],
    context: ["/app/oms.*"],
    execute: (_, router) => router.push("/app/oms/create"),
  },
  {
    id: "action-upload-orders",
    label: "Upload Orders",
    description: "Bulk upload orders from file",
    icon: "Upload",
    category: "action",
    action: "upload-orders",
    keywords: ["upload", "bulk upload", "import"],
    context: ["/app/oms.*"],
    execute: (_, router) => router.push("/app/oms/upload"),
  },

  // PMS Actions
  {
    id: "action-run-optimization",
    label: "Run Optimization",
    description: "Run portfolio optimization",
    icon: "Sparkles",
    category: "action",
    action: "run-optimization",
    keywords: ["optimize", "optimization", "run optimization"],
    context: ["/app/pms.*"],
    execute: (_, router) => router.push("/app/pms/optimization"),
  },
  {
    id: "action-trigger-rebalancing",
    label: "Trigger Rebalancing",
    description: "Trigger portfolio rebalancing",
    icon: "RefreshCw",
    category: "action",
    action: "trigger-rebalancing",
    keywords: ["rebalance", "trigger rebalancing"],
    context: ["/app/pms/rebalancing.*"],
    execute: (_, router) => router.push("/app/pms/rebalancing"),
  },
  {
    id: "action-view-drift",
    label: "Analyze Drift",
    description: "View portfolio drift analysis",
    icon: "TrendingUp",
    category: "action",
    action: "analyze-drift",
    keywords: ["drift", "analyze drift", "deviation"],
    context: ["/app/pms.*"],
    execute: (_, router) => router.push("/app/pms/drift"),
  },

  // Compliance Actions
  {
    id: "action-create-rule",
    label: "Create Rule",
    description: "Create a new compliance rule",
    icon: "Plus",
    category: "action",
    action: "create-rule",
    keywords: ["create rule", "new rule", "add rule"],
    context: ["/app/compliance.*"],
    execute: (ctx, router) => {
      // Would open rule creation dialog
      router.push("/app/compliance/rules");
    },
  },
  {
    id: "action-view-violations",
    label: "View Violations",
    description: "View compliance violations",
    icon: "AlertTriangle",
    category: "action",
    action: "view-violations",
    keywords: ["violations", "breaches"],
    context: ["/app/compliance.*"],
    execute: (_, router) => router.push("/app/compliance/violations"),
  },

  // Market Data Actions
  {
    id: "action-export-grid",
    label: "Export Market Grid",
    description: "Export pricing grid to CSV",
    icon: "Download",
    category: "action",
    action: "export-grid",
    keywords: ["export", "download", "csv"],
    context: ["/app/marketdata/pricing.*"],
    execute: () => {
      // Would trigger export
      console.log("Export grid triggered");
    },
  },

  // Event Studio Actions
  {
    id: "action-export-events",
    label: "Export Events",
    description: "Export filtered events",
    icon: "Download",
    category: "action",
    action: "export-events",
    keywords: ["export events", "download events"],
    context: ["/app/events.*"],
    execute: () => {
      console.log("Export events triggered");
    },
  },
  {
    id: "action-filter-correlation",
    label: "Filter by Correlation",
    description: "Filter events by correlation ID",
    icon: "GitBranch",
    category: "action",
    action: "filter-correlation",
    keywords: ["correlation", "filter correlation"],
    context: ["/app/events.*"],
    execute: (_, router) => router.push("/app/events/timeline"),
  },
];

// All commands combined
export const allCommands: Command[] = [...navigationCommands, ...actionCommands];

// Get commands filtered by context
export function getContextCommands(currentRoute: string): Command[] {
  return allCommands.filter((cmd) => {
    if (!cmd.context) return true; // Available everywhere
    return cmd.context.some((pattern) => {
      const regex = new RegExp(pattern);
      return regex.test(currentRoute);
    });
  });
}

// Search commands
export function searchCommands(query: string, commands: Command[]): Command[] {
  if (!query.trim()) return commands;

  const lowerQuery = query.toLowerCase();

  return commands.filter((cmd) => {
    const searchText = [
      cmd.label,
      cmd.description || "",
      ...cmd.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(lowerQuery);
  });
}

// Group commands by category
export function groupCommands(commands: Command[]): Record<string, Command[]> {
  return commands.reduce((groups, cmd) => {
    const category = cmd.category;
    if (!groups[category]) groups[category] = [];
    groups[category].push(cmd);
    return groups;
  }, {} as Record<string, Command[]>);
}

// Demo agent mode - pattern matching for natural language
export function parseAgentCommand(input: string): AgentResponse | null {
  const lowerInput = input.toLowerCase().trim();

  // Navigation patterns
  const navPatterns = [
    { pattern: /go to (orders?|oms)/i, route: "/app/oms/orders", action: "Navigate to OMS Orders" },
    { pattern: /go to (executions?|ems)/i, route: "/app/ems/executions", action: "Navigate to EMS Executions" },
    { pattern: /go to (households?)/i, route: "/app/pms/households", action: "Navigate to Households" },
    { pattern: /go to (accounts?)/i, route: "/app/pms/accounts", action: "Navigate to Accounts" },
    { pattern: /go to (compliance|rules)/i, route: "/app/compliance/rules", action: "Navigate to Compliance Rules" },
    { pattern: /go to (violations)/i, route: "/app/compliance/violations", action: "Navigate to Violations" },
    { pattern: /go to (market data|marketdata|instruments)/i, route: "/app/marketdata/instruments", action: "Navigate to Instruments" },
    { pattern: /go to (curves|yield curves)/i, route: "/app/marketdata/curves", action: "Navigate to Yield Curves" },
    { pattern: /go to (events?|timeline)/i, route: "/app/events/timeline", action: "Navigate to Event Timeline" },
    { pattern: /go to (replay)/i, route: "/app/events/replay", action: "Navigate to Event Replay" },
    { pattern: /go to (dashboard|home)/i, route: "/app", action: "Navigate to Dashboard" },
  ];

  for (const { pattern, route, action } of navPatterns) {
    if (pattern.test(lowerInput)) {
      return {
        interpretation: `I understood you want to navigate to a page.`,
        proposedAction: action,
        route,
        confidence: 0.9,
      };
    }
  }

  // Action patterns
  const actionPatterns = [
    { pattern: /create (an? )?order/i, route: "/app/oms/create", action: "Create a new order" },
    { pattern: /upload orders?/i, route: "/app/oms/upload", action: "Upload orders from file" },
    { pattern: /run optimization/i, route: "/app/pms/optimization", action: "Run portfolio optimization" },
    { pattern: /trigger rebalanc/i, route: "/app/pms/rebalancing", action: "Trigger rebalancing" },
    { pattern: /view drift/i, route: "/app/pms/drift", action: "View drift analysis" },
    { pattern: /create (a )?rule/i, route: "/app/compliance/rules", action: "Create compliance rule" },
  ];

  for (const { pattern, route, action } of actionPatterns) {
    if (pattern.test(lowerInput)) {
      return {
        interpretation: `I understood you want to perform an action.`,
        proposedAction: action,
        route,
        confidence: 0.85,
      };
    }
  }

  // Search patterns
  const searchMatch = lowerInput.match(/(?:show|find|search|view) (?:account|order|household) ([a-z0-9-]+)/i);
  if (searchMatch) {
    const id = searchMatch[1];
    let route = "/app/pms/accounts";
    let action = `Search for "${id}"`;

    if (/order/i.test(lowerInput)) {
      route = "/app/oms/orders";
    } else if (/household/i.test(lowerInput)) {
      route = "/app/pms/households";
    }

    return {
      interpretation: `I understood you want to search for something.`,
      proposedAction: action,
      route,
      queryParams: { search: id },
      confidence: 0.75,
    };
  }

  // No match
  return null;
}

// Category labels
export const categoryLabels: Record<string, string> = {
  navigation: "Navigation",
  action: "Actions",
  agent: "AI Copilot",
};
