"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/pms/ui";
import { createHousehold, getHouseholds } from "@/lib/api/pms";

export default function HouseholdsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [households, setHouseholds] = useState<
    Array<{
      householdId: string;
      name: string;
      accountCount: number;
      totalMarketValue: number;
      createdAt: string;
      lastActivity: string;
    }>
  >([]);

  const loadHouseholds = async () => {
    try {
      const response = await getHouseholds();
      setHouseholds(response.households);
    } catch (err) {
      console.error("Failed to load households", err);
    }
  };

  useEffect(() => {
    loadHouseholds();
  }, []);

  const handleCreateHousehold = async () => {
    const trimmed = newHouseholdName.trim();
    if (!trimmed) {
      setCreateError("Name is required");
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      await createHousehold({ name: trimmed, createdBy: "advisor@instant.com" });
      await loadHouseholds();
      setNewHouseholdName("");
      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create household");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredHouseholds = households.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground mt-1">
            Manage client households and their accounts
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Household
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Create Household</DialogTitle>
              <DialogDescription>
                Add a new household to begin tracking accounts and positions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="householdName">Household Name</Label>
                <Input
                  id="householdName"
                  placeholder="Enter household name"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHousehold} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Household"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Households</CardTitle>
              <CardDescription>
                {filteredHouseholds.length} household{filteredHouseholds.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search households..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Household Name</TableHead>
                <TableHead className="text-right">Accounts</TableHead>
                <TableHead className="text-right">Total Market Value</TableHead>
                <TableHead className="text-right">Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHouseholds.map((household) => (
                <TableRow
                  key={household.householdId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/app/pms/households/${household.householdId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{household.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(new Date(household.createdAt))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{household.accountCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(household.totalMarketValue)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(new Date(household.lastActivity))}
                  </TableCell>
                </TableRow>
              ))}
              {filteredHouseholds.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No households found.
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
