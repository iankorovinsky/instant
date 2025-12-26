"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  Filter,
  FileText,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  orders,
  orderFills,
  getStateColor,
  getComplianceColor,
  formatOrderQuantity,
  formatPrice,
} from "@/lib/oms/mock-data";
import { accounts, households, formatDate } from "@/lib/pms/mock-data";
import type { OrderState, ComplianceStatus, OrderType, OrderGroupBy } from "@/lib/oms/types";

export default function OrderBlotterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters from URL params
  const initialState = searchParams.get("state") as OrderState | "all" | null;

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<OrderState | "all">(initialState || "all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [householdFilter, setHouseholdFilter] = useState<string>("all");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceStatus | "all">("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType | "all">("all");
  const [groupBy, setGroupBy] = useState<OrderGroupBy>("none");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.cusip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.instrumentDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesState = stateFilter === "all" || order.state === stateFilter;

      const matchesAccount = accountFilter === "all" || order.accountId === accountFilter;

      const account = accounts.find((a) => a.accountId === order.accountId);
      const matchesHousehold =
        householdFilter === "all" || account?.householdId === householdFilter;

      const matchesCompliance =
        complianceFilter === "all" ||
        order.complianceResult?.status === complianceFilter;

      const matchesOrderType = orderTypeFilter === "all" || order.orderType === orderTypeFilter;

      return (
        matchesSearch &&
        matchesState &&
        matchesAccount &&
        matchesHousehold &&
        matchesCompliance &&
        matchesOrderType
      );
    });
  }, [searchQuery, stateFilter, accountFilter, householdFilter, complianceFilter, orderTypeFilter]);

  // Group orders if needed
  const groupedOrders = useMemo(() => {
    if (groupBy === "none") {
      return { ungrouped: filteredOrders };
    }

    const groups: Record<string, typeof filteredOrders> = {};

    filteredOrders.forEach((order) => {
      let key = "";
      if (groupBy === "household") {
        const account = accounts.find((a) => a.accountId === order.accountId);
        const household = account
          ? households.find((h) => h.householdId === account.householdId)
          : null;
        key = household?.name || "Unknown";
      } else if (groupBy === "account") {
        const account = accounts.find((a) => a.accountId === order.accountId);
        key = account?.name || "Unknown";
      } else if (groupBy === "state") {
        key = order.state;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });

    return groups;
  }, [filteredOrders, groupBy]);

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o) => o.orderId)));
    }
  };

  const canApprove = Array.from(selectedOrders).every((id) => {
    const order = orders.find((o) => o.orderId === id);
    return order?.state === "APPROVAL_PENDING" && order.complianceResult?.status !== "BLOCK";
  });

  const canCancel = Array.from(selectedOrders).every((id) => {
    const order = orders.find((o) => o.orderId === id);
    return !["FILLED", "SETTLED", "CANCELLED", "REJECTED"].includes(order?.state || "");
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Blotter</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/oms/upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/oms/create">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <div className="flex gap-2">
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as OrderGroupBy)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Group by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="household">Group by Household</SelectItem>
                  <SelectItem value="account">Group by Account</SelectItem>
                  <SelectItem value="state">Group by State</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by CUSIP, description, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={stateFilter}
              onValueChange={(v) => setStateFilter(v as OrderState | "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="APPROVAL_PENDING">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PARTIALLY_FILLED">Partially Filled</SelectItem>
                <SelectItem value="FILLED">Filled</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={householdFilter} onValueChange={setHouseholdFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Household" />
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
            <Select value={complianceFilter} onValueChange={(v) => setComplianceFilter(v as ComplianceStatus | "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Compliance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PASS">Pass</SelectItem>
                <SelectItem value="WARN">Warn</SelectItem>
                <SelectItem value="BLOCK">Block</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderTypeFilter} onValueChange={(v) => setOrderTypeFilter(v as OrderType | "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MARKET">Market</SelectItem>
                <SelectItem value="LIMIT">Limit</SelectItem>
                <SelectItem value="CURVE_RELATIVE">Curve Relative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">{selectedOrders.size}</span> order
                {selectedOrders.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders(new Set())}
                >
                  Clear Selection
                </Button>
                {canApprove && (
                  <Button size="sm" variant="outline" className="text-green-600">
                    <Check className="mr-2 h-4 w-4" />
                    Approve Selected
                  </Button>
                )}
                {canCancel && (
                  <Button size="sm" variant="outline" className="text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Cancel Selected
                  </Button>
                )}
                <Button size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send to EMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedOrders).map(([group, groupOrders]) => (
            <div key={group} className="mb-6 last:mb-0">
              {groupBy !== "none" && (
                <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                  {groupBy === "state" && (
                    <Badge className={getStateColor(group as OrderState)}>
                      {group.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {groupBy !== "state" && group}
                  <span className="text-sm text-muted-foreground font-normal">
                    ({groupOrders.length})
                  </span>
                </h3>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          groupOrders.length > 0 &&
                          groupOrders.every((o) => selectedOrders.has(o.orderId))
                        }
                        onCheckedChange={() => {
                          const allSelected = groupOrders.every((o) =>
                            selectedOrders.has(o.orderId)
                          );
                          const newSelected = new Set(selectedOrders);
                          groupOrders.forEach((o) => {
                            if (allSelected) {
                              newSelected.delete(o.orderId);
                            } else {
                              newSelected.add(o.orderId);
                            }
                          });
                          setSelectedOrders(newSelected);
                        }}
                      />
                    </TableHead>
                    <TableHead>CUSIP</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price/Limit</TableHead>
                    {groupBy !== "state" && <TableHead>State</TableHead>}
                    <TableHead>Account</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead className="text-right">Last Fill</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupOrders.map((order) => {
                    const account = accounts.find((a) => a.accountId === order.accountId);
                    const household = account
                      ? households.find((h) => h.householdId === account.householdId)
                      : null;
                    const fills = orderFills.filter((f) => f.orderId === order.orderId);
                    const lastFill = fills.length > 0 ? fills[fills.length - 1] : null;

                    return (
                      <TableRow
                        key={order.orderId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/app/oms/orders/${order.orderId}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrders.has(order.orderId)}
                            onCheckedChange={() => toggleSelectOrder(order.orderId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm font-medium">{order.cusip}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-32">
                              {order.instrumentDescription}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={order.side === "BUY" ? "text-green-600" : "text-red-600"}
                          >
                            {order.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatOrderQuantity(order.quantity)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{order.orderType}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.orderType === "LIMIT" && order.limitPrice
                            ? formatPrice(order.limitPrice)
                            : order.orderType === "CURVE_RELATIVE" && order.curveSpreadBp
                            ? `+${order.curveSpreadBp}bp`
                            : "-"}
                        </TableCell>
                        {groupBy !== "state" && (
                          <TableCell>
                            <Badge className={getStateColor(order.state)}>
                              {order.state.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <div>
                            <p className="text-sm">{account?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {household?.name || "Unknown"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.complianceResult ? (
                            <Badge className={getComplianceColor(order.complianceResult.status)}>
                              {order.complianceResult.status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {lastFill ? (
                            <div className="text-sm">
                              <p>{formatOrderQuantity(lastFill.quantity)}</p>
                              <p className="text-muted-foreground">
                                @ {formatPrice(lastFill.price)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {formatDate(order.updatedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {groupOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
