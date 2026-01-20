"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Edit,
  Power,
  Globe,
  Building2,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlayCircle,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSeverityColor,
  getScopeColor,
  getStatusColor,
  getEvaluationPointColor,
  getResultColor,
  metricDefinitions,
  operatorDefinitions,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/compliance/ui";
import {
  disableComplianceRule,
  enableComplianceRule,
  fetchComplianceRuleDetail,
  updateComplianceRule,
} from "@/lib/compliance/api";
import type {
  Evaluation,
  EvaluationPoint,
  MetricType,
  PredicateOperator,
  Rule,
  RuleScope,
  RuleSeverity,
  RuleStatus,
  RuleVersion,
  Violation,
} from "@/lib/compliance/types";

export default function RuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const actorId = "ui@instant.com";

  const [rule, setRule] = useState<Rule | null>(null);
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editState, setEditState] = useState({
    name: "",
    description: "",
    severity: "BLOCK" as RuleSeverity,
    scope: "GLOBAL" as RuleScope,
    scopeId: "",
    metric: metricDefinitions[0]?.id ?? "portfolio.duration",
    operator: operatorDefinitions[0]?.id ?? "<=",
    value: "",
    explanationTemplate: "",
    evaluationPoints: ["PRE_TRADE"] as EvaluationPoint[],
    status: "ACTIVE" as RuleStatus,
    effectiveFrom: "",
    effectiveTo: "",
    instrumentCusip: "",
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const detail = await fetchComplianceRuleDetail(id);
        if (!active) return;
        setRule(detail.rule);
        setVersions(detail.versions);
        setViolations(detail.violations);
        setEvaluations(detail.evaluations);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load rule");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!rule) return;
    setEditState({
      name: rule.name,
      description: rule.description || "",
      severity: rule.severity,
      scope: rule.scope,
      scopeId: rule.scopeId || "",
      metric: rule.predicate.metric,
      operator: rule.predicate.operator,
      value: String(rule.predicate.value ?? ""),
      explanationTemplate: rule.explanationTemplate,
      evaluationPoints: rule.evaluationPoints,
      status: rule.status,
      effectiveFrom: rule.effectiveFrom ? rule.effectiveFrom.toISOString().slice(0, 16) : "",
      effectiveTo: rule.effectiveTo ? rule.effectiveTo.toISOString().slice(0, 16) : "",
      instrumentCusip: rule.predicate.instrumentFilter?.cusip || "",
    });
  }, [rule]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading rule…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Rule not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/compliance/rules">Back to Rules</Link>
        </Button>
      </div>
    );
  }

  const metricInfo = metricDefinitions.find((m) => m.id === rule.predicate.metric);
  const activeViolations = violations.filter((v) => v.status === "ACTIVE");

  const getScopeIcon = (scope: RuleScope) => {
    switch (scope) {
      case "GLOBAL":
        return <Globe className="h-5 w-5" />;
      case "HOUSEHOLD":
        return <Building2 className="h-5 w-5" />;
      case "ACCOUNT":
        return <Briefcase className="h-5 w-5" />;
    }
  };

  const handleToggleStatus = async () => {
    if (!rule) return;
    if (rule.status === "ACTIVE") {
      await disableComplianceRule(rule.ruleId, actorId);
    } else {
      await enableComplianceRule(rule.ruleId, actorId);
    }
    const detail = await fetchComplianceRuleDetail(rule.ruleId);
    setRule(detail.rule);
  };

  const toggleEvaluationPoint = (point: EvaluationPoint) => {
    setEditState((prev) => {
      const exists = prev.evaluationPoints.includes(point);
      return {
        ...prev,
        evaluationPoints: exists
          ? prev.evaluationPoints.filter((item) => item !== point)
          : [...prev.evaluationPoints, point],
      };
    });
  };

  const handleUpdateRule = async () => {
    if (!rule) return;
    const metricInfo = metricDefinitions.find((metric) => metric.id === editState.metric);
    const parsedValue =
      metricInfo?.valueType === "enum"
        ? editState.value
        : Number.parseFloat(editState.value);

    const predicate: Rule["predicate"] = {
      metric: editState.metric,
      operator: editState.operator,
      value: Number.isNaN(parsedValue) ? editState.value : parsedValue,
    };

    if (editState.metric.startsWith("position.") && editState.instrumentCusip) {
      predicate.instrumentFilter = { cusip: editState.instrumentCusip };
    }

    const effectiveFrom = editState.effectiveFrom
      ? new Date(editState.effectiveFrom).toISOString()
      : undefined;
    const effectiveTo = editState.effectiveTo ? new Date(editState.effectiveTo).toISOString() : undefined;

    await updateComplianceRule(rule.ruleId, {
      name: editState.name,
      description: editState.description || undefined,
      severity: editState.severity,
      scope: editState.scope,
      scopeId: editState.scopeId || undefined,
      predicate,
      explanationTemplate: editState.explanationTemplate,
      evaluationPoints: editState.evaluationPoints,
      status: editState.status,
      effectiveFrom,
      effectiveTo,
      updatedBy: actorId,
    });

    const detail = await fetchComplianceRuleDetail(rule.ruleId);
    setRule(detail.rule);
    setVersions(detail.versions);
    setViolations(detail.violations);
    setEvaluations(detail.evaluations);
    setIsEditOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/compliance/rules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
                  <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                  <Badge className={getStatusColor(rule.status)}>{rule.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{rule.ruleKey}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <PlayCircle className="mr-2 h-4 w-4" />
            Test Rule
          </Button>
          <Button variant="outline" onClick={handleToggleStatus}>
            <Power className="mr-2 h-4 w-4" />
            {rule.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Rule
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>Update rule definition and create a new version.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editRuleName">Rule Name</Label>
              <Input
                id="editRuleName"
                value={editState.name}
                onChange={(e) => setEditState((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editState.status}
                onValueChange={(value) =>
                  setEditState((prev) => ({ ...prev, status: value as RuleStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editState.description}
                onChange={(e) => setEditState((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={editState.severity}
                onValueChange={(value) =>
                  setEditState((prev) => ({ ...prev, severity: value as RuleSeverity }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOCK">Block</SelectItem>
                  <SelectItem value="WARN">Warn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={editState.scope}
                onValueChange={(value) =>
                  setEditState((prev) => ({ ...prev, scope: value as RuleScope }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="HOUSEHOLD">Household</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editState.scope !== "GLOBAL" && (
              <div className="space-y-2">
                <Label htmlFor="editScopeId">Scope Target ID</Label>
                <Input
                  id="editScopeId"
                  value={editState.scopeId}
                  onChange={(e) => setEditState((prev) => ({ ...prev, scopeId: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select
                value={editState.metric}
                onValueChange={(value) =>
                  setEditState((prev) => ({ ...prev, metric: value as MetricType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricDefinitions.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Select
                value={editState.operator}
                onValueChange={(value) =>
                  setEditState((prev) => ({ ...prev, operator: value as PredicateOperator }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {operatorDefinitions.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editThreshold">Threshold</Label>
              <Input
                id="editThreshold"
                value={editState.value}
                onChange={(e) => setEditState((prev) => ({ ...prev, value: e.target.value }))}
              />
            </div>
            {editState.metric.startsWith("position.") && (
              <div className="space-y-2">
                <Label htmlFor="editInstrument">Instrument CUSIP</Label>
                <Input
                  id="editInstrument"
                  value={editState.instrumentCusip}
                  onChange={(e) =>
                    setEditState((prev) => ({ ...prev, instrumentCusip: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="editExplanation">Explanation Template</Label>
              <Textarea
                id="editExplanation"
                value={editState.explanationTemplate}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, explanationTemplate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Evaluation Points</Label>
              <div className="flex flex-wrap gap-3">
                {(["PRE_TRADE", "PRE_EXECUTION", "POST_TRADE"] as EvaluationPoint[]).map((point) => (
                  <label key={point} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={editState.evaluationPoints.includes(point)}
                      onCheckedChange={() => toggleEvaluationPoint(point)}
                    />
                    {point.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEffectiveFrom">Effective From</Label>
              <Input
                id="editEffectiveFrom"
                type="datetime-local"
                value={editState.effectiveFrom}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, effectiveFrom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEffectiveTo">Effective To</Label>
              <Input
                id="editEffectiveTo"
                type="datetime-local"
                value={editState.effectiveTo}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, effectiveTo: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule}>Save Version</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Description */}
      {rule.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{rule.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Rule Definition */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                rule.scope === "GLOBAL"
                  ? "bg-blue-100 text-blue-600"
                  : rule.scope === "HOUSEHOLD"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-green-100 text-green-600"
              }`}>
                {getScopeIcon(rule.scope)}
              </div>
              <div>
                <Badge className={getScopeColor(rule.scope)}>{rule.scope}</Badge>
                {rule.scopeName && (
                  <p className="text-sm text-muted-foreground mt-1">{rule.scopeName}</p>
                )}
              </div>
            </div>
            {/* Scope Hierarchy */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Inheritance Path</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-blue-50">Global</Badge>
                {(rule.scope === "HOUSEHOLD" || rule.scope === "ACCOUNT") && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className={rule.scope === "HOUSEHOLD" ? "bg-purple-50 ring-2 ring-purple-500" : "bg-purple-50"}>
                      Household
                    </Badge>
                  </>
                )}
                {rule.scope === "ACCOUNT" && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <Badge variant="outline" className="bg-green-50 ring-2 ring-green-500">
                      Account
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluation Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {rule.evaluationPoints.map((point) => (
                <Badge key={point} className={getEvaluationPointColor(point)}>
                  {point.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effective From</span>
                <span>{formatDate(rule.effectiveFrom)}</span>
              </div>
              {rule.effectiveTo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Effective To</span>
                  <span>{formatDate(rule.effectiveTo)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>v{rule.version}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predicate */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Predicate</CardTitle>
          <CardDescription>The condition that is evaluated for compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-center gap-4 text-lg">
              <div className="flex-1">
                <span className="text-muted-foreground text-sm block mb-1">Metric</span>
                <span className="font-mono font-medium">{rule.predicate.metric}</span>
                {metricInfo && (
                  <p className="text-sm text-muted-foreground mt-1">{metricInfo.description}</p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                {rule.predicate.operator}
              </div>
              <div className="flex-1 text-right">
                <span className="text-muted-foreground text-sm block mb-1">Threshold</span>
                <span className="font-mono font-medium text-2xl">
                  {typeof rule.predicate.value === "number"
                    ? formatNumber(rule.predicate.value)
                    : rule.predicate.value}
                </span>
                {metricInfo?.unit && (
                  <span className="text-muted-foreground ml-1">{metricInfo.unit}</span>
                )}
              </div>
            </div>
          </div>

          {rule.explanationTemplate && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground block mb-2">Explanation Template</span>
              <p className="text-sm italic bg-muted/30 p-3 rounded">
                "{rule.explanationTemplate}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rule.evaluationCount.toLocaleString()}</div>
            {rule.lastEvaluatedAt && (
              <p className="text-xs text-muted-foreground">
                Last: {formatDateTime(rule.lastEvaluatedAt)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{rule.violationCount}</div>
            {rule.lastViolatedAt && (
              <p className="text-xs text-muted-foreground">
                Last: {formatDateTime(rule.lastViolatedAt)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeViolations.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Violation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rule.evaluationCount > 0
                ? ((rule.violationCount / rule.evaluationCount) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Of all evaluations</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Violations */}
      {activeViolations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Active Violations
                </CardTitle>
                <CardDescription>
                  {activeViolations.length} active violation{activeViolations.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/app/compliance/violations?ruleId=${rule.ruleId}`}>
                  View All Violations
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Evaluation Point</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Evaluated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeViolations.slice(0, 5).map((violation) => (
                  <TableRow key={violation.violationId}>
                    <TableCell>
                      <Link
                        href={`/app/pms/accounts/${violation.accountId}`}
                        className="text-primary hover:underline"
                      >
                        {violation.accountName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {violation.orderId ? (
                        <Link
                          href={`/app/oms/orders/${violation.orderId}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {violation.orderId.slice(0, 12)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEvaluationPointColor(violation.evaluationPoint)}>
                        {violation.evaluationPoint.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatNumber(violation.metricValue)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(violation.threshold)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDateTime(violation.evaluatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Previous versions of this rule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.versionId}>
                    <TableCell>
                      <Badge variant={version.version === rule.version ? "default" : "outline"}>
                        v{version.version}
                        {version.version === rule.version && " (current)"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {version.predicate.operator} {formatNumber(version.predicate.value as number)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(version.severity)}>
                        {version.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {version.createdBy}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDateTime(version.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Evaluations */}
      {evaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluations</CardTitle>
            <CardDescription>Latest evaluation results for this rule</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Evaluated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.slice(0, 5).map((evaluation) => (
                  <TableRow key={evaluation.evaluationId}>
                    <TableCell>{evaluation.accountName}</TableCell>
                    <TableCell>
                      <Badge className={getResultColor(evaluation.result)}>
                        {evaluation.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(evaluation.metricValue)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(evaluation.threshold)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDateTime(evaluation.evaluatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(rule.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created By</span>
                <span>{rule.createdBy}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDateTime(rule.updatedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Updated By</span>
                <span>{rule.updatedBy}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
