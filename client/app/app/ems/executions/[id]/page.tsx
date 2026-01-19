"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Briefcase,
  Building2,
  FileText,
  ExternalLink,
  TrendingDown,
  Layers,
  Cpu,
  Info,
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
  getStateColor,
  formatCurrency,
  formatQuantity,
  formatDate,
  formatDateTime,
  formatPrice,
  formatBasisPoints,
} from "@/lib/ems/mock-data";
import { fetchExecutionById, fetchExecutionEvents } from "@/lib/ems/api";
import { getExecutionWithFills, getExecutionEvents } from "@/lib/ems/mock-data";
import type { ExecutionEvent, ExecutionWithFills } from "@/lib/ems/types";

export default function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [execution, setExecution] = useState<ExecutionWithFills | null>(null);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchExecutionById(id)
      .then((data) => {
        if (isMounted) {
          setExecution(data ?? getExecutionWithFills(id));
        }
      })
      .catch(() => {
        if (isMounted) setExecution(getExecutionWithFills(id));
      });

    fetchExecutionEvents(id)
      .then((data) => {
        if (isMounted) setEvents(data);
      })
      .catch(() => {
        if (isMounted) setEvents(getExecutionEvents(id));
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Execution not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/ems/executions">Back to Execution Tape</Link>
        </Button>
      </div>
    );
  }

  const progress = execution.totalQuantity > 0
    ? Math.round((execution.filledQuantity / execution.totalQuantity) * 100)
    : 0;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "ExecutionRequested":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "ExecutionSimulated":
        return <Cpu className="h-4 w-4 text-purple-600" />;
      case "FillGenerated":
        return <Layers className="h-4 w-4 text-green-600" />;
      case "OrderPartiallyFilled":
        return <Activity className="h-4 w-4 text-yellow-600" />;
      case "OrderFullyFilled":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "SettlementBooked":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "ExecutionCancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/ems/executions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight font-mono">
                    {execution.executionId}
                  </h1>
                  <Badge className={getStateColor(execution.status)}>
                    {execution.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  As of {formatDate(execution.asOfDate)} | Started {formatDateTime(execution.executionStartTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/app/oms/orders/${execution.orderId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Order
            </Link>
          </Button>
          {execution.status === "PARTIALLY_FILLED" && (
            <Button variant="outline" className="text-destructive">
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Remaining
            </Button>
          )}
          {(execution.status === "FILLED" || execution.status === "SETTLED") && (
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Settlement
            </Button>
          )}
        </div>
      </div>

      {/* Execution Info & Order Details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <Link
                href={`/app/oms/orders/${execution.orderId}`}
                className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
              >
                {execution.orderId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Side</span>
              <div className="flex items-center gap-1">
                {execution.side === "BUY" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <Badge
                  variant="outline"
                  className={execution.side === "BUY" ? "text-green-600" : "text-red-600"}
                >
                  {execution.side}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Type</span>
              <Badge variant="secondary">{execution.orderType}</Badge>
            </div>
            {execution.limitPrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limit Price</span>
                <span className="font-mono">{formatPrice(execution.limitPrice)}</span>
              </div>
            )}
            {execution.curveSpread && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Curve Spread</span>
                <span className="font-mono">{execution.curveSpread}bp</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instrument</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CUSIP</span>
              <span className="font-mono">{execution.cusip}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Description</span>
              <p className="font-medium text-sm">{execution.description}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bucket</span>
              <Badge variant="outline">{execution.deterministicInputs.bucket}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/app/pms/accounts/${execution.accountId}`}
              className="flex items-center gap-2 hover:text-primary"
            >
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{execution.accountName}</span>
            </Link>
            {execution.householdName && (
              <Link
                href={`/app/pms/households/${execution.householdId}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{execution.householdName}</span>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fill Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filled Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatQuantity(execution.filledQuantity)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatQuantity(execution.totalQuantity)} ({progress}%)
            </p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Fill Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {execution.avgFillPrice !== null ? formatPrice(execution.avgFillPrice) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseline: {formatPrice(execution.deterministicInputs.baselineMidPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Slippage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (execution.slippageBreakdown?.total || 0) > 10 ? "text-amber-600" : "text-green-600"
            }`}>
              {execution.slippageBreakdown
                ? formatBasisPoints(execution.slippageBreakdown.total)
                : "-"}
            </div>
            {execution.slippageBreakdown && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(execution.slippageBreakdown.totalDollars)} impact
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{execution.fills.length}</div>
            {execution.executionEndTime && (
              <p className="text-xs text-muted-foreground">
                Completed in {Math.round(
                  (execution.executionEndTime.getTime() - execution.executionStartTime.getTime()) / 1000
                )}s
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slippage Decomposition */}
      {execution.slippageBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Slippage Decomposition
            </CardTitle>
            <CardDescription>
              Breakdown of slippage components for this execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-4">Component Breakdown</h4>
                <div className="space-y-4">
                  {execution.slippageBreakdown.components.map((component, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {component.type.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">
                          {formatBasisPoints(component.amount)} ({component.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            component.type === "BUCKET_SPREAD"
                              ? "bg-blue-500"
                              : component.type === "SIZE_IMPACT"
                              ? "bg-amber-500"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${Math.abs(component.percentage)}%` }}
                        />
                      </div>
                      {component.description && (
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-4">Slippage Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bucket Spread</span>
                    <span className="font-medium">
                      {formatBasisPoints(execution.slippageBreakdown.bucketSpread)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size Impact</span>
                    <span className="font-medium">
                      {formatBasisPoints(execution.slippageBreakdown.sizeImpact)}
                    </span>
                  </div>
                  {execution.slippageBreakdown.limitConstraint !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Limit Constraint</span>
                      <span className={`font-medium ${
                        execution.slippageBreakdown.limitConstraint < 0 ? "text-green-600" : ""
                      }`}>
                        {formatBasisPoints(execution.slippageBreakdown.limitConstraint)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total Slippage</span>
                    <span>{formatBasisPoints(execution.slippageBreakdown.total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Dollar Impact</span>
                    <span>{formatCurrency(execution.slippageBreakdown.totalDollars)}</span>
                  </div>
                </div>

                {/* Visual bar chart */}
                <div className="mt-6">
                  <div className="h-8 bg-muted rounded flex overflow-hidden">
                    {execution.slippageBreakdown.components.map((component, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-center text-xs text-white font-medium ${
                          component.type === "BUCKET_SPREAD"
                            ? "bg-blue-500"
                            : component.type === "SIZE_IMPACT"
                            ? "bg-amber-500"
                            : "bg-purple-500"
                        }`}
                        style={{ width: `${Math.abs(component.percentage)}%` }}
                      >
                        {component.percentage > 15 && `${component.percentage.toFixed(0)}%`}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span>Bucket Spread</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-500 rounded" />
                      <span>Size Impact</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span>Limit Constraint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fill Details */}
      {execution.fills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fill Details</CardTitle>
            <CardDescription>
              {execution.fills.length} clip{execution.fills.length !== 1 ? "s" : ""} generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clip</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Slippage</TableHead>
                  <TableHead className="text-right">Cumulative</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {execution.fills.map((fill) => (
                  <TableRow key={fill.fillId}>
                    <TableCell>
                      <Badge variant="outline">Clip {fill.clipIndex}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatQuantity(fill.quantity)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(fill.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={fill.slippage > 10 ? "text-amber-600" : "text-green-600"}>
                        {formatBasisPoints(fill.slippage)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatQuantity(fill.cumulativeQuantity)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {formatDateTime(fill.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Deterministic Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Deterministic Inputs
          </CardTitle>
          <CardDescription>
            Parameters used for deterministic execution simulation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium mb-3">Liquidity Profile</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bucket</span>
                  <Badge variant="outline">{execution.deterministicInputs.bucket}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spread</span>
                  <span>{execution.deterministicInputs.spreadBp}bp</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Clip Size</span>
                  <span>{formatCurrency(execution.deterministicInputs.maxClip)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delay per Clip</span>
                  <span>{execution.deterministicInputs.delayMsPerClip}ms</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Pricing Inputs</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Baseline Mid</span>
                  <span className="font-mono">
                    {formatPrice(execution.deterministicInputs.baselineMidPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">As-of Date</span>
                  <span>{formatDate(execution.deterministicInputs.pricingAsOfDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Curve Source</span>
                  <span>{execution.deterministicInputs.curveSource}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Model Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model Version</span>
                  <Badge>{execution.deterministicInputs.modelVersion}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size Impact Function</span>
                  <span>{execution.deterministicInputs.sizeImpactFunction}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Function Parameters</span>
                  <pre className="text-xs bg-muted p-2 rounded mt-1">
                    {JSON.stringify(execution.deterministicInputs.sizeImpactParameters, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{execution.explanation}</p>
        </CardContent>
      </Card>

      {/* Event Timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Timeline</CardTitle>
            <CardDescription>
              Chronological events for this execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.eventId} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getEventIcon(event.eventType)}
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-px h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {event.eventType.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement Info */}
      {(execution.status === "FILLED" || execution.status === "SETTLED") && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-muted-foreground text-sm">Settlement Status</span>
                <p className="font-medium">
                  {execution.settledDate ? "Settled" : "Pending Settlement"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Settlement Date</span>
                <p className="font-medium">
                  {execution.settlementDate ? formatDate(execution.settlementDate) : "-"}
                </p>
              </div>
              {execution.settledDate && (
                <div>
                  <span className="text-muted-foreground text-sm">Settled Date</span>
                  <p className="font-medium">{formatDate(execution.settledDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
