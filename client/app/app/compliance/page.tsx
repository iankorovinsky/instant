"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Globe,
  Building2,
  Briefcase,
  Plus,
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
import {
  getSeverityColor,
  getScopeColor,
  getEvaluationPointColor,
  formatDateTime,
  formatNumber,
} from "@/lib/compliance/ui";
import { fetchComplianceRules, fetchComplianceViolations } from "@/lib/compliance/api";
import type { Rule, Violation } from "@/lib/compliance/types";

export default function ComplianceDashboardPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [rulesData, violationsData] = await Promise.all([
          fetchComplianceRules(),
          fetchComplianceViolations(),
        ]);
        if (!active) return;
        setRules(rulesData);
        setViolations(violationsData);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load compliance data");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const activeRules = rules.filter((r) => r.status === "ACTIVE");
    const activeViolations = violations.filter((v) => v.status === "ACTIVE");

    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      blockRules: activeRules.filter((r) => r.severity === "BLOCK").length,
      warnRules: activeRules.filter((r) => r.severity === "WARN").length,
      globalRules: activeRules.filter((r) => r.scope === "GLOBAL").length,
      householdRules: activeRules.filter((r) => r.scope === "HOUSEHOLD").length,
      accountRules: activeRules.filter((r) => r.scope === "ACCOUNT").length,
      activeViolations: activeViolations.length,
      blockViolations: activeViolations.filter((v) => v.severity === "BLOCK").length,
      warnViolations: activeViolations.filter((v) => v.severity === "WARN").length,
      resolvedViolations: violations.filter((v) => v.status === "RESOLVED").length,
      evaluationsToday: 0,
    };
  }, [rules, violations]);

  // Get active violations (BLOCK first, then WARN)
  const activeViolations = violations
    .filter((v) => v.status === "ACTIVE")
    .sort((a, b) => {
      if (a.severity === "BLOCK" && b.severity !== "BLOCK") return -1;
      if (a.severity !== "BLOCK" && b.severity === "BLOCK") return 1;
      return new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime();
    });

  // Get recently triggered rules
  const recentlyTriggered = rules
    .filter((r) => r.lastViolatedAt)
    .sort((a, b) => new Date(b.lastViolatedAt!).getTime() - new Date(a.lastViolatedAt!).getTime())
    .slice(0, 5);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading compliance data…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Rule management, violation tracking, and compliance analysis
          </p>
        </div>
        <Button asChild>
          <Link href="/app/compliance/rules">
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              {summary.blockRules} block, {summary.warnRules} warn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.activeViolations}</div>
            <p className="text-xs text-muted-foreground">
              {summary.blockViolations} blocks, {summary.warnViolations} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Orders</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.blockViolations}</div>
            <p className="text-xs text-muted-foreground">
              Require resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.resolvedViolations}</div>
            <p className="text-xs text-muted-foreground">
              {summary.evaluationsToday} evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/compliance/rules")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Rule Management</CardTitle>
              <CardDescription>Create and manage compliance rules</CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/compliance/violations")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Violations</CardTitle>
              <CardDescription>
                {summary.activeViolations} active violations to review
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/compliance/violations?severity=BLOCK")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Blocked Orders</CardTitle>
              <CardDescription>
                {summary.blockViolations} orders blocked by compliance
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      {/* Rule Scope Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rule Distribution by Scope</CardTitle>
          <CardDescription>Active rules across different scope levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.globalRules}</div>
                <p className="text-sm text-muted-foreground">Global Rules</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.householdRules}</div>
                <p className="text-sm text-muted-foreground">Household Rules</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.accountRules}</div>
                <p className="text-sm text-muted-foreground">Account Rules</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Violations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Violations</CardTitle>
                <CardDescription>
                  {activeViolations.length} violation{activeViolations.length !== 1 ? "s" : ""} requiring attention
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/compliance/violations">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeViolations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeViolations.slice(0, 5).map((violation) => (
                    <TableRow
                      key={violation.violationId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/compliance/violations?id=${violation.violationId}`)}
                    >
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">{violation.ruleName}</span>
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
                        <span className="text-sm">{violation.accountName}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatNumber(violation.metricValue)}
                          </span>
                          <span className="text-muted-foreground"> / {formatNumber(violation.threshold)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active violations
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Triggered Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recently Triggered</CardTitle>
                <CardDescription>Rules that were violated recently</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/compliance/rules">View All Rules</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentlyTriggered.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-right">Violations</TableHead>
                    <TableHead className="text-right">Last Triggered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentlyTriggered.map((rule) => (
                    <TableRow
                      key={rule.ruleId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/compliance/rules/${rule.ruleId}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                          <span className="font-medium text-sm">{rule.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getScopeColor(rule.scope)}>
                          {rule.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {rule.violationCount}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {rule.lastViolatedAt ? formatDateTime(rule.lastViolatedAt) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recently triggered rules
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
