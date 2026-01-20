"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
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
  ExecutionsTable,
  ExecutionFilters,
  useExecutionFilters,
} from "@/components/ems";
import { fetchExecutions } from "@/lib/ems/api";
import type { ExecutionGroupBy } from "@/lib/ems/types";
import type { Execution } from "@/lib/ems/types";

export default function ExecutionTapePage() {
  const [groupBy, setGroupBy] = useState<ExecutionGroupBy>("none");
  const [executions, setExecutions] = useState<Execution[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchExecutions()
      .then((data) => {
        if (isMounted) setExecutions(data);
      });
    return () => {
      isMounted = false;
    };
  }, [executions]);

  const {
    filters,
    setSearchQuery,
    toggleStatus,
    toggleSide,
    toggleOrderType,
    toggleAccount,
    toggleBucket,
    clearAllFilters,
    activeFilterCount,
    filterExecutions,
  } = useExecutionFilters();

  // Get unique accounts from executions
  const uniqueAccounts = useMemo(() => {
    const accounts = new Set<string>();
    executions.forEach(e => {
      if (e.accountName) accounts.add(e.accountName);
    });
    return Array.from(accounts).sort();
  }, []);

  // Apply filters
  const filteredExecutions = useMemo(() => {
    return filterExecutions(executions);
  }, [filterExecutions, executions]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between pb-4 shrink-0">
        <h1 className="text-2xl font-semibold">Execution Tape</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Grouping */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as ExecutionGroupBy)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="order">By Order</SelectItem>
              <SelectItem value="instrument">By Instrument</SelectItem>
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="account">By Account</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters */}
          <ExecutionFilters
            filters={filters}
            accounts={uniqueAccounts}
            activeFilterCount={activeFilterCount}
            onToggleStatus={toggleStatus}
            onToggleSide={toggleSide}
            onToggleOrderType={toggleOrderType}
            onToggleAccount={toggleAccount}
            onToggleBucket={toggleBucket}
            onClearAll={clearAllFilters}
          />

          {/* Download */}
          <Button size="icon" variant="outline" className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Executions Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border bg-card">
        <ExecutionsTable
          executions={filteredExecutions}
          groupBy={groupBy}
          className="h-full"
        />
      </div>
    </div>
  );
}
