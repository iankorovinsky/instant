"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Shield,
  Globe,
  Building2,
  Briefcase,
  MoreHorizontal,
  Power,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getSeverityColor,
  getScopeColor,
  getStatusColor,
  metricDefinitions,
  operatorDefinitions,
  formatDate,
} from "@/lib/compliance/ui";
import {
  createComplianceRule,
  deleteComplianceRule,
  disableComplianceRule,
  enableComplianceRule,
  fetchComplianceRules,
} from "@/lib/compliance/api";
import type { EvaluationPoint, MetricType, PredicateOperator, Rule, RuleGroupBy, RuleScope, RuleSeverity, RuleStatus } from "@/lib/compliance/types";

export default function RulesPage() {
  const router = useRouter();
  const actorId = "ui@instant.com";

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<RuleGroupBy>("none");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState({
    ruleKey: "",
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

    const loadRules = async () => {
      try {
        setLoading(true);
        const data = await fetchComplianceRules();
        if (!active) return;
        setRules(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load rules");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRules();
    return () => {
      active = false;
    };
  }, []);

  const refreshRules = async () => {
    const data = await fetchComplianceRules();
    setRules(data);
  };

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const matchesSearch =
        searchQuery === "" ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ruleKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === "all" || rule.severity === severityFilter;
      const matchesScope = scopeFilter === "all" || rule.scope === scopeFilter;
      const matchesStatus = statusFilter === "all" || rule.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesScope && matchesStatus;
    });
  }, [searchQuery, severityFilter, scopeFilter, statusFilter]);

  // Group rules if needed
  const groupedRules = useMemo(() => {
    if (groupBy === "none") {
      return { "": filteredRules };
    }

    const groups: Record<string, typeof filteredRules> = {};

    filteredRules.forEach((rule) => {
      let key = "";
      switch (groupBy) {
        case "scope":
          key = rule.scope;
          break;
        case "severity":
          key = rule.severity;
          break;
        case "status":
          key = rule.status;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rule);
    });

    return groups;
  }, [filteredRules, groupBy]);

  const getScopeIcon = (scope: RuleScope) => {
    switch (scope) {
      case "GLOBAL":
        return <Globe className="h-4 w-4" />;
      case "HOUSEHOLD":
        return <Building2 className="h-4 w-4" />;
      case "ACCOUNT":
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const metricInfo = metricDefinitions.find((metric) => metric.id === formState.metric);

  const resetForm = () => {
    setFormState({
      ruleKey: "",
      name: "",
      description: "",
      severity: "BLOCK",
      scope: "GLOBAL",
      scopeId: "",
      metric: metricDefinitions[0]?.id ?? "portfolio.duration",
      operator: operatorDefinitions[0]?.id ?? "<=",
      value: "",
      explanationTemplate: "",
      evaluationPoints: ["PRE_TRADE"],
      status: "ACTIVE",
      effectiveFrom: "",
      effectiveTo: "",
      instrumentCusip: "",
    });
  };

  const handleCreateRule = async () => {
    try {
      const parsedValue =
        metricInfo?.valueType === "enum"
          ? formState.value
          : Number.parseFloat(formState.value);

      const predicate: Rule["predicate"] = {
        metric: formState.metric,
        operator: formState.operator,
        value: Number.isNaN(parsedValue) ? formState.value : parsedValue,
      };

      if (formState.metric.startsWith("position.") && formState.instrumentCusip) {
        predicate.instrumentFilter = { cusip: formState.instrumentCusip };
      }

      const effectiveFrom = formState.effectiveFrom
        ? new Date(formState.effectiveFrom).toISOString()
        : undefined;
      const effectiveTo = formState.effectiveTo
        ? new Date(formState.effectiveTo).toISOString()
        : undefined;

      await createComplianceRule({
        ruleKey: formState.ruleKey,
        name: formState.name,
        description: formState.description || undefined,
        severity: formState.severity,
        scope: formState.scope,
        scopeId: formState.scopeId || undefined,
        predicate,
        explanationTemplate: formState.explanationTemplate,
        evaluationPoints: formState.evaluationPoints,
        status: formState.status,
        effectiveFrom,
        effectiveTo,
        createdBy: actorId,
      });

      await refreshRules();
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    }
  };

  const handleToggleStatus = async (rule: Rule) => {
    if (rule.status === "ACTIVE") {
      await disableComplianceRule(rule.ruleId, actorId);
    } else {
      await enableComplianceRule(rule.ruleId, actorId);
    }
    await refreshRules();
  };

  const handleDelete = async (rule: Rule) => {
    if (!window.confirm(`Delete rule ${rule.name}? This cannot be undone.`)) {
      return;
    }
    await deleteComplianceRule(rule.ruleId, actorId);
    await refreshRules();
  };

  const toggleEvaluationPoint = (point: EvaluationPoint) => {
    setFormState((prev) => {
      const exists = prev.evaluationPoints.includes(point);
      return {
        ...prev,
        evaluationPoints: exists
          ? prev.evaluationPoints.filter((item) => item !== point)
          : [...prev.evaluationPoints, point],
      };
    });
  };

  // Summary stats
  const activeCount = rules.filter((r) => r.status === "ACTIVE").length;
  const blockCount = rules.filter((r) => r.severity === "BLOCK" && r.status === "ACTIVE").length;
  const warnCount = rules.filter((r) => r.severity === "WARN" && r.status === "ACTIVE").length;

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading rules…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Rules</h1>
          <p className="text-muted-foreground mt-1">
            Manage compliance rules across global, household, and account scopes
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Compliance Rule</DialogTitle>
            <DialogDescription>
              Define scope, predicate, and evaluation points for the new rule.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ruleKey">Rule Key</Label>
              <Input
                id="ruleKey"
                value={formState.ruleKey}
                onChange={(e) => setFormState((prev) => ({ ...prev, ruleKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ruleDescription">Description</Label>
              <Textarea
                id="ruleDescription"
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formState.severity}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, severity: value as RuleSeverity }))
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
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, status: value as RuleStatus }))
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
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={formState.scope}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, scope: value as RuleScope }))
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
            {formState.scope !== "GLOBAL" && (
              <div className="space-y-2">
                <Label htmlFor="scopeId">Scope Target ID</Label>
                <Input
                  id="scopeId"
                  value={formState.scopeId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, scopeId: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Metric</Label>
              <Select
                value={formState.metric}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, metric: value as MetricType }))
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
                value={formState.operator}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, operator: value as PredicateOperator }))
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
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                value={formState.value}
                onChange={(e) => setFormState((prev) => ({ ...prev, value: e.target.value }))}
              />
            </div>
            {formState.metric.startsWith("position.") && (
              <div className="space-y-2">
                <Label htmlFor="instrumentCusip">Instrument CUSIP</Label>
                <Input
                  id="instrumentCusip"
                  value={formState.instrumentCusip}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, instrumentCusip: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="explanationTemplate">Explanation Template</Label>
              <Textarea
                id="explanationTemplate"
                value={formState.explanationTemplate}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, explanationTemplate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Evaluation Points</Label>
              <div className="flex flex-wrap gap-3">
                {(["PRE_TRADE", "PRE_EXECUTION", "POST_TRADE"] as EvaluationPoint[]).map((point) => (
                  <label key={point} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formState.evaluationPoints.includes(point)}
                      onCheckedChange={() => toggleEvaluationPoint(point)}
                    />
                    {point.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="datetime-local"
                value={formState.effectiveFrom}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, effectiveFrom: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                type="datetime-local"
                value={formState.effectiveTo}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, effectiveTo: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRule}>Create Rule</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "ACTIVE" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("ACTIVE")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${severityFilter === "BLOCK" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setSeverityFilter("BLOCK");
            setStatusFilter("ACTIVE");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Block Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockCount}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${severityFilter === "WARN" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setSeverityFilter("WARN");
            setStatusFilter("ACTIVE");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Warn Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rules</CardTitle>
              <CardDescription>
                {filteredRules.length} rule{filteredRules.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="BLOCK">Block</SelectItem>
                  <SelectItem value="WARN">Warn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="HOUSEHOLD">Household</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as RuleGroupBy)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="scope">Group by Scope</SelectItem>
                  <SelectItem value="severity">Group by Severity</SelectItem>
                  <SelectItem value="status">Group by Status</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedRules).map(([groupKey, groupRules]) => (
            <div key={groupKey || "all"} className="mb-6 last:mb-0">
              {groupBy !== "none" && groupKey && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Badge
                    className={
                      groupBy === "severity"
                        ? getSeverityColor(groupKey as RuleSeverity)
                        : groupBy === "scope"
                        ? getScopeColor(groupKey as RuleScope)
                        : getStatusColor(groupKey as RuleStatus)
                    }
                  >
                    {groupKey}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{groupRules.length} rules</span>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Evaluations</TableHead>
                    <TableHead className="text-right">Violations</TableHead>
                    <TableHead className="text-right">Last Updated</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRules.map((rule) => (
                    <TableRow
                      key={rule.ruleId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/compliance/rules/${rule.ruleId}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{rule.name}</span>
                            <p className="text-xs text-muted-foreground font-mono">
                              {rule.ruleKey}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getScopeIcon(rule.scope)}
                          <div>
                            <Badge variant="outline" className={getScopeColor(rule.scope)}>
                              {rule.scope}
                            </Badge>
                            {rule.scopeName && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {rule.scopeName}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(rule.status)}>
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {rule.evaluationCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={rule.violationCount > 0 ? "text-amber-600 font-medium" : ""}>
                          {rule.violationCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(rule.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                router.push(`/app/compliance/rules/${rule.ruleId}`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                handleToggleStatus(rule);
                              }}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {rule.status === "ACTIVE" ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              disabled={rule.evaluationCount > 0}
                              onSelect={(event) => {
                                event.preventDefault();
                                if (rule.evaluationCount > 0) return;
                                handleDelete(rule);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groupRules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No rules found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
