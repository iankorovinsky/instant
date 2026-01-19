"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Download,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Building2,
  Briefcase,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  getSeverityColor,
  getScopeColor,
  getEvaluationPointColor,
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
} from "@/lib/compliance/ui";
import { fetchComplianceViolations } from "@/lib/compliance/api";
import type { RuleSeverity, RuleScope, ViolationStatus, EvaluationPoint, ViolationGroupBy, Violation } from "@/lib/compliance/types";

export default function ViolationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial filters from URL
  const initialSeverity = searchParams.get("severity") || "all";
  const initialRuleId = searchParams.get("ruleId") || "";
  const initialViolationId = searchParams.get("id");

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>(initialSeverity);
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [evaluationPointFilter, setEvaluationPointFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<ViolationGroupBy>("none");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  useEffect(() => {
    let active = true;

    const loadViolations = async () => {
      try {
        setLoading(true);
        const data = await fetchComplianceViolations();
        if (!active) return;
        setViolations(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load violations");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadViolations();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initialViolationId || violations.length === 0) {
      return;
    }
    const match = violations.find((violation) => violation.violationId === initialViolationId);
    if (match) {
      setSelectedViolation(match);
    }
  }, [initialViolationId, violations]);

  const filteredViolations = useMemo(() => {
    return violations.filter((violation) => {
      const matchesSearch =
        searchQuery === "" ||
        violation.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.ruleId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === "all" || violation.severity === severityFilter;
      const matchesScope = scopeFilter === "all" || violation.scope === scopeFilter;
      const matchesStatus = statusFilter === "all" || violation.status === statusFilter;
      const matchesEvaluationPoint =
        evaluationPointFilter === "all" || violation.evaluationPoint === evaluationPointFilter;
      const matchesRuleId = !initialRuleId || violation.ruleId === initialRuleId;

      return matchesSearch && matchesSeverity && matchesScope && matchesStatus && matchesEvaluationPoint && matchesRuleId;
    });
  }, [searchQuery, severityFilter, scopeFilter, statusFilter, evaluationPointFilter, initialRuleId]);

  // Group violations if needed
  const groupedViolations = useMemo(() => {
    if (groupBy === "none") {
      return { "": filteredViolations };
    }

    const groups: Record<string, typeof filteredViolations> = {};

    filteredViolations.forEach((violation) => {
      let key = "";
      switch (groupBy) {
        case "scope":
          key = violation.scope;
          break;
        case "severity":
          key = violation.severity;
          break;
        case "rule":
          key = violation.ruleName;
          break;
        case "account":
          key = violation.accountName;
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(violation);
    });

    return groups;
  }, [filteredViolations, groupBy]);

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

  // Summary stats
  const activeViolations = violations.filter((v) => v.status === "ACTIVE");
  const blockViolations = activeViolations.filter((v) => v.severity === "BLOCK");
  const warnViolations = activeViolations.filter((v) => v.severity === "WARN");
  const resolvedViolations = violations.filter((v) => v.status === "RESOLVED");

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading violations…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Violations</h1>
          <p className="text-muted-foreground mt-1">
            Track and resolve compliance violations
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "ACTIVE" && severityFilter === "BLOCK" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setStatusFilter("ACTIVE");
            setSeverityFilter("BLOCK");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockViolations.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "ACTIVE" && severityFilter === "WARN" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => {
            setStatusFilter("ACTIVE");
            setSeverityFilter("WARN");
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnViolations.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "RESOLVED" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("RESOLVED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedViolations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Violations</CardTitle>
              <CardDescription>
                {filteredViolations.length} violation{filteredViolations.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3 flex-wrap">
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

              <Select value={evaluationPointFilter} onValueChange={setEvaluationPointFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Eval Point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Points</SelectItem>
                  <SelectItem value="PRE_TRADE">Pre-Trade</SelectItem>
                  <SelectItem value="PRE_EXECUTION">Pre-Execution</SelectItem>
                  <SelectItem value="POST_TRADE">Post-Trade</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ViolationGroupBy)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="severity">Group by Severity</SelectItem>
                  <SelectItem value="scope">Group by Scope</SelectItem>
                  <SelectItem value="rule">Group by Rule</SelectItem>
                  <SelectItem value="account">Group by Account</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search violations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedViolations).map(([groupKey, groupViolations]) => (
            <div key={groupKey || "all"} className="mb-6 last:mb-0">
              {groupBy !== "none" && groupKey && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <span className="font-medium">{groupKey}</span>
                  <Badge variant="secondary">{groupViolations.length}</Badge>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Eval Point</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Evaluated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupViolations.map((violation) => (
                    <TableRow
                      key={violation.violationId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedViolation(violation)}
                    >
                      <TableCell>
                        <div>
                          <Link
                            href={`/app/compliance/rules/${violation.ruleId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-primary hover:underline"
                          >
                            {violation.ruleName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {violation.metricName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getScopeIcon(violation.scope)}
                          <Badge variant="outline" className={getScopeColor(violation.scope)}>
                            {violation.scope}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link
                            href={`/app/pms/accounts/${violation.accountId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary hover:underline"
                          >
                            {violation.accountName}
                          </Link>
                          {violation.householdName && (
                            <p className="text-xs text-muted-foreground">
                              {violation.householdName}
                            </p>
                          )}
                        </div>
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
                      <TableCell>
                        <Badge
                          variant={violation.status === "ACTIVE" ? "destructive" : "secondary"}
                        >
                          {violation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDateTime(violation.evaluatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {groupViolations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No violations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Violation Detail Dialog */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        {selectedViolation && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedViolation.severity === "BLOCK" ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                {selectedViolation.ruleName}
              </DialogTitle>
              <DialogDescription>
                Violation detected at {formatDateTime(selectedViolation.evaluatedAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Severity and Status */}
              <div className="flex gap-2">
                <Badge className={getSeverityColor(selectedViolation.severity)}>
                  {selectedViolation.severity}
                </Badge>
                <Badge className={getScopeColor(selectedViolation.scope)}>
                  {selectedViolation.scope}
                </Badge>
                <Badge className={getEvaluationPointColor(selectedViolation.evaluationPoint)}>
                  {selectedViolation.evaluationPoint.replace(/_/g, " ")}
                </Badge>
                <Badge variant={selectedViolation.status === "ACTIVE" ? "destructive" : "secondary"}>
                  {selectedViolation.status}
                </Badge>
              </div>

              <Separator />

              {/* Metric Comparison */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Metric Comparison</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground text-sm">Actual Value</span>
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(selectedViolation.metricValue)}
                    </div>
                  </div>
                  <div className="text-2xl text-muted-foreground">vs</div>
                  <div className="text-right">
                    <span className="text-muted-foreground text-sm">Threshold</span>
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedViolation.threshold)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">Metric: </span>
                  <span className="text-sm font-mono">{selectedViolation.metricName}</span>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="text-sm font-medium mb-2">Explanation</h4>
                <p className="text-muted-foreground bg-muted/30 p-3 rounded text-sm">
                  {selectedViolation.explanation}
                </p>
              </div>

              {/* Context */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Account</h4>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/app/pms/accounts/${selectedViolation.accountId}`}
                      className="text-primary hover:underline"
                    >
                      {selectedViolation.accountName}
                    </Link>
                  </div>
                  {selectedViolation.householdName && (
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Link
                        href={`/app/pms/households/${selectedViolation.householdId}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {selectedViolation.householdName}
                      </Link>
                    </div>
                  )}
                </div>

                {selectedViolation.orderId && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Order</h4>
                    <Link
                      href={`/app/oms/orders/${selectedViolation.orderId}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      {selectedViolation.orderId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {selectedViolation.orderDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedViolation.orderDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Metric Snapshot */}
              <div>
                <h4 className="text-sm font-medium mb-2">Metric Snapshot</h4>
                <div className="bg-muted/30 rounded p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedViolation.metricSnapshot).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground font-mono">{key}</span>
                        <span className="font-medium">
                          {typeof value === "number" ? formatNumber(value) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resolved Info */}
              {selectedViolation.status === "RESOLVED" && selectedViolation.resolvedAt && (
                <div className="bg-green-50 rounded p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Resolved</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {formatDateTime(selectedViolation.resolvedAt)} by {selectedViolation.resolvedBy}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link href={`/app/compliance/rules/${selectedViolation.ruleId}`}>
                    View Rule
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/app/pms/accounts/${selectedViolation.accountId}`}>
                    View Account
                  </Link>
                </Button>
                {selectedViolation.orderId && (
                  <Button variant="outline" asChild>
                    <Link href={`/app/oms/orders/${selectedViolation.orderId}`}>
                      View Order
                    </Link>
                  </Button>
                )}
                {selectedViolation.status === "ACTIVE" && (
                  <Button className="ml-auto">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
