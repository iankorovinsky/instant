"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, Briefcase } from "lucide-react";
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
import { getAccounts, getHouseholds } from "@/lib/api/pms";
import { formatCurrency } from "@/lib/pms/ui";

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [accountsResponse, householdsResponse] = await Promise.all([
          getAccounts(),
          getHouseholds(),
        ]);
        setAccounts(accountsResponse.accounts || []);
        setHouseholds(householdsResponse.households || []);
      } catch (err) {
        console.error("Failed to load model assignments", err);
        setAccounts([]);
        setHouseholds([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const assignedAccounts = accounts.filter((account) => account.modelId === id);

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
                <h1 className="text-2xl font-bold tracking-tight">Model {id}</h1>
                <p className="text-sm text-muted-foreground">
                  Model details are not available yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned Accounts</CardTitle>
            <CardDescription>
              {assignedAccounts.length} account{assignedAccounts.length !== 1 ? "s" : ""} using this model
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading assignments...</div>
          ) : assignedAccounts.length > 0 ? (
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
                        {account.duration ? `${Number(account.duration).toFixed(2)}y` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(account.marketValue || 0)}
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
