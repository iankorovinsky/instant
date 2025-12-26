"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText } from "lucide-react";
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
import { proposals, accounts, households, formatDate, formatCurrency } from "@/lib/pms/mock-data";
import type { ProposalTrade } from "@/lib/pms/types";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-green-100 text-green-800",
  SENT_TO_OMS: "bg-blue-100 text-blue-800",
  EXECUTED: "bg-purple-100 text-purple-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function ProposalsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredProposals = proposals.filter((proposal) => {
    const account = proposal.accountId
      ? accounts.find((a) => a.accountId === proposal.accountId)
      : null;
    const household = proposal.householdId
      ? households.find((h) => h.householdId === proposal.householdId)
      : account
      ? households.find((h) => h.householdId === account.householdId)
      : null;

    const matchesSearch =
      account?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      household?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.proposalId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage trade proposals for portfolio optimization
          </p>
        </div>
        <Button onClick={() => router.push("/app/pms/optimization")}>
          <Plus className="mr-2 h-4 w-4" />
          New Proposal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proposals.filter((p) => p.status === "DRAFT").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {proposals.filter((p) => p.status === "APPROVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent to OMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {proposals.filter((p) => p.status === "SENT_TO_OMS").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Proposals</CardTitle>
              <CardDescription>
                {filteredProposals.length} proposal{filteredProposals.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SENT_TO_OMS">Sent to OMS</SelectItem>
                  <SelectItem value="EXECUTED">Executed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((proposal) => {
                const account = proposal.accountId
                  ? accounts.find((a) => a.accountId === proposal.accountId)
                  : null;
                const household = proposal.householdId
                  ? households.find((h) => h.householdId === proposal.householdId)
                  : account
                  ? households.find((h) => h.householdId === account.householdId)
                  : null;

                const totalNotional = proposal.trades.reduce(
                  (sum: number, t: ProposalTrade) => sum + t.estimatedValue,
                  0
                );

                return (
                  <TableRow
                    key={proposal.proposalId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/app/pms/proposals/${proposal.proposalId}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium font-mono text-sm">
                            {proposal.proposalId}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            As of {formatDate(proposal.asOfDate)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {proposal.householdId ? household?.name : account?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {proposal.householdId ? "Household" : "Account"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-green-600">
                          {proposal.trades.filter((t: ProposalTrade) => t.side === "BUY").length} buys
                        </Badge>
                        <Badge variant="outline" className="text-red-600">
                          {proposal.trades.filter((t: ProposalTrade) => t.side === "SELL").length} sells
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totalNotional)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[proposal.status]}>
                        {proposal.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(proposal.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProposals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No proposals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
