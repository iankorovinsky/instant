"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollableTable } from "@/components/ui/scrollable-table";
import {
  getComplianceColor,
  formatOrderQuantity,
} from "@/lib/oms/ui";
import type { Order } from "@/lib/api/oms";

interface PendingOrdersTableProps {
  orders: Order[];
  maxItems?: number;
  emptyMessage?: string;
}

export function PendingOrdersTable({
  orders,
  maxItems,
  emptyMessage = "No orders pending approval.",
}: PendingOrdersTableProps) {
  const router = useRouter();
  const displayOrders = maxItems ? orders.slice(0, maxItems) : orders;

  if (displayOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ScrollableTable className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Compliance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayOrders.map((order) => (
            <TableRow
              key={order.orderId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/app/oms/orders/${order.orderId}`)}
            >
              <TableCell>
                <div>
                  <p className="font-medium font-mono text-sm">
                    {order.cusip || order.instrumentId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-32">
                    {order.instrumentName || order.instrumentId}
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
              <TableCell>{formatOrderQuantity(order.quantity)}</TableCell>
              <TableCell>
                {order.complianceResult && (
                  <Badge className={getComplianceColor(order.complianceResult.status)}>
                    {order.complianceResult.status}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
