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
import { getStateColor } from "@/lib/oms/ui";
import { formatDate } from "@/lib/pms/ui";
import type { Order } from "@/lib/api/oms";

interface RecentOrdersTableProps {
  orders: Order[];
  maxItems?: number;
  emptyMessage?: string;
}

export function RecentOrdersTable({
  orders,
  maxItems,
  emptyMessage = "No recent orders.",
}: RecentOrdersTableProps) {
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
            <TableHead>CUSIP</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayOrders.map((order) => (
            <TableRow
              key={order.orderId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/app/oms/orders/${order.orderId}`)}
            >
              <TableCell className="font-mono text-sm">
                {order.cusip || order.instrumentId}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={order.side === "BUY" ? "text-green-600" : "text-red-600"}
                >
                  {order.side}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStateColor(order.state)}>
                  {order.state.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(order.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
