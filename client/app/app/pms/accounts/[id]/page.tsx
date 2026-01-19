"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Briefcase, Building2, LayoutGrid } from "lucide-react";
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
import { portfolioModels, formatCurrency, formatDate } from "@/lib/pms/mock-data";
import { getAccountView, getHouseholdView } from "@/lib/api/pms";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [accountView, setAccountView] = useState<any | null>(null);
  const [household, setHousehold] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      setIsLoading(true);
      try {
        const view = await getAccountView(id);
        setAccountView(view);
        if (view?.account?.householdId) {
          const householdView = await getHouseholdView(view.account.householdId);
          setHousehold(householdView.household);
        }
      } catch (err) {
        console.error("Failed to load account view", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAccount();
  }, [id]);

  const account = accountView?.account;
  const positions = accountView?.positions || [];
  const analytics = accountView?.analytics;
  const model = account?.modelId
    ? portfolioModels.find((m) => m.modelId === account.modelId)
    : null;

  if (!account && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Account not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/pms/accounts">Back to Accounts</Link>
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
            <Link href="/app/pms/accounts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{account?.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {account?.accountType}
                  </Badge>
                  {account?.createdAt && <span>Created {formatDate(new Date(account.createdAt))}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button>
          <TrendingUp className="mr-2 h-4 w-4" />
          Run Optimization
        </Button>
      </div>

      {/* Account Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/app/pms/households/${household?.householdId}`}
              className="flex items-center gap-3 hover:text-primary"
            >
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{household?.name || "Unknown"}</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Model</CardTitle>
          </CardHeader>
          <CardContent>
            {model ? (
              <Link
                href={`/app/pms/models/${model.modelId}`}
                className="flex items-center gap-3 hover:text-primary"
              >
                <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{model.name}</span>
                  <p className="text-xs text-muted-foreground">
                    Target: {model.durationTarget}y duration
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <LayoutGrid className="h-5 w-5" />
                <span>No model assigned</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Value</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <>
                <div className="text-2xl font-bold">{formatCurrency(analytics.totalMarketValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Cash: {formatCurrency(analytics.cashBalance)} ({analytics.cashPercentage}%)
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? `${analytics.totalDuration.toFixed(2)} years` : "--"}
            </div>
            {model && (
              <p className="text-xs text-muted-foreground">
                Target: {model.durationTarget}y
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DV01</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? formatCurrency(analytics.totalDv01) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">Dollar value of 1bp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
            <p className="text-xs text-muted-foreground">Active holdings</p>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Bucket Allocation</CardTitle>
          <CardDescription>
            Distribution of portfolio across maturity buckets
            {model && " vs. model targets"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {analytics &&
              Object.entries(analytics.bucketWeights).map(([bucket, weight]) => {
              const targetWeight = model?.bucketWeights[bucket as keyof typeof model.bucketWeights];
              return (
                <div key={bucket} className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">{bucket}</div>
                    <div className="text-2xl font-bold">{weight}%</div>
                    {model && targetWeight !== undefined && (
                      <div className="text-xs text-muted-foreground">Target: {targetWeight}%</div>
                    )}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(weight, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Current positions in this account</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUSIP</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">DV01</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.instrumentId}>
                  <TableCell className="font-mono text-sm">{position.cusip}</TableCell>
                  <TableCell>{position.description}</TableCell>
                  <TableCell className="text-right">
                    {position.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{position.avgCost.toFixed(2)}</TableCell>
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
