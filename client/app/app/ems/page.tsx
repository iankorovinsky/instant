"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActiveExecutionsTable,
  CompletedExecutionsTable,
} from "@/components/ems";
import { formatCurrency } from "@/lib/ems/ui";
import { fetchExecutions, summarizeExecutions } from "@/lib/ems/api";
import type { Execution } from "@/lib/ems/types";

export default function EMSDashboardPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState<Execution[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchExecutions()
      .then((data) => {
        if (isMounted) setExecutions(data);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => summarizeExecutions(executions), [executions]);

  // Get active executions (pending, simulating, partially filled)
  const activeExecutions = executions.filter(
    (e) => e.status === "PENDING" || e.status === "SIMULATING" || e.status === "PARTIALLY_FILLED"
  );

  // Get recent completed executions
  const recentCompleted = executions.filter(
    (e) => e.status === "FILLED" || e.status === "SETTLED"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execution Management</h1>
        </div>
        <Button asChild>
          <Link href="/app/ems/executions">
            <Activity className="h-4 w-4" />
            View Execution Tape
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalFilledQuantity)}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=PENDING")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.pending + summary.simulating}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=PARTIALLY_FILLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summary.partiallyFilled}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=FILLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.filled}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/ems/executions?status=SETTLED")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {summary.settled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 md:grid-cols-2" style={{ height: "400px" }}>
        {/* Active Executions */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Active Executions</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/ems/executions?status=PENDING,SIMULATING,PARTIALLY_FILLED">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden">
            <ActiveExecutionsTable executions={activeExecutions} />
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Completed</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/ems/executions?status=FILLED,SETTLED">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden">
            <CompletedExecutionsTable executions={recentCompleted} />
          </CardContent>
        </Card>
      </div>

      {/* Slippage Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Slippage by Bucket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Slippage breakdowns are available once execution analytics are ingested.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
