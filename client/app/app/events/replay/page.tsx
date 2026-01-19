"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Calendar,
  Clock,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BarChart3,
  PieChart,
  Shield,
  Zap,
  TrendingUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getFilteredEvents,
  formatDate,
  formatDateTime,
} from "@/lib/events/mock-data";
import type { ReplayScope, ReplayStatus } from "@/lib/events/types";

const projectionScopes: { value: ReplayScope; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All Projections", description: "Rebuild all system projections", icon: <RefreshCw className="h-4 w-4" /> },
  { value: "marketGrid", label: "Market Grid View", description: "Evaluated pricing and risk metrics", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "blotter", label: "Blotter View", description: "Order management blotter", icon: <FileText className="h-4 w-4" /> },
  { value: "executionTape", label: "Execution Tape", description: "Execution history and fills", icon: <Zap className="h-4 w-4" /> },
  { value: "accountPositions", label: "Account Positions", description: "Portfolio positions and holdings", icon: <PieChart className="h-4 w-4" /> },
  { value: "complianceStatus", label: "Compliance Status", description: "Rule violations and checks", icon: <Shield className="h-4 w-4" /> },
  { value: "proposals", label: "Proposals View", description: "Rebalancing proposals", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "timeline", label: "Event Timeline", description: "Event timeline state", icon: <Clock className="h-4 w-4" /> },
];

// Generate available dates for the last 7 days
const availableDates: Date[] = [];
for (let i = 0; i < 7; i++) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  date.setHours(0, 0, 0, 0);
  availableDates.push(date);
}

export default function EventReplayPage() {
  const router = useRouter();

  // Time selection
  const [marketDate, setMarketDate] = useState<Date>(availableDates[0]);
  const [systemTimeCutoff, setSystemTimeCutoff] = useState<Date>(new Date());

  // Replay configuration
  const [selectedScope, setSelectedScope] = useState<ReplayScope>("accountPositions");
  const [aggregateId, setAggregateId] = useState("");

  // Replay state
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>("idle");
  const [replayProgress, setReplayProgress] = useState(0);
  const [replayResult, setReplayResult] = useState<{
    eventCount: number;
    startTime: Date;
    endTime?: Date;
    error?: string;
  } | null>(null);

  // Get events that would be replayed
  const eventsToReplay = useMemo(() => {
    return getFilteredEvents({
      dateTo: systemTimeCutoff,
    });
  }, [systemTimeCutoff]);

  const startReplay = async () => {
    setReplayStatus("in_progress");
    setReplayProgress(0);
    setReplayResult(null);

    const startTime = new Date();

    // Simulate replay progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setReplayProgress(i);
    }

    // Simulate completion
    setReplayStatus("completed");
    setReplayResult({
      eventCount: eventsToReplay.length,
      startTime,
      endTime: new Date(),
    });
  };

  const resetReplay = () => {
    setReplayStatus("idle");
    setReplayProgress(0);
    setReplayResult(null);
  };

  const getStatusIcon = () => {
    switch (replayStatus) {
      case "in_progress":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <History className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (replayStatus) {
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Replay</h1>
          <p className="text-muted-foreground mt-1">
            Time-travel replay for rebuilding projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Concept Explanation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Time Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-1">Market Time (asOfDate)</h4>
              <p className="text-blue-700">
                Affects pricing inputs and what the system "knew" at that point.
                Changes which yield curve and prices are used.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">System Time (Replay Cutoff)</h4>
              <p className="text-blue-700">
                Events after this timestamp are excluded from replay.
                Shows what projections looked like before certain events.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Time Selection
            </CardTitle>
            <CardDescription>
              Select market date and system time cutoff
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Market Date (asOfDate)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Which date's market data to use for pricing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={marketDate.toISOString()}
                onValueChange={(v) => setMarketDate(new Date(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date.toISOString()} value={date.toISOString()}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                System Time Cutoff
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only replay events up to this timestamp</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                type="datetime-local"
                value={systemTimeCutoff.toISOString().slice(0, 16)}
                onChange={(e) => setSystemTimeCutoff(new Date(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Events after this time will be excluded
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Events to replay:</span>
                <span className="font-bold">{eventsToReplay.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replay Scope */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Replay Scope
            </CardTitle>
            <CardDescription>
              Select which projection to rebuild
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Projection</Label>
              <Select
                value={selectedScope}
                onValueChange={(v) => setSelectedScope(v as ReplayScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectionScopes.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      <div className="flex items-center gap-2">
                        {scope.icon}
                        {scope.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {projectionScopes.find((s) => s.value === selectedScope)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Aggregate ID (Optional)</Label>
              <Input
                placeholder="e.g., account ID, order ID..."
                value={aggregateId}
                onChange={(e) => setAggregateId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to rebuild for all aggregates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Replay Execution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Replay Execution
          </CardTitle>
          <CardDescription>
            Rebuild projections with selected time parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Market Date</div>
              <div className="font-medium">{formatDate(marketDate)}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">System Cutoff</div>
              <div className="font-medium">{formatDateTime(systemTimeCutoff)}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Projection</div>
              <div className="font-medium">
                {projectionScopes.find((s) => s.value === selectedScope)?.label}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Events</div>
              <div className="font-medium">{eventsToReplay.length}</div>
            </div>
          </div>

          {/* Progress */}
          {replayStatus === "in_progress" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Rebuilding projection...</span>
                <span>{replayProgress}%</span>
              </div>
              <Progress value={replayProgress} />
            </div>
          )}

          {/* Result */}
          {replayResult && replayStatus === "completed" && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Replay Completed</span>
              </div>
              <div className="grid gap-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Events replayed:</span>
                  <span className="font-medium">{replayResult.eventCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start time:</span>
                  <span>{formatDateTime(replayResult.startTime)}</span>
                </div>
                {replayResult.endTime && (
                  <div className="flex justify-between">
                    <span>End time:</span>
                    <span>{formatDateTime(replayResult.endTime)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>
                    {replayResult.endTime
                      ? `${((replayResult.endTime.getTime() - replayResult.startTime.getTime()) / 1000).toFixed(1)}s`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              onClick={startReplay}
              disabled={replayStatus === "in_progress"}
              className="gap-2"
            >
              {replayStatus === "in_progress" ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Rebuilding...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Replay
                </>
              )}
            </Button>

            {replayStatus !== "idle" && (
              <Button variant="outline" onClick={resetReplay}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Common Use Cases</CardTitle>
          <CardDescription>When to use event replay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Debugging
              </h4>
              <p className="text-sm text-muted-foreground">
                "What did the system know at this point in time?" Replay to a specific
                moment to understand the system state.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Audit
              </h4>
              <p className="text-sm text-muted-foreground">
                "What was the order state when it was approved?" Verify compliance
                decisions and approval workflows.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Time-travel Analysis
              </h4>
              <p className="text-sm text-muted-foreground">
                "What would the portfolio look like if we used yesterday's prices?"
                Test different market scenarios.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                Testing
              </h4>
              <p className="text-sm text-muted-foreground">
                Verify projection logic by replaying specific scenarios and comparing
                results with expected outcomes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
