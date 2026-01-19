"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { OrderRow } from "./order-row";
import { getStateColor } from "@/lib/oms/mock-data";
import { accounts, households } from "@/lib/pms/mock-data";
import type { Order, OrderState, OrderGroupBy } from "@/lib/oms/types";

interface OrdersTableProps {
  orders: Order[];
  groupBy?: OrderGroupBy;
  selectedOrders?: Set<string>;
  onSelectOrder?: (orderId: string) => void;
  onSelectAll?: (orderIds: string[], selected: boolean) => void;
  className?: string;
  emptyMessage?: string;
}

export function OrdersTable({
  orders,
  groupBy = "none",
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  className,
  emptyMessage = "No orders found.",
}: OrdersTableProps) {
  // Group orders if needed
  const groupedOrders = useMemo(() => {
    if (groupBy === "none") {
      return { ungrouped: orders };
    }

    const groups: Record<string, Order[]> = {};

    orders.forEach((order) => {
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
  }, [orders, groupBy]);

  const showCheckboxes = !!selectedOrders && !!onSelectOrder;

  return (
    <div className={className}>
      <ScrollableTable className="h-full">
        {Object.entries(groupedOrders).map(([group, groupOrders]) => (
          <div key={group} className="pt-4">
            {groupBy !== "none" && (
              <h3 className="font-medium text-base mb-2 px-4 flex items-center gap-2">
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
                  {showCheckboxes && (
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={
                          groupOrders.length > 0 &&
                          groupOrders.every((o) => selectedOrders?.has(o.orderId))
                        }
                        onCheckedChange={(checked) => {
                          if (onSelectAll) {
                            onSelectAll(
                              groupOrders.map((o) => o.orderId),
                              !!checked
                            );
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>CUSIP</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price/Limit</TableHead>
                  {groupBy !== "state" && <TableHead>State</TableHead>}
                  <TableHead>Account</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead className="text-right">Last Fill</TableHead>
                  <TableHead className="text-right pr-4">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    isSelected={selectedOrders?.has(order.orderId)}
                    onSelectChange={onSelectOrder}
                    showState={groupBy !== "state"}
                  />
                ))}
                {groupOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={showCheckboxes ? 11 : 10}
                      className="h-24 text-center"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ))}
      </ScrollableTable>
    </div>
  );
}
