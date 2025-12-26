"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ExternalLink,
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
  executions,
  getExecutionSummary,
  getStateColor,
  formatCurrency,
  formatQuantity,
  formatDate,
  formatDateTime,
  formatPrice,
  formatBasisPoints,
} from "@/lib/ems/mock-data";
import type { ExecutionState, ExecutionGroupBy } from "@/lib/ems/types";

export default function ExecutionTapePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial status filter from URL
  const initialStatus = searchParams.get("status") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<ExecutionGroupBy>("none");

  const summary = getExecutionSummary();

  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        execution.executionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.cusip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.accountName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const statuses = statusFilter.split(",");
        matchesStatus = statuses.includes(execution.status);
      }

      // Side filter
      const matchesSide = sideFilter === "all" || execution.side === sideFilter;

      return matchesSearch && matchesStatus && matchesSide;
    });
  }, [searchQuery, statusFilter, sideFilter]);

  // Group executions if needed
  const groupedExecutions = useMemo(() => {
    if (groupBy === "none") {
      return { "": filteredExecutions };
    }

    const groups: Record<string, typeof filteredExecutions> = {};

    filteredExecutions.forEach((execution) => {
      let key = "";
      switch (groupBy) {
        case "order":
          key = execution.orderId;
          break;
        case "instrument":
          key = execution.cusip;
          break;
        case "date":
          key = formatDate(execution.asOfDate);
          break;
        case "account":
          key = execution.accountName || "Unknown";
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(execution);
    });

    return groups;
  }, [filteredExecutions, groupBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execution Tape</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze all executions and fills
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">All</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "PENDING,SIMULATING" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("PENDING,SIMULATING")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending + summary.simulating}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "PARTIALLY_FILLED" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("PARTIALLY_FILLED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.partiallyFilled}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "FILLED" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("FILLED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Filled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.filled}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "SETTLED" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("SETTLED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Settled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.settled}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${statusFilter === "CANCELLED" ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
          onClick={() => setStatusFilter("CANCELLED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Executions</CardTitle>
              <CardDescription>
                {filteredExecutions.length} execution{filteredExecutions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={sideFilter} onValueChange={setSideFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sides</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ExecutionGroupBy)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="order">Group by Order</SelectItem>
                  <SelectItem value="instrument">Group by Instrument</SelectItem>
                  <SelectItem value="date">Group by Date</SelectItem>
                  <SelectItem value="account">Group by Account</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search executions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedExecutions).map(([groupKey, groupExecutions]) => (
            <div key={groupKey || "all"} className="mb-6 last:mb-0">
              {groupBy !== "none" && groupKey && (
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <span className="font-medium">{groupKey}</span>
                  <Badge variant="secondary">{groupExecutions.length}</Badge>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Execution ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Slippage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">As-of Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupExecutions.map((execution) => {
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
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">
                              {execution.executionId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/app/oms/orders/${execution.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                          >
                            {execution.orderId.slice(0, 12)}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">{execution.cusip}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {execution.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {formatQuantity(execution.filledQuantity)}
                            </div>
                            {execution.filledQuantity < execution.totalQuantity && (
                              <div className="text-xs text-muted-foreground">
                                of {formatQuantity(execution.totalQuantity)} ({progress}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {execution.avgFillPrice !== null
                            ? formatPrice(execution.avgFillPrice)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {execution.slippageBreakdown ? (
                            <span
                              className={
                                execution.slippageBreakdown.total > 10
                                  ? "text-amber-600 font-medium"
                                  : "text-green-600"
                              }
                            >
                              {formatBasisPoints(execution.slippageBreakdown.total)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStateColor(execution.status)}>
                            {execution.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(execution.asOfDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {groupExecutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No executions found.
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
