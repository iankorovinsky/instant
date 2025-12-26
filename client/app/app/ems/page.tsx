"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  FileText,
  Zap,
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
  executions,
  getExecutionSummary,
  getStateColor,
  formatCurrency,
  formatQuantity,
  formatDateTime,
  formatBasisPoints,
} from "@/lib/ems/mock-data";

export default function EMSDashboardPage() {
  const router = useRouter();
  const summary = getExecutionSummary();

  // Get active executions (pending, simulating, partially filled)
  const activeExecutions = executions.filter(
    (e) => e.status === "PENDING" || e.status === "SIMULATING" || e.status === "PARTIALLY_FILLED"
  );

  // Get recent completed executions
  const recentCompleted = executions
    .filter((e) => e.status === "FILLED" || e.status === "SETTLED")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execution Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor executions, fills, and slippage analysis
          </p>
        </div>
        <Button asChild>
          <Link href="/app/ems/executions">
            <Activity className="mr-2 h-4 w-4" />
            View Execution Tape
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Executions</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.pending + summary.simulating + summary.partiallyFilled}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.pending} pending, {summary.partiallyFilled} partial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.filled + summary.settled}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.settled} settled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Slippage</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBasisPoints(summary.avgSlippageBp)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {formatBasisPoints(summary.totalSlippageBp)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalFilledQuantity)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.total} executions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Execution Tape</CardTitle>
              <CardDescription>View all executions and fills</CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=PARTIALLY_FILLED")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Partial Fills</CardTitle>
              <CardDescription>
                {summary.partiallyFilled} executions in progress
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=PENDING")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Pending Executions</CardTitle>
              <CardDescription>
                {summary.pending + summary.simulating} awaiting simulation
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Executions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Executions</CardTitle>
                <CardDescription>
                  {activeExecutions.length} execution{activeExecutions.length !== 1 ? "s" : ""} in progress
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/ems/executions?status=PENDING,SIMULATING,PARTIALLY_FILLED">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeExecutions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeExecutions.slice(0, 5).map((execution) => {
                    const progress = execution.totalQuantity > 0
                      ? Math.round((execution.filledQuantity / execution.totalQuantity) * 100)
                      : 0;

                    return (
                      <TableRow
                        key={execution.executionId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/app/ems/executions/${execution.executionId}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-mono text-xs">
                                {execution.executionId.slice(0, 12)}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {execution.side}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{execution.cusip}</span>
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <div className="text-xs text-muted-foreground mb-1">
                              {progress}%
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStateColor(execution.status)}>
                            {execution.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active executions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Completed</CardTitle>
                <CardDescription>
                  Recently filled and settled executions
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/ems/executions?status=FILLED,SETTLED">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCompleted.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Slippage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCompleted.map((execution) => (
                    <TableRow
                      key={execution.executionId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/app/ems/executions/${execution.executionId}`)}
                    >
                      <TableCell>
                        <div>
                          <span className="font-mono text-sm">{execution.cusip}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {execution.description.split(" ").slice(0, 3).join(" ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(execution.filledQuantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          (execution.slippageBreakdown?.total || 0) > 10
                            ? "text-amber-600"
                            : "text-green-600"
                        }>
                          {formatBasisPoints(execution.slippageBreakdown?.total || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStateColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No completed executions
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slippage Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Slippage by Bucket</CardTitle>
          <CardDescription>
            Average slippage decomposition across maturity buckets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { bucket: "0-2y", spread: 2, avgSlippage: 1.5 },
              { bucket: "2-5y", spread: 4, avgSlippage: 3.2 },
              { bucket: "5-10y", spread: 6, avgSlippage: 5.5 },
              { bucket: "10-20y", spread: 10, avgSlippage: 8.2 },
              { bucket: "20y+", spread: 15, avgSlippage: 14.5 },
            ].map((bucket) => (
              <div key={bucket.bucket} className="text-center">
                <div className="text-sm font-medium mb-2">{bucket.bucket}</div>
                <div className="h-24 bg-muted rounded relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded"
                    style={{ height: `${(bucket.spread / 15) * 100}%` }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded"
                    style={{ height: `${(bucket.avgSlippage / 15) * 100}%` }}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold">{bucket.avgSlippage}bp</div>
                  <div className="text-xs text-muted-foreground">
                    Spread: {bucket.spread}bp
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded" />
              <span className="text-muted-foreground">Base Spread</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded" />
              <span className="text-muted-foreground">Avg Slippage</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
