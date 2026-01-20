"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  History,
  GitBranch,
  ArrowRight,
  FileText,
  Shield,
  Zap,
  PieChart,
  TrendingUp,
  Bot,
  DollarSign,
  MessageSquare,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  buildEventStatistics,
  formatRelativeTime,
  getAggregateColor,
  getModuleColor,
  getModuleLabel,
} from "@/lib/events/ui";
import { fetchEventTimeline } from "@/lib/events/api";
import type { EventTimelineItem } from "@/lib/events/types";
import type { EventModule } from "@/lib/events/types";

const moduleIcons: Record<EventModule, React.ReactNode> = {
  marketdata: <TrendingUp className="h-4 w-4" />,
  pricing: <DollarSign className="h-4 w-4" />,
  oms: <FileText className="h-4 w-4" />,
  ems: <Zap className="h-4 w-4" />,
  pms: <PieChart className="h-4 w-4" />,
  compliance: <Shield className="h-4 w-4" />,
  copilot: <Bot className="h-4 w-4" />,
};

export default function EventStudioDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEventTimeline();
        if (!active) return;
        setEvents(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => buildEventStatistics(events), [events]);
  const recentEvents = events.slice(0, 10);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading events…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Studio</h1>
          <p className="text-muted-foreground mt-1">
            Event timeline visualization, replay, and explainability
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.eventsWithExplanations} with explanations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correlation Chains</CardTitle>
            <GitBranch className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCorrelationIds}</div>
            <p className="text-xs text-muted-foreground">
              Unique user action flows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Aggregates</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueAggregates}</div>
            <p className="text-xs text-muted-foreground">
              Entities with events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Explanations</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.eventsWithExplanations / stats.totalEvents) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Events with context
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/events/timeline")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Event Timeline</CardTitle>
              <CardDescription>
                View and filter event history
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/events/replay")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <History className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Event Replay</CardTitle>
              <CardDescription>
                Time-travel and rebuild projections
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/app/events/timeline?hasExplanation=true")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Explanations</CardTitle>
              <CardDescription>
                Events with AI explanations
              </CardDescription>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Events by Module */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Module</CardTitle>
            <CardDescription>Distribution across system modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Object.entries(stats.eventsByModule) as [EventModule, number][])
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([module, count]) => (
                  <div key={module} className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded ${getModuleColor(module)}`}>
                      {moduleIcons[module]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getModuleLabel(module)}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full mt-1">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Events by Aggregate Type */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Aggregate</CardTitle>
            <CardDescription>Distribution by entity type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.eventsByAggregateType)
                .filter(([, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Badge className={getAggregateColor(type as any)} variant="outline">
                      {type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${(count / stats.totalEvents) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest events across all modules</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/events/timeline">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Aggregate</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Explanation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((event) => (
                <TableRow
                  key={event.eventId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/app/events/${event.eventId}`)}
                >
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(event.occurredAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getModuleColor(event.module)}>
                      {getModuleLabel(event.module)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.eventType}
                  </TableCell>
                  <TableCell>
                    <Badge className={getAggregateColor(event.aggregate.type)} variant="outline">
                      {event.aggregate.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {event.summary}
                  </TableCell>
                  <TableCell>
                    {event.hasExplanation ? (
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Core Concepts */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Event Studio</CardTitle>
          <CardDescription>Key concepts for event-sourced architecture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Event Log
              </h4>
              <p className="text-sm text-muted-foreground">
                The event log is the system of record. All UI screens are projections
                built from events.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-blue-500" />
                Correlation Chain
              </h4>
              <p className="text-sm text-muted-foreground">
                Events with the same correlation ID belong to the same user action
                or workflow.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <History className="h-4 w-4 text-green-500" />
                Time Travel
              </h4>
              <p className="text-sm text-muted-foreground">
                Replay events to any point in time to see what the system knew
                at that moment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
