import type {
  Rule,
  RuleVersion,
  Violation,
  Evaluation,
  RuleStatus,
  RuleScope,
  RuleSeverity,
  EvaluationPoint,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ApiRule = Record<string, unknown>;

type RuleDetailResponse = {
  rule: ApiRule;
  versions: ApiRule[];
  evaluations: ApiRule[];
  violations: ApiRule[];
};

type RuleListResponse = { rules: ApiRule[] };

type ViolationListResponse = { violations: ApiRule[] };

function parseDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

function mapRule(api: ApiRule): Rule {
  return {
    ruleId: String(api.ruleId ?? ""),
    ruleKey: String(api.ruleKey ?? ""),
    name: String(api.name ?? ""),
    description: api.description ? String(api.description) : undefined,
    version: Number(api.version ?? 0),
    severity: (api.severity as RuleSeverity) || "WARN",
    scope: (api.scope as RuleScope) || "GLOBAL",
    scopeId: api.scopeId ? String(api.scopeId) : undefined,
    scopeName: api.scopeName ? String(api.scopeName) : undefined,
    predicate: (api.predicate as Rule["predicate"]) || {
      metric: "portfolio.duration",
      operator: "<=",
      value: 0,
    },
    explanationTemplate: String(api.explanationTemplate ?? ""),
    evaluationPoints: (api.evaluationPoints as EvaluationPoint[]) || [],
    status: (api.status as RuleStatus) || "DRAFT",
    effectiveFrom: parseDate(api.effectiveFrom),
    effectiveTo: api.effectiveTo ? parseDate(api.effectiveTo) : undefined,
    evaluationCount: Number(api.evaluationCount ?? 0),
    violationCount: Number(api.violationCount ?? 0),
    createdAt: parseDate(api.createdAt),
    createdBy: String(api.createdBy ?? ""),
    updatedAt: parseDate(api.updatedAt),
    updatedBy: String(api.updatedBy ?? ""),
    lastEvaluatedAt: api.lastEvaluatedAt ? parseDate(api.lastEvaluatedAt) : undefined,
    lastViolatedAt: api.lastViolatedAt ? parseDate(api.lastViolatedAt) : undefined,
  };
}

function mapRuleVersion(api: ApiRule): RuleVersion {
  return {
    versionId: String(api.versionId ?? ""),
    ruleId: String(api.ruleId ?? ""),
    version: Number(api.version ?? 0),
    predicate: (api.predicate as RuleVersion["predicate"]) || {
      metric: "portfolio.duration",
      operator: "<=",
      value: 0,
    },
    severity: (api.severity as RuleSeverity) || "WARN",
    explanationTemplate: String(api.explanationTemplate ?? ""),
    createdAt: parseDate(api.createdAt),
    createdBy: String(api.createdBy ?? ""),
  };
}

function mapEvaluation(api: ApiRule): Evaluation {
  return {
    evaluationId: String(api.evaluationId ?? ""),
    ruleId: String(api.ruleId ?? ""),
    ruleName: String(api.ruleName ?? api.ruleId ?? ""),
    ruleVersion: Number(api.ruleVersion ?? 0),
    orderId: api.orderId ? String(api.orderId) : undefined,
    accountId: String(api.accountId ?? ""),
    accountName: String(api.accountName ?? api.accountId ?? ""),
    evaluationPoint: (api.evaluationPoint as EvaluationPoint) || "PRE_TRADE",
    result: (api.result as Evaluation["result"]) || "PASS",
    metricValue: Number(api.metricValue ?? 0),
    threshold: Number(api.threshold ?? 0),
    metricSnapshot: (api.metricSnapshot as Evaluation["metricSnapshot"]) || {},
    explanation: String(api.explanation ?? ""),
    evaluatedAt: parseDate(api.evaluatedAt),
  };
}

function mapViolation(api: ApiRule): Violation {
  const metricSnapshot = (api.metricSnapshot as Violation["metricSnapshot"]) || {};
  const metricName =
    (api.metricName as string | undefined) ||
    Object.keys(metricSnapshot)[0] ||
    "";

  return {
    violationId: String(api.violationId ?? ""),
    ruleId: String(api.ruleId ?? ""),
    ruleName: String(api.ruleName ?? ""),
    ruleVersion: Number(api.ruleVersion ?? 0),
    severity: (api.severity as RuleSeverity) || "WARN",
    scope: (api.scope as RuleScope) || "GLOBAL",
    scopeId: api.scopeId ? String(api.scopeId) : undefined,
    scopeName: api.scopeName ? String(api.scopeName) : undefined,
    orderId: api.orderId ? String(api.orderId) : undefined,
    orderDescription: api.orderDescription ? String(api.orderDescription) : undefined,
    accountId: String(api.accountId ?? ""),
    accountName: String(api.accountName ?? api.accountId ?? ""),
    householdId: api.householdId ? String(api.householdId) : undefined,
    householdName: api.householdName ? String(api.householdName) : undefined,
    evaluationPoint: (api.evaluationPoint as EvaluationPoint) || "PRE_TRADE",
    metricValue: Number(api.metricValue ?? 0),
    threshold: Number(api.threshold ?? 0),
    metricName,
    status: (api.status as Violation["status"]) || "ACTIVE",
    explanation: String(api.explanation ?? ""),
    metricSnapshot,
    evaluatedAt: parseDate(api.evaluatedAt),
    resolvedAt: api.resolvedAt ? parseDate(api.resolvedAt) : undefined,
    resolvedBy: api.resolvedBy ? String(api.resolvedBy) : undefined,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function fetchComplianceRules(params?: {
  severity?: RuleSeverity;
  scope?: RuleScope;
  status?: RuleStatus;
  evaluationPoint?: EvaluationPoint;
}): Promise<Rule[]> {
  const query = new URLSearchParams();
  if (params?.severity) query.set("severity", params.severity);
  if (params?.scope) query.set("scope", params.scope);
  if (params?.status) query.set("status", params.status);
  if (params?.evaluationPoint) query.set("evaluationPoint", params.evaluationPoint);

  const response = await fetchJson<RuleListResponse>(
    `/api/views/compliance/rules${query.toString() ? `?${query.toString()}` : ""}`
  );
  return (response.rules || []).map(mapRule);
}

export async function fetchComplianceRuleDetail(ruleId: string): Promise<{
  rule: Rule;
  versions: RuleVersion[];
  evaluations: Evaluation[];
  violations: Violation[];
}> {
  const response = await fetchJson<RuleDetailResponse>(`/api/views/compliance/rules/${ruleId}`);

  return {
    rule: mapRule(response.rule),
    versions: (response.versions || []).map(mapRuleVersion),
    evaluations: (response.evaluations || []).map(mapEvaluation),
    violations: (response.violations || []).map(mapViolation),
  };
}

export async function fetchComplianceViolations(params?: {
  severity?: RuleSeverity;
  scope?: RuleScope;
  accountId?: string;
  ruleId?: string;
  status?: Violation["status"];
  evaluationPoint?: EvaluationPoint;
}): Promise<Violation[]> {
  const query = new URLSearchParams();
  if (params?.severity) query.set("severity", params.severity);
  if (params?.scope) query.set("scope", params.scope);
  if (params?.accountId) query.set("accountId", params.accountId);
  if (params?.ruleId) query.set("ruleId", params.ruleId);
  if (params?.status) query.set("status", params.status);
  if (params?.evaluationPoint) query.set("evaluationPoint", params.evaluationPoint);

  const response = await fetchJson<ViolationListResponse>(
    `/api/views/compliance/violations${query.toString() ? `?${query.toString()}` : ""}`
  );
  return (response.violations || []).map(mapViolation);
}

export async function createComplianceRule(payload: {
  ruleKey: string;
  name: string;
  description?: string;
  severity: RuleSeverity;
  scope: RuleScope;
  scopeId?: string;
  predicate: Rule["predicate"];
  explanationTemplate: string;
  evaluationPoints: EvaluationPoint[];
  status?: RuleStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  ruleSetId?: string;
  createdBy: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/compliance/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Failed to create rule");
  }

  return response.json();
}

export async function updateComplianceRule(ruleId: string, payload: {
  ruleKey?: string;
  name: string;
  description?: string;
  severity: RuleSeverity;
  scope: RuleScope;
  scopeId?: string;
  predicate: Rule["predicate"];
  explanationTemplate: string;
  evaluationPoints: EvaluationPoint[];
  status?: RuleStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  ruleSetId?: string;
  updatedBy: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/compliance/rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Failed to update rule");
  }

  return response.json();
}

export async function enableComplianceRule(ruleId: string, actorId: string) {
  const response = await fetch(`${API_BASE_URL}/api/compliance/rules/${ruleId}/enable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actorId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Failed to enable rule");
  }

  return response.json();
}

export async function disableComplianceRule(ruleId: string, actorId: string) {
  const response = await fetch(`${API_BASE_URL}/api/compliance/rules/${ruleId}/disable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actorId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Failed to disable rule");
  }

  return response.json();
}

export async function deleteComplianceRule(ruleId: string, actorId: string) {
  const response = await fetch(`${API_BASE_URL}/api/compliance/rules/${ruleId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actorId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error || "Failed to delete rule");
  }

  return response.json();
}
