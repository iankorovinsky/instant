"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  Check,
  X,
  Send,
  Download,
} from "lucide-react";
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
  OrdersTable,
  OrderFilters,
  useOrderFilters,
} from "@/components/oms";
import { useBlotter, useApproveOrder, useCancelOrder, useSendToEMS } from "@/lib/hooks/use-oms";
import type { OrderGroupBy } from "@/lib/oms/types";

export default function OrderBlotterPage() {
  const [groupBy, setGroupBy] = useState<OrderGroupBy>("none");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const {
    filters,
    setSearchQuery,
    toggleState,
    toggleSide,
    toggleOrderType,
    toggleHousehold,
    toggleCompliance,
    clearAllFilters,
    activeFilterCount,
    filterOrders,
  } = useOrderFilters();

  // Fetch orders from API
  const { data: blotterData, isLoading, error } = useBlotter();
  const orders = blotterData?.orders || [];

  // Mutations
  const approveMutation = useApproveOrder();
  const cancelMutation = useCancelOrder();
  const sendToEMSMutation = useSendToEMS();

  // Apply filters
  const filteredOrders = useMemo(() => {
    return filterOrders(orders);
  }, [filterOrders, orders]);

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (orderIds: string[], selected: boolean) => {
    const newSelected = new Set(selectedOrders);
    orderIds.forEach((id) => {
      if (selected) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
    });
    setSelectedOrders(newSelected);
  };

  const canApprove = Array.from(selectedOrders).every((id) => {
    const order = orders.find((o) => o.orderId === id);
    return order?.state === "APPROVAL_PENDING" && order.complianceResult?.status !== "BLOCK";
  });

  const canCancel = Array.from(selectedOrders).every((id) => {
    const order = orders.find((o) => o.orderId === id);
    return !["FILLED", "SETTLED", "CANCELLED", "REJECTED"].includes(order?.state || "");
  });

  const handleBulkApprove = async () => {
    for (const orderId of Array.from(selectedOrders)) {
      await approveMutation.mutateAsync({ orderId, approvedBy: "current-user" });
    }
    setSelectedOrders(new Set());
  };

  const handleBulkCancel = async () => {
    for (const orderId of Array.from(selectedOrders)) {
      await cancelMutation.mutateAsync({ orderId, cancelledBy: "current-user" });
    }
    setSelectedOrders(new Set());
  };

  const handleBulkSendToEMS = async () => {
    for (const orderId of Array.from(selectedOrders)) {
      await sendToEMSMutation.mutateAsync({ orderId, sentBy: "current-user" });
    }
    setSelectedOrders(new Set());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Grouping */}
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as OrderGroupBy)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="household">By Household</SelectItem>
              <SelectItem value="account">By Account</SelectItem>
              <SelectItem value="state">By State</SelectItem>
            </SelectContent>
          </Select>

          {/* New Order */}
          <Button size="icon" variant="outline" className="h-9 w-9" asChild>
            <Link href="/app/oms/create">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>

          {/* Filters */}
          <OrderFilters
            filters={filters}
            activeFilterCount={activeFilterCount}
            onToggleState={toggleState}
            onToggleSide={toggleSide}
            onToggleOrderType={toggleOrderType}
            onToggleHousehold={toggleHousehold}
            onToggleCompliance={toggleCompliance}
            onClearAll={clearAllFilters}
          />

          {/* Upload */}
          <Button size="icon" variant="outline" className="h-9 w-9" asChild>
            <Link href="/app/oms/upload">
              <Upload className="h-4 w-4" />
            </Link>
          </Button>

          {/* Download */}
          <Button size="icon" variant="outline" className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center justify-between py-2 px-3 mb-2 rounded-lg bg-primary/5 border border-primary/20 shrink-0">
          <p className="text-sm">
            <span className="font-medium">{selectedOrders.size}</span> order
            {selectedOrders.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrders(new Set())}
            >
              Clear
            </Button>
            {canApprove && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-600"
                onClick={handleBulkApprove}
                disabled={approveMutation.isPending}
              >
                <Check className="mr-1 h-3 w-3" />
                Approve
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={handleBulkCancel}
                disabled={cancelMutation.isPending}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleBulkSendToEMS}
              disabled={sendToEMSMutation.isPending}
            >
              <Send className="mr-1 h-3 w-3" />
              Send to EMS
            </Button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-600">Error loading orders: {error.message}</p>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            groupBy={groupBy}
            selectedOrders={selectedOrders}
            onSelectOrder={toggleSelectOrder}
            onSelectAll={handleSelectAll}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
