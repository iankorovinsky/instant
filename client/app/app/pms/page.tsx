"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  LayoutGrid,
  FileText,
  TrendingUp,
  Gauge,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getDriftStatus } from "@/lib/pms/mock-data";
import { getAccounts, getDrift, getHouseholds, getProposals } from "@/lib/api/pms";

const quickLinks = [
  {
    title: "Households",
    description: "View and manage client households",
    href: "/app/pms/households",
    icon: Building2,
  },
  {
    title: "Accounts",
    description: "Browse all accounts across households",
    href: "/app/pms/accounts",
    icon: Briefcase,
  },
  {
    title: "Models",
    description: "Portfolio models and strategies",
    href: "/app/pms/models",
    icon: LayoutGrid,
  },
  {
    title: "Proposals",
    description: "Review and approve trade proposals",
    href: "/app/pms/proposals",
    icon: FileText,
  },
  {
    title: "Optimization",
    description: "Generate optimization proposals",
    href: "/app/pms/optimization",
    icon: TrendingUp,
  },
  {
    title: "Drift Monitor",
    description: "Track portfolio drift from targets",
    href: "/app/pms/drift",
    icon: Gauge,
  },
  {
    title: "Rebalancing",
    description: "Automated rebalancing rules",
    href: "/app/pms/rebalancing",
    icon: RefreshCw,
  },
];

export default function PMSPage() {
  const [households, setHouseholds] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [portfolioDrift, setPortfolioDrift] = useState<any[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [householdsResponse, accountsResponse, proposalsResponse, driftResponse] =
          await Promise.all([getHouseholds(), getAccounts(), getProposals(), getDrift()]);
        setHouseholds(householdsResponse.households);
        setAccounts(accountsResponse.accounts);
        setProposals(proposalsResponse.proposals);
        setPortfolioDrift(driftResponse.drift);
      } catch (err) {
        console.error("Failed to load PMS summary", err);
      }
    };
    loadSummary();
  }, []);

  const totalAUM = accounts.reduce((sum, a) => sum + (a.marketValue || 0), 0);
  const pendingProposals = proposals.filter((p) => p.status === "DRAFT" || p.status === "APPROVED");
  const outOfToleranceAccounts = portfolioDrift.filter(
    (d) => getDriftStatus(d.overallDrift).status === "out_of_tolerance"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Households</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{households.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets Under Management</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAUM)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProposals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift Alerts</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {outOfToleranceAccounts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{link.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {link.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Proposals</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/pms/proposals">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposals.slice(0, 3).map((proposal) => {
                const account = accounts.find((a) => a.accountId === proposal.accountId);
                const household = households.find((h) => h.householdId === proposal.householdId);
                const tradeCount = Array.isArray(proposal.trades) ? proposal.trades.length : 0;
                return (
                  <div
                    key={proposal.proposalId}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {account?.name || household?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tradeCount} trades - {proposal.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/app/pms/proposals/${proposal.proposalId}`}>View</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Drift Alerts</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/pms/drift">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioDrift
                .filter((d) => getDriftStatus(d.overallDrift).status !== "in_tolerance")
                .slice(0, 3)
                .map((drift) => {
                  const account = accounts.find((a) => a.accountId === drift.accountId);
                  const status = getDriftStatus(drift.overallDrift);
                  return (
                    <div
                      key={drift.accountId}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{account?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Duration: {drift.currentDuration.toFixed(1)}y vs {drift.targetDuration.toFixed(1)}y target
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          status.color === "red"
                            ? "text-destructive"
                            : status.color === "yellow"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {drift.overallDrift.toFixed(1)}% drift
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
