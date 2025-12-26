"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Check,
  X,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Briefcase,
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
  proposals,
  accounts,
  households,
  portfolioTargets,
  portfolioModels,
  formatDate,
  formatCurrency,
} from "@/lib/pms/mock-data";
import type { ProposalTrade } from "@/lib/pms/types";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-green-100 text-green-800",
  SENT_TO_OMS: "bg-blue-100 text-blue-800",
  EXECUTED: "bg-purple-100 text-purple-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const proposal = proposals.find((p) => p.proposalId === id);
  const account = proposal?.accountId
    ? accounts.find((a) => a.accountId === proposal.accountId)
    : null;
  const household = proposal?.householdId
    ? households.find((h) => h.householdId === proposal.householdId)
    : account
    ? households.find((h) => h.householdId === account.householdId)
    : null;
  const target = proposal?.targetId
    ? portfolioTargets.find((t) => t.targetId === proposal.targetId)
    : null;
  const model = target?.modelId
    ? portfolioModels.find((m) => m.modelId === target.modelId)
    : null;

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Proposal not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/app/pms/proposals">Back to Proposals</Link>
        </Button>
      </div>
    );
  }

  const buyTrades = proposal.trades.filter((t: ProposalTrade) => t.side === "BUY");
  const sellTrades = proposal.trades.filter((t: ProposalTrade) => t.side === "SELL");
  const totalBuyValue = buyTrades.reduce((sum: number, t: ProposalTrade) => sum + t.estimatedValue, 0);
  const totalSellValue = sellTrades.reduce((sum: number, t: ProposalTrade) => sum + t.estimatedValue, 0);

  const durationChange =
    proposal.predictedAnalytics.totalDuration - proposal.currentAnalytics.totalDuration;
  const dv01Change =
    proposal.predictedAnalytics.totalDv01 - proposal.currentAnalytics.totalDv01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/pms/proposals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight font-mono">
                    {proposal.proposalId}
                  </h1>
                  <Badge className={statusColors[proposal.status]}>
                    {proposal.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  As of {formatDate(proposal.asOfDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {proposal.status === "DRAFT" && (
          <div className="flex gap-2">
            <Button variant="outline" className="text-destructive">
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send to OMS
            </Button>
          </div>
        )}
        {proposal.status === "APPROVED" && (
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send to OMS
          </Button>
        )}
      </div>

      {/* Scope and Target Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope</CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.householdId ? (
              <Link
                href={`/app/pms/households/${household?.householdId}`}
                className="flex items-center gap-3 hover:text-primary"
              >
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{household?.name || "Unknown"}</span>
                  <p className="text-xs text-muted-foreground">Household-level optimization</p>
                </div>
              </Link>
            ) : (
              <Link
                href={`/app/pms/accounts/${account?.accountId}`}
                className="flex items-center gap-3 hover:text-primary"
              >
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{account?.name || "Unknown"}</span>
                  <p className="text-xs text-muted-foreground">Account-level optimization</p>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {target ? (
              <div>
                <p className="font-medium">
                  {model?.name || `Duration Target: ${target.durationTarget}y`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target Duration: {target.durationTarget} years
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No target specified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
          <CardDescription>Comparison of current vs. predicted metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-4">Current Portfolio</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Value</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.currentAnalytics.totalMarketValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {proposal.currentAnalytics.totalDuration.toFixed(2)}y
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DV01</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.currentAnalytics.totalDv01)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.currentAnalytics.cashBalance)} (
                    {proposal.currentAnalytics.cashPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Predicted After Trades</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Value</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.predictedAnalytics.totalMarketValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium flex items-center gap-2">
                    {proposal.predictedAnalytics.totalDuration.toFixed(2)}y
                    <span
                      className={`text-xs ${
                        durationChange < 0 ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      ({durationChange >= 0 ? "+" : ""}
                      {durationChange.toFixed(2)}y)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DV01</span>
                  <span className="font-medium flex items-center gap-2">
                    {formatCurrency(proposal.predictedAnalytics.totalDv01)}
                    <span className="text-xs text-muted-foreground">
                      ({dv01Change >= 0 ? "+" : ""}
                      {formatCurrency(dv01Change)})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash</span>
                  <span className="font-medium">
                    {formatCurrency(proposal.predictedAnalytics.cashBalance)} (
                    {proposal.predictedAnalytics.cashPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bucket Weights Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Bucket Weight Changes</CardTitle>
          <CardDescription>Distribution shift across maturity buckets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Object.entries(proposal.currentAnalytics.bucketWeights).map(([bucket, currentValue]) => {
              const current = currentValue as number;
              const predicted =
                proposal.predictedAnalytics.bucketWeights[
                  bucket as keyof typeof proposal.predictedAnalytics.bucketWeights
                ] as number;
              const change = predicted - current;
              const targetWeight = target?.bucketWeights[bucket as keyof typeof target.bucketWeights] as number | undefined;

              return (
                <div key={bucket} className="flex-1">
                  <div className="text-center mb-2">
                    <div className="text-sm font-medium">{bucket}</div>
                    <div className="text-2xl font-bold">{predicted}%</div>
                    <div
                      className={`text-xs ${
                        change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
                      }`}
                    >
                      {change > 0 ? "+" : ""}
                      {change}%
                    </div>
                    {targetWeight !== undefined && (
                      <div className="text-xs text-muted-foreground">Target: {targetWeight}%</div>
                    )}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${predicted}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assumptions */}
      {proposal.assumptions && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{proposal.assumptions}</p>
          </CardContent>
        </Card>
      )}

      {/* Trade Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buys</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBuyValue)}</div>
            <p className="text-xs text-muted-foreground">{buyTrades.length} trades</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sells</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSellValue)}</div>
            <p className="text-xs text-muted-foreground">{sellTrades.length} trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Proposed Trades</CardTitle>
          <CardDescription>
            {proposal.trades.length} trade{proposal.trades.length !== 1 ? "s" : ""} in this proposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Side</TableHead>
                <TableHead>CUSIP</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Est. Price</TableHead>
                <TableHead className="text-right">Est. Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.trades.map((trade: ProposalTrade, index: number) => (
                <TableRow key={`${trade.instrumentId}-${index}`}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={trade.side === "BUY" ? "text-green-600" : "text-red-600"}
                    >
                      {trade.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{trade.cusip}</TableCell>
                  <TableCell>{trade.description}</TableCell>
                  <TableCell className="text-right">{trade.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{trade.estimatedPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(trade.estimatedValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(proposal.createdAt)} by {proposal.createdBy}
                </p>
              </div>
            </div>

            {proposal.approvedAt && (
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Approved</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(proposal.approvedAt)} by {proposal.approvedBy}
                  </p>
                </div>
              </div>
            )}

            {proposal.sentToOmsAt && (
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Sent to OMS</p>
                  <p className="text-sm text-muted-foreground">{formatDate(proposal.sentToOmsAt)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
