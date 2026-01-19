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
import { ScrollableTable } from "@/components/ui/scrollable-table";
import { ExecutionRow } from "./execution-row";
import { formatDate } from "@/lib/ems/mock-data";
import type { Execution, ExecutionGroupBy } from "@/lib/ems/types";

interface ExecutionsTableProps {
  executions: Execution[];
  groupBy?: ExecutionGroupBy;
  compact?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function ExecutionsTable({
  executions,
  groupBy = "none",
  compact = false,
  className,
  emptyMessage = "No executions found.",
}: ExecutionsTableProps) {
  // Group executions if needed
  const groupedExecutions = useMemo(() => {
    if (groupBy === "none") {
      return { "": executions };
    }

    const groups: Record<string, Execution[]> = {};

    executions.forEach((execution) => {
      let key = "";
      switch (groupBy) {
        case "order":
          key = execution.orderId;
          break;
        case "instrument":
          key = execution.cusip;
          break;
        case "date":
          key = formatDate(execution.asOfDate);
          break;
        case "account":
          key = execution.accountName || "Unknown";
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(execution);
    });

    return groups;
  }, [executions, groupBy]);

  if (compact) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Execution</TableHead>
            <TableHead>Instrument</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((execution) => (
            <ExecutionRow
              key={execution.executionId}
              execution={execution}
              compact
            />
          ))}
          {executions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className={className}>
      <ScrollableTable className="h-full">
        {Object.entries(groupedExecutions).map(([groupKey, groupExecutions]) => (
          <div key={groupKey || "all"} className="pt-4">
            {groupBy !== "none" && groupKey && (
              <h3 className="font-medium text-base mb-2 px-4 flex items-center gap-2">
                {groupKey}
                <span className="text-sm text-muted-foreground font-normal">
                  ({groupExecutions.length})
                </span>
              </h3>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Slippage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">As-of Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupExecutions.map((execution) => (
                  <ExecutionRow
                    key={execution.executionId}
                    execution={execution}
                  />
                ))}
                {groupExecutions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
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
