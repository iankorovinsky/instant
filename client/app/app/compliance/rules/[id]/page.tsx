"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Edit,
  Power,
  Trash2,
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
import {
  getRuleById,
  getRuleVersions,
  getViolationsForRule,
  getEvaluationsForRule,
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
} from "@/lib/compliance/mock-data";
import type { RuleScope } from "@/lib/compliance/types";

export default function RuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const rule = getRuleById(id);
  const versions = getRuleVersions(id);
  const violations = getViolationsForRule(id);
  const evaluations = getEvaluationsForRule(id);

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
  const operatorInfo = operatorDefinitions.find((o) => o.id === rule.predicate.operator);
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
          <Button variant="outline">
            <Power className="mr-2 h-4 w-4" />
            {rule.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Rule
          </Button>
        </div>
      </div>

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
