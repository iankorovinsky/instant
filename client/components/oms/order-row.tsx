"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getStateColor,
  getComplianceColor,
  formatOrderQuantity,
  formatPrice,
  orderFills,
} from "@/lib/oms/mock-data";
import { accounts, households, formatDate } from "@/lib/pms/mock-data";
import type { Order, OrderGroupBy } from "@/lib/oms/types";

interface OrderRowProps {
  order: Order;
  isSelected?: boolean;
  onSelectChange?: (orderId: string) => void;
  showState?: boolean;
  compact?: boolean;
}

export function OrderRow({
  order,
  isSelected = false,
  onSelectChange,
  showState = true,
  compact = false,
}: OrderRowProps) {
  const router = useRouter();

  const account = accounts.find((a) => a.accountId === order.accountId);
  const household = account
    ? households.find((h) => h.householdId === account.householdId)
    : null;
  const fills = orderFills.filter((f) => f.orderId === order.orderId);
  const lastFill = fills.length > 0 ? fills[fills.length - 1] : null;

  const handleRowClick = () => {
    router.push(`/app/oms/orders/${order.orderId}`);
  };

  if (compact) {
    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={handleRowClick}
      >
        <TableCell>
          <div>
            <p className="font-medium font-mono text-sm">{order.cusip}</p>
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
        <TableCell>
          <Badge className={getStateColor(order.state)}>
            {order.state.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatDate(order.updatedAt)}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      {onSelectChange && (
        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectChange(order.orderId)}
          />
        </TableCell>
      )}
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
      {showState && (
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
      <TableCell className="text-right text-muted-foreground text-sm pr-4">
        {formatDate(order.updatedAt)}
      </TableCell>
    </TableRow>
  );
}
