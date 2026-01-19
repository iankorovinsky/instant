"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { accounts } from "@/lib/pms/mock-data";
import type { Order, OrderState, ComplianceStatus, OrderType } from "@/lib/oms/types";

export interface OrderFilters {
  selectedStates: Set<OrderState>;
  selectedSides: Set<"BUY" | "SELL">;
  selectedOrderTypes: Set<OrderType>;
  selectedHouseholds: Set<string>;
  selectedCompliance: Set<ComplianceStatus>;
  searchQuery: string;
}

export interface UseOrderFiltersReturn {
  filters: OrderFilters;
  setSearchQuery: (query: string) => void;
  toggleState: (state: OrderState) => void;
  toggleSide: (side: "BUY" | "SELL") => void;
  toggleOrderType: (type: OrderType) => void;
  toggleHousehold: (householdId: string) => void;
  toggleCompliance: (status: ComplianceStatus) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  filterOrders: (orders: Order[]) => Order[];
}

const ORDER_STATES: OrderState[] = [
  "DRAFT", "STAGED", "APPROVAL_PENDING", "APPROVED", "SENT",
  "PARTIALLY_FILLED", "FILLED", "CANCELLED", "REJECTED", "SETTLED"
];

export function useOrderFilters(): UseOrderFiltersReturn {
  const searchParams = useSearchParams();

  // Get initial state filter from URL
  const getInitialStates = (): Set<OrderState> => {
    const stateParam = searchParams.get("state");
    if (!stateParam || stateParam === "all") return new Set<OrderState>();
    return new Set(
      stateParam.split(",").filter((s): s is OrderState =>
        ORDER_STATES.includes(s as OrderState)
      )
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStates, setSelectedStates] = useState<Set<OrderState>>(getInitialStates());
  const [selectedSides, setSelectedSides] = useState<Set<"BUY" | "SELL">>(new Set());
  const [selectedOrderTypes, setSelectedOrderTypes] = useState<Set<OrderType>>(new Set());
  const [selectedHouseholds, setSelectedHouseholds] = useState<Set<string>>(new Set());
  const [selectedCompliance, setSelectedCompliance] = useState<Set<ComplianceStatus>>(new Set());

  // Sync state filter with URL params
  useEffect(() => {
    const stateParam = searchParams.get("state");
    if (!stateParam || stateParam === "all") {
      setSelectedStates(new Set());
    } else {
      setSelectedStates(new Set(
        stateParam.split(",").filter((s): s is OrderState =>
          ORDER_STATES.includes(s as OrderState)
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

  const toggleState = (state: OrderState) => {
    toggleSetItem(selectedStates, state, setSelectedStates);
  };

  const toggleSide = (side: "BUY" | "SELL") => {
    toggleSetItem(selectedSides, side, setSelectedSides);
  };

  const toggleOrderType = (type: OrderType) => {
    toggleSetItem(selectedOrderTypes, type, setSelectedOrderTypes);
  };

  const toggleHousehold = (householdId: string) => {
    toggleSetItem(selectedHouseholds, householdId, setSelectedHouseholds);
  };

  const toggleCompliance = (status: ComplianceStatus) => {
    toggleSetItem(selectedCompliance, status, setSelectedCompliance);
  };

  const clearAllFilters = () => {
    setSelectedStates(new Set());
    setSelectedSides(new Set());
    setSelectedOrderTypes(new Set());
    setSelectedHouseholds(new Set());
    setSelectedCompliance(new Set());
  };

  const activeFilterCount = useMemo(() => {
    return selectedStates.size + selectedSides.size + selectedOrderTypes.size +
           selectedHouseholds.size + selectedCompliance.size;
  }, [selectedStates, selectedSides, selectedOrderTypes, selectedHouseholds, selectedCompliance]);

  const filterOrders = (orders: Order[]): Order[] => {
    return orders.filter((order) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        order.cusip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.instrumentDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase());

      // State filter
      const matchesState = selectedStates.size === 0 || selectedStates.has(order.state);

      // Side filter
      const matchesSide = selectedSides.size === 0 || selectedSides.has(order.side);

      // Order type filter
      const matchesOrderType = selectedOrderTypes.size === 0 || selectedOrderTypes.has(order.orderType);

      // Household filter
      const account = accounts.find((a) => a.accountId === order.accountId);
      const matchesHousehold = selectedHouseholds.size === 0 ||
        (account && selectedHouseholds.has(account.householdId));

      // Compliance filter
      const matchesCompliance = selectedCompliance.size === 0 ||
        (order.complianceResult && selectedCompliance.has(order.complianceResult.status));

      return matchesSearch && matchesState && matchesSide && matchesOrderType && matchesHousehold && matchesCompliance;
    });
  };

  return {
    filters: {
      selectedStates,
      selectedSides,
      selectedOrderTypes,
      selectedHouseholds,
      selectedCompliance,
      searchQuery,
    },
    setSearchQuery,
    toggleState,
    toggleSide,
    toggleOrderType,
    toggleHousehold,
    toggleCompliance,
    clearAllFilters,
    activeFilterCount,
    filterOrders,
  };
}
