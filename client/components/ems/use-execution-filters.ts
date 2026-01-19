"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Execution, ExecutionState } from "@/lib/ems/types";

export interface ExecutionFilters {
  selectedStatuses: Set<ExecutionState>;
  selectedSides: Set<"BUY" | "SELL">;
  selectedOrderTypes: Set<"MARKET" | "LIMIT" | "CURVE_RELATIVE">;
  selectedAccounts: Set<string>;
  selectedBuckets: Set<string>;
  searchQuery: string;
}

export interface UseExecutionFiltersReturn {
  filters: ExecutionFilters;
  setSearchQuery: (query: string) => void;
  toggleStatus: (status: ExecutionState) => void;
  toggleSide: (side: "BUY" | "SELL") => void;
  toggleOrderType: (type: "MARKET" | "LIMIT" | "CURVE_RELATIVE") => void;
  toggleAccount: (account: string) => void;
  toggleBucket: (bucket: string) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  filterExecutions: (executions: Execution[]) => Execution[];
}

const EXECUTION_STATES: ExecutionState[] = [
  "PENDING", "SIMULATING", "PARTIALLY_FILLED", "FILLED", "SETTLED", "CANCELLED"
];

export function useExecutionFilters(): UseExecutionFiltersReturn {
  const searchParams = useSearchParams();

  // Get initial status filter from URL
  const getInitialStatuses = (): Set<ExecutionState> => {
    const statusParam = searchParams.get("status");
    if (!statusParam || statusParam === "all") return new Set<ExecutionState>();
    return new Set(
      statusParam.split(",").filter((s): s is ExecutionState =>
        EXECUTION_STATES.includes(s as ExecutionState)
      )
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ExecutionState>>(getInitialStatuses());
  const [selectedSides, setSelectedSides] = useState<Set<"BUY" | "SELL">>(new Set());
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<Set<"MARKET" | "LIMIT" | "CURVE_RELATIVE">>(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set());

  // Sync status filter with URL params
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (!statusParam || statusParam === "all") {
      setSelectedStatuses(new Set());
    } else {
      setSelectedStatuses(new Set(
        statusParam.split(",").filter((s): s is ExecutionState =>
          EXECUTION_STATES.includes(s as ExecutionState)
        )
      ));
    }
  }, [searchParams]);

  const toggleSetItem = <T,>(set: Set<T>, item: T, setter: (s: Set<T>) => void) => {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setter(newSet);
  };

  const toggleStatus = (status: ExecutionState) => {
    toggleSetItem(selectedStatuses, status, setSelectedStatuses);
  };

  const toggleSide = (side: "BUY" | "SELL") => {
    toggleSetItem(selectedSides, side, setSelectedSides);
  };

  const toggleOrderType = (type: "MARKET" | "LIMIT" | "CURVE_RELATIVE") => {
    toggleSetItem(selectedOrderTypes, type, setSelectedOrderTypes);
  };

  const toggleAccount = (account: string) => {
    toggleSetItem(selectedAccounts, account, setSelectedAccounts);
  };

  const toggleBucket = (bucket: string) => {
    toggleSetItem(selectedBuckets, bucket, setSelectedBuckets);
  };

  const clearAllFilters = () => {
    setSelectedStatuses(new Set());
    setSelectedSides(new Set());
    setSelectedOrderTypes(new Set());
    setSelectedAccounts(new Set());
    setSelectedBuckets(new Set());
  };

  const activeFilterCount = useMemo(() => {
    return selectedStatuses.size + selectedSides.size + selectedOrderTypes.size +
           selectedAccounts.size + selectedBuckets.size;
  }, [selectedStatuses, selectedSides, selectedOrderTypes, selectedAccounts, selectedBuckets]);

  const filterExecutions = (executions: Execution[]): Execution[] => {
    return executions.filter((execution) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        execution.executionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.cusip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        execution.accountName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(execution.status);

      // Side filter
      const matchesSide = selectedSides.size === 0 || selectedSides.has(execution.side);

      // Order type filter
      const matchesOrderType = selectedOrderTypes.size === 0 || selectedOrderTypes.has(execution.orderType);

      // Account filter
      const matchesAccount = selectedAccounts.size === 0 ||
        (execution.accountName && selectedAccounts.has(execution.accountName));

      // Bucket filter
      const matchesBucket = selectedBuckets.size === 0 ||
        selectedBuckets.has(execution.deterministicInputs.bucket);

      return matchesSearch && matchesStatus && matchesSide && matchesOrderType && matchesAccount && matchesBucket;
    });
  };

  return {
    filters: {
      selectedStatuses,
      selectedSides,
      selectedOrderTypes,
      selectedAccounts,
      selectedBuckets,
      searchQuery,
    },
    setSearchQuery,
    toggleStatus,
    toggleSide,
    toggleOrderType,
    toggleAccount,
    toggleBucket,
    clearAllFilters,
    activeFilterCount,
    filterExecutions,
  };
}
