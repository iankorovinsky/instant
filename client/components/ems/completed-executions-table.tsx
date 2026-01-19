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
  getStateColor,
  formatQuantity,
  formatBasisPoints,
} from "@/lib/ems/mock-data";
import type { Execution } from "@/lib/ems/types";

interface CompletedExecutionsTableProps {
  executions: Execution[];
  maxItems?: number;
  emptyMessage?: string;
}

export function CompletedExecutionsTable({
  executions,
  maxItems = 5,
  emptyMessage = "No completed executions",
}: CompletedExecutionsTableProps) {
  const router = useRouter();
  const displayExecutions = executions.slice(0, maxItems);

  if (displayExecutions.length === 0) {
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
            <TableHead>Instrument</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Slippage</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayExecutions.map((execution) => (
            <TableRow
              key={execution.executionId}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/app/ems/executions/${execution.executionId}`)}
            >
              <TableCell>
                <div>
                  <span className="font-mono text-sm">{execution.cusip}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {execution.description.split(" ").slice(0, 3).join(" ")}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {formatQuantity(execution.filledQuantity)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    (execution.slippageBreakdown?.total || 0) > 10
                      ? "text-amber-600"
                      : "text-green-600"
                  }
                >
                  {formatBasisPoints(execution.slippageBreakdown?.total || 0)}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getStateColor(execution.status)}>
                  {execution.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
