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
} from "@/lib/oms/ui";
import { formatDate } from "@/lib/pms/ui";
import type { Order } from "@/lib/api/oms";

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

  const accountName = order.accountName || order.accountId;
  const householdLabel = order.householdId || "Unknown";
  const cusipLabel = order.cusip || order.instrumentId;

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
            <p className="font-medium font-mono text-sm">{cusipLabel}</p>
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
          <p className="font-mono text-sm font-medium">{cusipLabel}</p>
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
          <p className="text-sm">{accountName}</p>
          <p className="text-xs text-muted-foreground">
            {householdLabel}
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
        <span className="text-muted-foreground">-</span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-sm pr-4">
        {formatDate(order.updatedAt)}
      </TableCell>
    </TableRow>
  );
}
