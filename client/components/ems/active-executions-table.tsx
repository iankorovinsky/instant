"use client";

import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
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
import { getStateColor } from "@/lib/ems/mock-data";
import type { Execution } from "@/lib/ems/types";

interface ActiveExecutionsTableProps {
  executions: Execution[];
  maxItems?: number;
  emptyMessage?: string;
}

export function ActiveExecutionsTable({
  executions,
  maxItems = 5,
  emptyMessage = "No active executions",
}: ActiveExecutionsTableProps) {
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
            <TableHead>Execution</TableHead>
            <TableHead>Instrument</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayExecutions.map((execution) => {
            const progress = execution.totalQuantity > 0
              ? Math.round((execution.filledQuantity / execution.totalQuantity) * 100)
              : 0;

            return (
              <TableRow
                key={execution.executionId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/app/ems/executions/${execution.executionId}`)}
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
          })}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
