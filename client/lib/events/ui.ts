import type { AggregateType, Event, EventModule, EventStatistics } from "./types";
import { EVENT_TYPES } from "./types";

export function getModuleFromEventType(eventType: string): EventModule {
  const entry = Object.entries(EVENT_TYPES).find(([, types]) => types.includes(eventType));
  if (entry) {
    return entry[0] as EventModule;
  }
  if (eventType.startsWith("MarketData") || eventType.startsWith("Instrument") || eventType.startsWith("Curve")) {
    return "marketdata";
  }
  if (eventType.startsWith("Evaluated") || eventType.startsWith("Risk") || eventType.startsWith("Pricing")) {
    return "pricing";
  }
  if (eventType.startsWith("Order") && !eventType.includes("Execution")) {
    return "oms";
  }
  if (eventType.startsWith("Execution") || eventType.startsWith("Fill") || eventType.startsWith("Slippage")) {
    return "ems";
  }
  if (eventType.startsWith("Account") || eventType.startsWith("Household") || eventType.startsWith("Proposal") ||
      eventType.startsWith("Target") || eventType.startsWith("Drift") || eventType.startsWith("Rebalance")) {
    return "pms";
  }
  if (eventType.startsWith("Rule") || eventType.startsWith("Violation") || eventType.startsWith("Compliance")) {
    return "compliance";
  }
  if (eventType.startsWith("AI") || eventType.startsWith("Copilot")) {
    return "copilot";
  }
  return "oms";
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

export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getModuleColor(module: EventModule): string {
  switch (module) {
    case "marketdata":
      return "bg-indigo-100 text-indigo-800";
    case "pricing":
      return "bg-emerald-100 text-emerald-800";
    case "oms":
      return "bg-blue-100 text-blue-800";
    case "ems":
      return "bg-purple-100 text-purple-800";
    case "pms":
      return "bg-amber-100 text-amber-800";
    case "compliance":
      return "bg-red-100 text-red-800";
    case "copilot":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getModuleLabel(module: EventModule): string {
  switch (module) {
    case "marketdata":
      return "Market Data";
    case "pricing":
      return "Pricing";
    case "oms":
      return "OMS";
    case "ems":
      return "EMS";
    case "pms":
      return "PMS";
    case "compliance":
      return "Compliance";
    case "copilot":
      return "Copilot";
    default:
      return "Events";
  }
}

export function getAggregateColor(type: AggregateType): string {
  switch (type) {
    case "Order":
      return "bg-blue-100 text-blue-800";
    case "Execution":
      return "bg-purple-100 text-purple-800";
    case "Account":
      return "bg-green-100 text-green-800";
    case "Household":
      return "bg-amber-100 text-amber-800";
    case "Proposal":
      return "bg-pink-100 text-pink-800";
    case "Rule":
      return "bg-red-100 text-red-800";
    case "Instrument":
      return "bg-indigo-100 text-indigo-800";
    case "YieldCurve":
      return "bg-cyan-100 text-cyan-800";
    case "Model":
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function buildEventStatistics(events: Event[]): EventStatistics {
  const eventsByModule: EventStatistics["eventsByModule"] = {
    marketdata: 0,
    pricing: 0,
    oms: 0,
    ems: 0,
    pms: 0,
    compliance: 0,
    copilot: 0,
  };
  const eventsByAggregateType: EventStatistics["eventsByAggregateType"] = {
    Order: 0,
    Account: 0,
    Household: 0,
    Proposal: 0,
    Execution: 0,
    Rule: 0,
    Instrument: 0,
    YieldCurve: 0,
    Model: 0,
  };

  const correlationIds = new Set<string>();
  const aggregates = new Set<string>();
  let eventsWithExplanations = 0;

  events.forEach((event) => {
    const module = getModuleFromEventType(event.eventType);
    eventsByModule[module] += 1;
    if (eventsByAggregateType[event.aggregate.type] !== undefined) {
      eventsByAggregateType[event.aggregate.type] += 1;
    }
    if (event.explanation) {
      eventsWithExplanations += 1;
    }
    if (event.correlationId) {
      correlationIds.add(event.correlationId);
    }
    aggregates.add(`${event.aggregate.type}:${event.aggregate.id}`);
  });

  const eventsByHourMap = new Map<string, number>();
  events.forEach((event) => {
    const hourKey = event.occurredAt.toISOString().slice(0, 13);
    eventsByHourMap.set(hourKey, (eventsByHourMap.get(hourKey) || 0) + 1);
  });

  const eventsByHour = Array.from(eventsByHourMap.entries()).map(([hour, count]) => ({
    hour,
    count,
  }));

  return {
    totalEvents: events.length,
    eventsByModule,
    eventsByAggregateType,
    eventsByHour,
    eventsWithExplanations,
    uniqueCorrelationIds: correlationIds.size,
    uniqueAggregates: aggregates.size,
  };
}
