"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Trash2, LayoutGrid, Briefcase, Plus } from "lucide-react";
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
import { portfolioModels, accounts, households, formatDate, formatCurrency, getAccountAnalytics } from "@/lib/pms/mock-data";

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const model = portfolioModels.find((m) => m.modelId === id);
  const assignedAccounts = accounts.filter((a) => model?.assignedAccountIds.includes(a.accountId));

  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Model not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/pms/models">Back to Models</Link>
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
            <Link href="/app/pms/models">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <LayoutGrid className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{model.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Last updated {formatDate(model.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button>Edit Model</Button>
        </div>
      </div>

      {/* Description */}
      {model.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{model.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Target Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Duration Target</CardTitle>
            <CardDescription>Target portfolio duration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{model.durationTarget}</div>
            <p className="text-sm text-muted-foreground mt-1">years</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
            <CardDescription>Position and turnover limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {model.constraints?.maxPositionSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Position Size</span>
                  <span className="font-medium">{model.constraints.maxPositionSize}%</span>
                </div>
              )}
              {model.constraints?.maxTurnover && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Turnover</span>
                  <span className="font-medium">{model.constraints.maxTurnover}%</span>
                </div>
              )}
              {!model.constraints?.maxPositionSize && !model.constraints?.maxTurnover && (
                <p className="text-muted-foreground">No constraints defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Target Bucket Weights</CardTitle>
          <CardDescription>Target allocation across maturity buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Object.entries(model.bucketWeights).map(([bucket, weight]) => {
              const weightValue = weight as number;
              return (
                <div key={bucket} className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">{bucket}</div>
                    <div className="text-2xl font-bold">{weightValue}%</div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${weightValue}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned Accounts</CardTitle>
            <CardDescription>
              {assignedAccounts.length} account{assignedAccounts.length !== 1 ? "s" : ""} using this model
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Assign Accounts
          </Button>
        </CardHeader>
        <CardContent>
          {assignedAccounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Household</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Current Duration</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedAccounts.map((account) => {
                  const household = households.find((h) => h.householdId === account.householdId);
                  const analytics = getAccountAnalytics(account.accountId);
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
                      <TableCell className="text-muted-foreground">
                        {household?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {account.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {analytics.totalDuration.toFixed(2)}y
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(analytics.totalMarketValue)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No accounts assigned to this model yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
