"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/pms/mock-data";
import { getAccounts, getHouseholds } from "@/lib/api/pms";

export default function AccountsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [householdFilter, setHouseholdFilter] = useState<string>("all");
  const [accounts, setAccounts] = useState<
    Array<{
      accountId: string;
      householdId: string;
      name: string;
      accountType: string;
      householdName?: string;
      marketValue: number;
      duration: number;
      lastActivity: string;
    }>
  >([]);
  const [households, setHouseholds] = useState<Array<{ householdId: string; name: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsResponse, householdsResponse] = await Promise.all([
          getAccounts(),
          getHouseholds(),
        ]);
        setAccounts(accountsResponse.accounts);
        setHouseholds(householdsResponse.households);
      } catch (err) {
        console.error("Failed to load accounts", err);
      }
    };
    loadData();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHousehold =
      householdFilter === "all" || account.householdId === householdFilter;
    return matchesSearch && matchesHousehold;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage all accounts across households
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>
                {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Select value={householdFilter} onValueChange={setHouseholdFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by household" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Households</SelectItem>
                  {households.map((h) => (
                    <SelectItem key={h.householdId} value={h.householdId}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
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
                <TableHead>Account Name</TableHead>
                <TableHead>Household</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow
                  key={account.accountId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/app/pms/accounts/${account.accountId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{account.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.householdName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {account.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(account.marketValue)}
                  </TableCell>
                  <TableCell className="text-right">{account.duration.toFixed(2)}y</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(new Date(account.lastActivity))}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No accounts found.
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
