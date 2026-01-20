"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  RefreshCw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDriftStatus, formatDate, formatPercent } from "@/lib/pms/ui";
import { getAccounts, getDrift, getHouseholds } from "@/lib/api/pms";

type DriftFilter = "all" | "in_tolerance" | "warning" | "out_of_tolerance";

export default function DriftDashboardPage() {
  const router = useRouter();
  const [driftFilter, setDriftFilter] = useState<DriftFilter>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [portfolioDrift, setPortfolioDrift] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);

  const loadDrift = async () => {
    try {
      const [driftResponse, accountsResponse, householdsResponse] = await Promise.all([
        getDrift(),
        getAccounts(),
        getHouseholds(),
      ]);
      setPortfolioDrift(driftResponse.drift);
      setAccounts(accountsResponse.accounts);
      setHouseholds(householdsResponse.households);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to load drift data", err);
    }
  };

  useEffect(() => {
    loadDrift();
  }, []);

  // Enrich drift data with account and model info
  const enrichedDrift = portfolioDrift.map((drift) => {
    const account = accounts.find((a) => a.accountId === drift.accountId);
    const household = account
      ? households.find((h) => h.householdId === account.householdId)
      : null;
    const modelId = account?.modelId;
    const status = getDriftStatus(drift.overallDrift);

    return {
      ...drift,
      account,
      household,
      modelId,
      status,
    };
  });

  // Filter based on selection
  const filteredDrift = enrichedDrift.filter((d) => {
    if (driftFilter === "all") return true;
    return d.status.status === driftFilter;
  });

  // Summary counts
  const inTolerance = enrichedDrift.filter((d) => d.status.status === "in_tolerance").length;
  const warnings = enrichedDrift.filter((d) => d.status.status === "warning").length;
  const outOfTolerance = enrichedDrift.filter((d) => d.status.status === "out_of_tolerance").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_tolerance":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            In Tolerance
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        );
      case "out_of_tolerance":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Out of Tolerance
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drift Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Track portfolio drift from target allocations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Last updated: {formatDate(lastRefresh)}
          </p>
          <Button variant="outline" onClick={loadDrift}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichedDrift.length}</div>
            <p className="text-xs text-muted-foreground">Monitored for drift</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setDriftFilter("in_tolerance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Tolerance</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inTolerance}</div>
            <Progress
              value={enrichedDrift.length ? (inTolerance / enrichedDrift.length) * 100 : 0}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setDriftFilter("warning")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warnings}</div>
            <Progress
              value={enrichedDrift.length ? (warnings / enrichedDrift.length) * 100 : 0}
              className="mt-2 h-1 [&>div]:bg-yellow-500"
            />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => setDriftFilter("out_of_tolerance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Tolerance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfTolerance}</div>
            <Progress
              value={enrichedDrift.length ? (outOfTolerance / enrichedDrift.length) * 100 : 0}
              className="mt-2 h-1 [&>div]:bg-red-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Drift Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Drift Analysis</CardTitle>
              <CardDescription>
                {filteredDrift.length} account{filteredDrift.length !== 1 ? "s" : ""} shown
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select
                value={driftFilter}
                onValueChange={(v) => setDriftFilter(v as DriftFilter)}
              >
                <SelectTrigger className="w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_tolerance">In Tolerance</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="out_of_tolerance">Out of Tolerance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Current Duration</TableHead>
                <TableHead className="text-right">Target Duration</TableHead>
                <TableHead className="text-right">Duration Drift</TableHead>
                <TableHead className="text-right">Overall Drift</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Rebalanced</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrift.map((drift) => (
                <TableRow
                  key={drift.accountId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/app/pms/accounts/${drift.accountId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{drift.account?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {drift.household?.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {drift.modelId || "No model"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {drift.currentDuration.toFixed(2)}y
                  </TableCell>
                  <TableCell className="text-right">
                    {drift.targetDuration.toFixed(2)}y
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`flex items-center justify-end gap-1 ${
                        Math.abs(drift.durationDrift) > 15
                          ? "text-red-600"
                          : Math.abs(drift.durationDrift) > 5
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {drift.currentDuration > drift.targetDuration ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {formatPercent(drift.durationDrift)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        drift.status.status === "out_of_tolerance"
                          ? "text-red-600"
                          : drift.status.status === "warning"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatPercent(drift.overallDrift)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(drift.status.status)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {drift.lastRebalancedAt
                      ? formatDate(new Date(drift.lastRebalancedAt))
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/app/pms/optimization?account=${drift.accountId}`);
                      }}
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDrift.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No accounts match the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bucket Drift Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Bucket Drift Breakdown</CardTitle>
          <CardDescription>
            Detailed drift analysis by maturity bucket for accounts out of tolerance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {enrichedDrift
              .filter((d) => d.status.status === "out_of_tolerance")
              .map((drift) => (
                <div key={drift.accountId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{drift.account?.name}</span>
                      {getStatusBadge(drift.status.status)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/app/pms/optimization?account=${drift.accountId}`)
                      }
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Rebalance
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(drift.bucketDrifts).map(([bucket, driftValue]) => (
                      <div key={bucket} className="flex-1">
                        <div className="text-center mb-2">
                          <div className="text-sm font-medium">{bucket}</div>
                          <div
                            className={`text-lg font-bold ${
                              Math.abs(driftValue) > 10
                                ? "text-red-600"
                                : Math.abs(driftValue) > 5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {driftValue >= 0 ? "+" : ""}
                            {driftValue}%
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              driftValue > 0 ? "bg-red-500" : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(Math.abs(driftValue) * 2, 100)}%`,
                              marginLeft: driftValue < 0 ? "auto" : 0,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {enrichedDrift.filter((d) => d.status.status === "out_of_tolerance").length ===
              0 && (
              <p className="text-center text-muted-foreground py-8">
                No accounts are currently out of tolerance.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
