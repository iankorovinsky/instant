"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, TrendingUp, Building2, Briefcase } from "lucide-react";
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
  households,
  accounts,
  positions,
  getHouseholdAnalytics,
  formatCurrency,
  formatDate,
} from "@/lib/pms/mock-data";

export default function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const household = households.find((h) => h.householdId === id);
  const householdAccounts = accounts.filter((a) => a.householdId === id);
  const analytics = getHouseholdAnalytics(id);

  // Get aggregated positions
  const householdPositions = positions.filter((p) =>
    householdAccounts.some((a) => a.accountId === p.accountId)
  );

  // Aggregate positions by CUSIP
  const aggregatedPositions = householdPositions.reduce((acc, pos) => {
    const existing = acc.find((p) => p.cusip === pos.cusip);
    if (existing) {
      existing.quantity += pos.quantity;
      existing.marketValue += pos.marketValue;
      existing.dv01 += pos.dv01;
    } else {
      acc.push({ ...pos });
    }
    return acc;
  }, [] as typeof householdPositions);

  if (!household) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Household not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/pms/households">Back to Households</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/pms/households">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{household.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Created {formatDate(household.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
          <Button>
            <TrendingUp className="mr-2 h-4 w-4" />
            Run Optimization
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalMarketValue)}</div>
            <p className="text-xs text-muted-foreground">
              Cash: {formatCurrency(analytics.cashBalance)} ({analytics.cashPercentage}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDuration.toFixed(2)} years</div>
            <p className="text-xs text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DV01</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalDv01)}</div>
            <p className="text-xs text-muted-foreground">Dollar value of 1bp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{householdAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {aggregatedPositions.length} unique positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Bucket Allocation</CardTitle>
          <CardDescription>Distribution of portfolio across maturity buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Object.entries(analytics.bucketWeights).map(([bucket, weight]) => (
              <div key={bucket} className="flex-1">
                <div className="text-center mb-2">
                  <div className="text-sm font-medium">{bucket}</div>
                  <div className="text-2xl font-bold">{weight}%</div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>All accounts in this household</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Positions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {householdAccounts.map((account) => {
                const accountPositions = positions.filter((p) => p.accountId === account.accountId);
                const marketValue = accountPositions.reduce((sum, p) => sum + p.marketValue, 0);
                return (
                  <TableRow
                    key={account.accountId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/app/pms/accounts/${account.accountId}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {account.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(marketValue)}
                    </TableCell>
                    <TableCell className="text-right">{accountPositions.length}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Aggregated Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregated Positions</CardTitle>
          <CardDescription>All positions across household accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUSIP</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">DV01</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregatedPositions.map((position) => (
                <TableRow key={position.cusip}>
                  <TableCell className="font-mono text-sm">{position.cusip}</TableCell>
                  <TableCell>{position.description}</TableCell>
                  <TableCell className="text-right">
                    {position.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(position.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">{position.duration.toFixed(1)}y</TableCell>
                  <TableCell className="text-right">{formatCurrency(position.dv01)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
