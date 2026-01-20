"use client";

import { Clock, TrendingUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RebalancingRulesPage() {
  const rules: Array<{ ruleId: string; type: string; name: string; enabled: boolean; lastTriggeredAt?: string }> = [];
  const timeBasedRules = rules.filter((rule) => rule.type === "TIME_BASED");
  const driftBasedRules = rules.filter((rule) => rule.type === "DRIFT_BASED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rebalancing Rules</h1>
          <p className="text-muted-foreground mt-1">
            Configure automated portfolio rebalancing triggers
          </p>
        </div>
        <Button disabled>New Rule</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">0 active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time-Based</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Scheduled triggers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drift-Based</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Threshold triggers</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Time-Based Rules</h2>
          </div>
          {timeBasedRules.length > 0 ? (
            <div className="grid gap-4">
              {timeBasedRules.map((rule) => (
                <Card key={rule.ruleId}>
                  <CardHeader>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>{rule.enabled ? "Active" : "Disabled"}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No time-based rules configured.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Drift-Based Rules</h2>
          </div>
          {driftBasedRules.length > 0 ? (
            <div className="grid gap-4">
              {driftBasedRules.map((rule) => (
                <Card key={rule.ruleId}>
                  <CardHeader>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>{rule.enabled ? "Active" : "Disabled"}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No drift-based rules configured.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Rule Triggers</CardTitle>
          <CardDescription>History of rebalancing rule executions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Triggered At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No rules have been triggered yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
