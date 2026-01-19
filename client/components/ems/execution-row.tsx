"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ExternalLink,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getStateColor,
  formatQuantity,
  formatDate,
  formatPrice,
  formatBasisPoints,
} from "@/lib/ems/mock-data";
import type { Execution } from "@/lib/ems/types";

interface ExecutionRowProps {
  execution: Execution;
  compact?: boolean;
}

export function ExecutionRow({ execution, compact = false }: ExecutionRowProps) {
  const router = useRouter();

  const progress = execution.totalQuantity > 0
    ? Math.round((execution.filledQuantity / execution.totalQuantity) * 100)
    : 0;

  const handleRowClick = () => {
    router.push(`/app/ems/executions/${execution.executionId}`);
  };

  if (compact) {
    return (
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={handleRowClick}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="font-mono text-xs">
                {execution.executionId.slice(0, 12)}
              </span>
              <p className="text-xs text-muted-foreground">
                {execution.side}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-mono text-sm">{execution.cusip}</span>
        </TableCell>
        <TableCell>
          <div className="w-20">
            <div className="text-xs text-muted-foreground mb-1">
              {progress}%
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={getStateColor(execution.status)}>
            {execution.status.replace(/_/g, " ")}
          </Badge>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">
            {execution.executionId}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Link
          href={`/app/oms/orders/${execution.orderId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-primary hover:underline font-mono text-sm"
        >
          {execution.orderId.slice(0, 12)}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </TableCell>
      <TableCell>
        <div>
          <span className="font-mono text-sm">{execution.cusip}</span>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {execution.description}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {execution.side === "BUY" ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
          <Badge
            variant="outline"
            className={execution.side === "BUY" ? "text-green-600" : "text-red-600"}
          >
            {execution.side}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div>
          <div className="font-medium">
            {formatQuantity(execution.filledQuantity)}
          </div>
          {execution.filledQuantity < execution.totalQuantity && (
            <div className="text-xs text-muted-foreground">
              of {formatQuantity(execution.totalQuantity)} ({progress}%)
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">
        {execution.avgFillPrice !== null
          ? formatPrice(execution.avgFillPrice)
          : "-"}
      </TableCell>
      <TableCell className="text-right">
        {execution.slippageBreakdown ? (
          <span
            className={
              execution.slippageBreakdown.total > 10
                ? "text-amber-600 font-medium"
                : "text-green-600"
            }
          >
            {formatBasisPoints(execution.slippageBreakdown.total)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Badge className={getStateColor(execution.status)}>
          {execution.status.replace(/_/g, " ")}
        </Badge>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatDate(execution.asOfDate)}
      </TableCell>
    </TableRow>
  );
}
