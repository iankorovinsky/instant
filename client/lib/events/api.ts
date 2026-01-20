import type { Event, EventFilters, EventTimelineItem } from "./types";
import { getModuleFromEventType } from "./ui";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type ApiEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  actor: { actorId: string; role: string; name?: string };
  aggregate: { type: string; id: string };
  correlationId: string;
  causationId?: string | null;
  payload: Record<string, unknown>;
  explanation?: string | null;
  schemaVersion: number;
};

function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}

function mapEvent(api: ApiEvent): Event {
  return {
    eventId: api.eventId,
    eventType: api.eventType,
    occurredAt: parseDate(api.occurredAt),
    actor: {
      actorId: api.actor?.actorId ?? "",
      role: (api.actor?.role as Event["actor"]["role"]) || "system",
      name: api.actor?.name,
    },
    aggregate: {
      type: api.aggregate?.type as Event["aggregate"]["type"],
      id: api.aggregate?.id ?? "",
    },
    correlationId: api.correlationId ?? null,
    causationId: api.causationId ?? null,
    payload: api.payload ?? {},
    explanation: api.explanation ?? null,
    schemaVersion: api.schemaVersion ?? 1,
  };
}

function buildSummary(event: Event): string {
  const payload = event.payload || {};
  switch (event.eventType) {
    case "OrderCreated":
      return `${payload.side ?? ""} ${payload.quantity ?? ""} ${payload.cusip ?? payload.instrumentId ?? ""}`.trim();
    case "OrderApproved":
      return `Order approved by ${payload.approvedBy ?? ""}`.trim();
    case "OrderRejected":
      return `Order rejected`;
    case "OrderSentToEMS":
      return "Sent to execution";
    case "FillGenerated":
      return `Fill generated`;
    case "ExecutionRequested":
      return "Execution requested";
    case "ProposalGenerated":
      return "Proposal generated";
    case "RuleEvaluated":
      return `Rule ${payload.ruleId ?? ""}: ${payload.result ?? ""}`.trim();
    case "RuleViolationDetected":
      return `${payload.severity ?? ""} violation: ${payload.ruleName ?? ""}`.trim();
    default:
      return event.eventType.replace(/([A-Z])/g, " $1").trim();
  }
}

export function toTimelineItem(event: Event): EventTimelineItem {
  return {
    ...event,
    module: getModuleFromEventType(event.eventType),
    summary: buildSummary(event),
    hasExplanation: Boolean(event.explanation),
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchEvents(filters?: EventFilters): Promise<Event[]> {
  const query = new URLSearchParams();
  if (filters?.aggregateType?.length) {
    query.set("aggregateType", filters.aggregateType[0]);
  }
  if (filters?.aggregateId) query.set("aggregateId", filters.aggregateId);
  if (filters?.correlationId) query.set("correlationId", filters.correlationId);
  if (filters?.eventType?.length) query.set("eventType", filters.eventType[0]);

  const result = await fetchJson<{ events: ApiEvent[] }>(
    `/api/events${query.toString() ? `?${query.toString()}` : ""}`
  );

  return (result.events || []).map(mapEvent);
}

export async function fetchEventTimeline(filters?: EventFilters): Promise<EventTimelineItem[]> {
  const events = await fetchEvents(filters);
  return events.map(toTimelineItem);
}

export async function fetchEventById(eventId: string): Promise<Event | null> {
  const events = await fetchEvents();
  return events.find((event) => event.eventId === eventId) || null;
}
